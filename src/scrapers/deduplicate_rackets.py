#!/usr/bin/env python3
"""
deduplicate_rackets.py — One-shot deduplication of rackets table in Supabase.

Merges duplicate rackets caused by "(pala)" suffix, "brand-brand-" slug bugs,
and "carb-on" vs "carbon" spelling variations.

For each duplicate group:
  1. Pick canonical entry (prefer more prices, then cleaner slug)
  2. Transfer prices + images from duplicates to canonical
  3. Take radar metrics from the most trusted entry (most prices)
  4. Delete duplicate entries

Usage:
  python -m src.scrapers.deduplicate_rackets --dry-run
  python -m src.scrapers.deduplicate_rackets
"""

import re
import os
import sys
import argparse
import unicodedata
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


def _get_client() -> Client:
    """Lazy client construction — reading env vars at import time meant a
    missing SUPABASE_SERVICE_ROLE_KEY crashed the whole sync_catalog import,
    before it ever got a chance to scrape anything."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)

_JUNIOR_PATTERN = re.compile(
    r'\b(junior|jr|kid|kids|ni[ñn]o|ni[ñn]a|infantil|bambini|bambino)\b',
    re.IGNORECASE,
)


def is_junior_racket(name: str) -> bool:
    return bool(_JUNIOR_PATTERN.search(name or ""))


STORES = ["padelnuestro", "padelmarket", "padelproshop"]
STORE_PRICE_COLS = [
    col
    for store in STORES
    for col in [
        f"{store}_actual_price", f"{store}_original_price",
        f"{store}_discount_percentage", f"{store}_link",
    ]
]
RADAR_COLS = ["radar_potencia", "radar_control", "radar_manejabilidad", "radar_punto_dulce", "radar_salida_bola"]

# Player edition suffixes that mark distinct product variants — do NOT merge across these
VARIANT_SUFFIXES = ["fdb", "woman", "w", "light", "lite", "junior", "jr"]

_BRAND_ALIASES: dict = {
    "vibor-a": "vibor-a",
    "vibora": "vibor-a",
    "víbora": "vibor-a",
    "starvie": "starvie",
    "star vie": "starvie",
    "dropshot": "drop shot",
    "drop shot": "drop shot",
    "blackcrown": "black crown",
    "black crown": "black crown",
    "royal padel": "royal padel",
    "royalpadel": "royal padel",
}


def normalize_brand(brand: str) -> str:
    """Normalize brand name to canonical form for deduplication."""
    return _BRAND_ALIASES.get(brand.lower().strip(), brand.lower().strip())


# Country name translations: some stores name editions in Spanish, others in English.
# Normalize all to canonical English so duplicates resolve to the same key.
_COUNTRY_MAP: dict[str, str] = {
    "españa": "spain", "espana": "spain",
    "italia": "italy",
    "mexico": "mexico", "méxico": "mexico",
    "holanda": "netherlands",
    "alemania": "germany",
    "francia": "france",
    "belgica": "belgium", "bélgica": "belgium",
    "inglaterra": "england",
    "eeuu": "usa",
}
_COUNTRY_RE = re.compile(
    r'\b(' + '|'.join(re.escape(k) for k in _COUNTRY_MAP) + r')\b',
    re.IGNORECASE,
)


def _strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def normalize_name_base(s: str) -> str:
    """
    Normalize racket name WITHOUT stripping year.
    Used as grouping key — different years = different products.
    """
    if not s:
        return ""
    s = s.lower().strip()
    s = _strip_accents(s)
    s = re.sub(r"\s*\([^)]*\)\s*", " ", s)   # strip (pala), (padel), etc.
    s = re.sub(r"\bpala\b", "", s)
    s = re.sub(r"(?<=\w)-(?=\w)", "", s)       # carb-on → carbon
    s = re.sub(r"\s+by\s+[a-z]+(?:\s+[a-z]+)*", "", s)  # strip "by agustin tapia" player attributions
    # Strip material descriptors added inconsistently by stores
    s = re.sub(r"\b(alum|aluminio)\b", "", s)
    # Normalize country names: stores use local language (españa, italia...) or English (spain, italy...)
    s = _COUNTRY_RE.sub(lambda m: _COUNTRY_MAP[_strip_accents(m.group(0).lower())], s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def extract_year(s: str) -> str | None:
    m = re.search(r"\b(202\d)\b", s or "")
    return m.group(1) if m else None


def get_variant_suffix(name: str) -> str:
    """Return variant suffix if present (fdb, woman, etc.), else empty string."""
    n = normalize_name_base(name)
    for suffix in VARIANT_SUFFIXES:
        if re.search(rf"\b{re.escape(suffix)}\b", n):
            return suffix
    return ""


def score_entry(row: dict) -> int:
    """Higher = better canonical. Prices > radar completeness > clean slug > images."""
    score = 0
    price_count = 0
    for store in STORES:
        if row.get(f"{store}_actual_price") is not None:
            score += 10
            price_count += 1
    # Bonus for having all radar metrics
    radar_complete = all(row.get(c) is not None for c in RADAR_COLS)
    if radar_complete:
        score += 5
    slug = row.get("slug", "")
    brand = row.get("brand", "").lower().replace(" ", "-")
    if brand and slug.startswith(f"{brand}-{brand}-"):
        score -= 5
    if slug.endswith("-pala") or "-pala-" in slug:
        score -= 3
    score += len(row.get("images") or [])
    return score


def fetch_all_rackets(client: Client) -> list:
    rows = []
    page_size = 1000
    page = 0
    while True:
        cols = (
            "id, slug, name, brand, model, images, specs, description, "
            "on_offer, comparison_only, discontinued, "
            + ", ".join(STORE_PRICE_COLS + RADAR_COLS)
        )
        result = client.table("rackets").select(cols).range(page * page_size, (page + 1) * page_size - 1).execute()
        chunk = result.data or []
        rows.extend(chunk)
        if len(chunk) < page_size:
            break
        page += 1
    return rows


def find_duplicate_groups(rows: list) -> list:
    """
    Group rows into duplicate sets.

    Rules:
    - Different years (both explicit) → different products, do NOT merge
    - One has year, other lacks year → same product, DO merge
    - "carb-on" vs "carbon" → normalized to same base, DO merge
    - Different variant suffixes (fdb/woman/etc.) → different products, do NOT merge
    """
    # First pass: group by (brand, base_name_without_year, variant)
    pre_groups: dict = {}
    for r in rows:
        name_raw = r.get("model") or r.get("name", "") or ""
        base = normalize_name_base(name_raw)
        # Remove year from base for pre-grouping key
        base_no_year = re.sub(r"\b202\d\b", "", base).strip()
        variant = get_variant_suffix(name_raw)
        brand = normalize_brand(r.get("brand", ""))
        key = (brand, base_no_year, variant)
        pre_groups.setdefault(key, []).append(r)

    # Second pass: within each pre-group, sub-divide by year compatibility
    # Entries with the same year merge; entries without a year merge with same-year group
    final_groups: list = []
    for entries in pre_groups.values():
        if len(entries) < 2:
            continue

        year_buckets: dict = {}   # year_str → list of entries
        no_year: list = []

        for e in entries:
            yr = extract_year(e.get("model") or e.get("name") or "")
            if yr:
                year_buckets.setdefault(yr, []).append(e)
            else:
                no_year.append(e)

        if not year_buckets:
            # All entries lack year — merge them all
            if len(no_year) > 1:
                final_groups.append(no_year)
        elif len(year_buckets) == 1:
            # One year group + possibly no-year entries → merge all
            yr = next(iter(year_buckets))
            combined = year_buckets[yr] + no_year
            if len(combined) > 1:
                final_groups.append(combined)
        else:
            # Multiple distinct years: never cross-merge year groups
            # No-year entries get attached to each year group independently
            # (if ambiguous, conservatively skip no-year attachment)
            for yr, yr_entries in year_buckets.items():
                # Only merge no-year entries if there is exactly one year group they could belong to
                if len(year_buckets) == 1:
                    combined = yr_entries + no_year
                else:
                    combined = yr_entries
                if len(combined) > 1:
                    final_groups.append(combined)
            # No-year entries that are ambiguous across multiple year groups: skip
            if no_year and len(year_buckets) > 1:
                pass  # too ambiguous to auto-merge

    return final_groups


def _strip_pala_noise(s: str) -> str:
    """Remove store noise: (pala) suffix, leading/trailing 'pala' word."""
    if not s:
        return s
    s = re.sub(r"\s*\(pala\)\s*", " ", s, flags=re.IGNORECASE).strip()
    s = re.sub(r"(?i)^pala\s+", "", s).strip()
    s = re.sub(r"(?i)\s+pala$", "", s).strip()
    return s


def _clean_pala_names(client: Client, rows: list, dry_run: bool) -> int:
    """Strip stray (pala) noise from name/model fields. Returns count of rows fixed."""
    fixed = 0
    for r in rows:
        name_clean = _strip_pala_noise(r.get("name") or "")
        model_clean = _strip_pala_noise(r.get("model") or "")
        updates: dict = {}
        if name_clean != (r.get("name") or ""):
            updates["name"] = name_clean
        if model_clean != (r.get("model") or ""):
            updates["model"] = model_clean
        if updates:
            print(f"  clean id={r['id']} '{r.get('name')}' → '{name_clean}'")
            if not dry_run:
                client.table("rackets").update(updates).eq("id", r["id"]).execute()
            fixed += 1
    return fixed


def run(dry_run: bool, delete_cap: Optional[int] = 15) -> dict:
    """
    Deduplicate the catalog. `delete_cap` is a safety ceiling: if the plan
    would delete more rows than that (junior rackets + duplicate merges
    combined), nothing is deleted — the plan is printed for manual review
    instead. This runs unattended every week; a store changing its HTML
    template must not be able to trigger a mass deletion.
    """
    client = _get_client()
    print("Fetching rackets...")
    rows = fetch_all_rackets(client)
    print(f"Total: {len(rows)}")

    # Strip (pala) noise from names before any other processing
    print("\nCleaning (pala) noise from names...")
    cleaned = _clean_pala_names(client, rows, dry_run)
    if cleaned:
        print(f"  Fixed: {cleaned} rackets")
        # Re-fetch so subsequent steps work with clean names
        if not dry_run:
            rows = fetch_all_rackets(client)
    else:
        print("  No names needed cleaning.")

    # Remove junior/kid rackets from DB and exclude from dedup
    junior_rows = [r for r in rows if is_junior_racket(r.get("name") or r.get("model") or "")]
    adult_rows = [r for r in rows if not is_junior_racket(r.get("name") or r.get("model") or "")]
    rows = adult_rows

    groups = find_duplicate_groups(rows)
    for group in groups:
        group.sort(key=score_entry, reverse=True)

    total_planned_deletes = len(junior_rows) + sum(len(g) - 1 for g in groups)
    print(f"Duplicate groups: {len(groups)} | junior rackets: {len(junior_rows)} | total a borrar: {total_planned_deletes}\n")

    if not dry_run and delete_cap is not None and total_planned_deletes > delete_cap:
        print(f"⚠️  ABORTADO: el plan borraría {total_planned_deletes} filas, por encima del techo de {delete_cap}.")
        print("Nada se ha borrado. Revisa con --dry-run y ejecuta manualmente si el plan es correcto.\n")
        for r in junior_rows:
            print(f"  [ABORTADO] borraría (junior) id={r['id']} name={r.get('name') or r.get('model')}")
        for group in groups:
            canonical, duplicates = group[0], group[1:]
            for dup in duplicates:
                print(f"  [ABORTADO] borraría id={dup['id']} slug={dup['slug']} (canonical id={canonical['id']} slug={canonical['slug']})")
        return {"aborted": True, "planned_deletes": total_planned_deletes, "cap": delete_cap, "merged": 0, "deleted": 0}

    if junior_rows:
        print(f"Junior rackets to delete: {len(junior_rows)}")
        for r in junior_rows:
            print(f"  delete id={r['id']} name={r.get('name') or r.get('model')}")
            if not dry_run:
                client.table("rackets").delete().eq("id", r["id"]).execute()
        print()

    merged = 0
    deleted = 0

    for group in groups:
        group.sort(key=score_entry, reverse=True)
        canonical = group[0]
        duplicates = group[1:]

        print(f"[{canonical.get('brand')}] canonical id={canonical['id']} slug={canonical['slug']}")

        price_update: dict = {}
        merged_images = list(canonical.get("images") or [])
        merged_images_set = set(merged_images)

        # Find entry with most prices for radar source (most reliable data)
        all_entries = [canonical] + duplicates
        radar_source = max(all_entries, key=lambda r: sum(1 for s in STORES if r.get(f"{s}_actual_price") is not None))

        for dup in duplicates:
            print(f"  merge <- id={dup['id']} slug={dup['slug']}")
            for store in STORES:
                price_col = f"{store}_actual_price"
                if canonical.get(price_col) is None and dup.get(price_col) is not None:
                    for col in [f"{store}_actual_price", f"{store}_original_price",
                                f"{store}_discount_percentage", f"{store}_link"]:
                        price_update[col] = dup.get(col)
            for img in (dup.get("images") or []):
                if img and img not in merged_images_set:
                    merged_images.append(img)
                    merged_images_set.add(img)

        canonical_update: dict = {}
        if price_update:
            canonical_update.update(price_update)
        if merged_images != (canonical.get("images") or []):
            canonical_update["images"] = merged_images

        # Sync radar from most-trusted entry if canonical differs or lacks values
        if radar_source["id"] != canonical["id"]:
            for col in RADAR_COLS:
                src_val = radar_source.get(col)
                can_val = canonical.get(col)
                if src_val is not None and src_val != can_val:
                    canonical_update[col] = src_val
                    print(f"  radar {col}: {can_val} → {src_val} (from id={radar_source['id']})")

        name_raw = canonical.get("name") or canonical.get("model") or ""
        name_clean = re.sub(r"\s*\(pala\)\s*", " ", name_raw, flags=re.IGNORECASE).strip()
        if name_clean != name_raw:
            canonical_update["name"] = name_clean
            canonical_update["model"] = name_clean

        if canonical_update:
            if not dry_run:
                client.table("rackets").update(canonical_update).eq("id", canonical["id"]).execute()
            print(f"  updated canonical: {list(canonical_update.keys())}")
            merged += 1

        for dup in duplicates:
            if not dry_run:
                client.table("rackets").delete().eq("id", dup["id"]).execute()
            print(f"  deleted id={dup['id']} slug={dup['slug']}")
            deleted += 1

        print()

    print(f"Done. Canonicals updated: {merged} | Duplicates deleted: {deleted}")
    if dry_run:
        print("(DRY-RUN — no changes written)")

    return {"aborted": False, "planned_deletes": total_planned_deletes, "cap": delete_cap, "merged": merged, "deleted": deleted}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--delete-cap", type=int, default=15, help="Máximo de filas a borrar antes de abortar (default 15)")
    parser.add_argument("--no-cap", action="store_true", help="Desactiva el techo de borrado")
    args = parser.parse_args()
    result = run(dry_run=args.dry_run, delete_cap=None if args.no_cap else args.delete_cap)
    sys.exit(1 if result.get("aborted") else 0)
