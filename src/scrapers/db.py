"""
db.py — Supabase I/O for the catalog sync. Supabase is the single source of
truth (no more rackets.json): every read and write in the pipeline goes
through this module.

Two things this module fixes relative to the old inline code in
sync_catalog.py:

  1. Pagination on every full-table read. `mark_discontinued_rackets` used
     to query without a range and PostgREST silently cut it off at 1000
     rows — 217 rackets were never evaluated for discontinuation.
  2. Batched writes. `mark_discontinued_rackets` did one HTTP request per
     racket just to bump `last_seen` (~1700 requests on a full catalog).
     `batch_upsert` turns that into a handful of chunked upserts.
"""

import os
from typing import Any, Dict, Iterable, List, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

PAGE_SIZE = 1000
UPSERT_BATCH_SIZE = 200
REQUIRED_ENV_VARS = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")


def _load_env() -> None:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for rel in ["../../backend/api/.env", "../../.env", ".env"]:
        load_dotenv(os.path.join(script_dir, rel))


_load_env()


def missing_env_vars() -> List[str]:
    """Env vars still absent. Checked before scraping — no point spending
    10+ minutes scraping only to discover there's nowhere to write."""
    return [name for name in REQUIRED_ENV_VARS if not os.getenv(name)]


def get_client() -> Client:
    missing = missing_env_vars()
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def paginate(client: Client, table: str, columns: str) -> List[Dict[str, Any]]:
    """Fetch every row of `table`, selecting `columns`, in PAGE_SIZE chunks."""
    rows: List[Dict[str, Any]] = []
    page = 0
    while True:
        start = page * PAGE_SIZE
        end = start + PAGE_SIZE - 1
        result = client.table(table).select(columns).range(start, end).execute()
        chunk = result.data or []
        rows.extend(chunk)
        if len(chunk) < PAGE_SIZE:
            break
        page += 1
    return rows


def _fetch_names(client: Client, ids: List[int]) -> Dict[int, str]:
    names: Dict[int, str] = {}
    chunk_size = 500
    for i in range(0, len(ids), chunk_size):
        chunk = ids[i : i + chunk_size]
        result = client.table("rackets").select("id, name").in_("id", chunk).execute()
        for row in result.data or []:
            names[row["id"]] = row["name"]
    return names


def _carry_required_not_null_columns(client: Client, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    `rackets.name` is NOT NULL with no default. PostgREST's upsert is an
    `INSERT ... ON CONFLICT DO UPDATE` under the hood, and Postgres
    validates NOT NULL constraints against the tentative INSERT row even
    when the row already exists and the statement will really just UPDATE
    — so a partial-column upsert (price-only, a single flag, ...) on an
    existing racket fails unless `name` rides along unchanged. Fetch and
    attach it for any row that doesn't already carry it.
    """
    missing_ids = [r["id"] for r in rows if "name" not in r and r.get("id") is not None]
    if not missing_ids:
        return rows
    name_map = _fetch_names(client, missing_ids)
    return [
        {**r, "name": name_map[r["id"]]} if "name" not in r and r.get("id") in name_map else r
        for r in rows
    ]


def batch_upsert(client: Client, table: str, rows: List[Dict[str, Any]], *, batch_size: int = UPSERT_BATCH_SIZE) -> int:
    """
    Upsert `rows` in chunks. Every row MUST carry the primary key `id` and
    the SAME set of columns as the other rows in its chunk — Postgres fills
    any column missing from a given row's JSON with NULL, so mixing rows
    with different column sets in one chunk would silently null out
    columns some rows never intended to touch.
    """
    if not rows:
        return 0
    if table == "rackets":
        rows = _carry_required_not_null_columns(client, rows)
    written = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        client.table(table).upsert(chunk, on_conflict="id").execute()
        written += len(chunk)
    return written


def get_slug_id_map(client: Client) -> Dict[str, int]:
    rows = paginate(client, "rackets", "id, slug")
    return {r["slug"]: r["id"] for r in rows if r.get("slug")}


def get_rackets_for_store(client: Client, store: str) -> List[Dict[str, Any]]:
    """Every racket that has a URL for `store`, with what's needed to decide a price update."""
    cols = f"id, slug, {store}_link, {store}_actual_price, {store}_original_price"
    rows = paginate(client, "rackets", cols)
    return [r for r in rows if r.get(f"{store}_link")]


def record_price_history(client: Client, entries: List[Dict[str, Any]]) -> int:
    """Batch-insert price_history rows: racket_id, store, price, original_price, discount_percentage, recorded_at."""
    if not entries:
        return 0
    written = 0
    for i in range(0, len(entries), UPSERT_BATCH_SIZE):
        chunk = entries[i : i + UPSERT_BATCH_SIZE]
        client.table("price_history").insert(chunk).execute()
        written += len(chunk)
    return written


def finalize_comparison_flags(client: Client) -> int:
    """
    Recompute `comparison_only`/`on_offer` for the whole catalog from
    currently-stored prices, in one pass after all three per-store refresh
    jobs have landed. Doing this inside each matrix job instead would have
    three jobs racing to set a catalog-wide flag from stale snapshots of
    the other two stores' prices.
    """
    from .pricing import STORES, compute_comparison_only, compute_on_offer

    cols = (
        "id, comparison_only, on_offer, "
        + ", ".join(f"{s}_actual_price" for s in STORES)
        + ", "
        + ", ".join(f"{s}_discount_percentage" for s in STORES)
    )
    rows = paginate(client, "rackets", cols)

    updates = []
    for row in rows:
        prices = {s: row.get(f"{s}_actual_price") for s in STORES}
        discounts = {s: row.get(f"{s}_discount_percentage") for s in STORES}
        comparison_only = compute_comparison_only(prices)
        on_offer = compute_on_offer(discounts)
        if comparison_only != row.get("comparison_only") or on_offer != row.get("on_offer"):
            updates.append({"id": row["id"], "comparison_only": comparison_only, "on_offer": on_offer})

    return batch_upsert(client, "rackets", updates)


def update_last_seen(client: Client, store: str, racket_ids: Iterable[int], now_iso: str) -> int:
    """Batch-update `{store}_last_seen` for every racket id seen in this store's category scan."""
    rows = [{"id": rid, f"{store}_last_seen": now_iso} for rid in racket_ids]
    return batch_upsert(client, "rackets", rows)


def mark_discontinued(client: Client, threshold_iso: str) -> List[int]:
    """
    Mark discontinued every racket that has been scanned at least once but
    has no `last_seen` newer than `threshold_iso` in any of the three
    stores. Paginated (see module docstring) — the un-paginated original
    silently ignored everything past row 1000.
    """
    from .pricing import STORES

    cols = "id, slug, discontinued, " + ", ".join(f"{s}_last_seen" for s in STORES)
    rows = paginate(client, "rackets", cols)

    to_mark: List[int] = []
    for row in rows:
        if row.get("discontinued"):
            continue
        last_seens = [row.get(f"{s}_last_seen") for s in STORES]
        if all(ls is None for ls in last_seens):
            continue  # never scanned yet — absence of data isn't a discontinued signal
        has_recent = any(ls and ls > threshold_iso for ls in last_seens)
        if not has_recent:
            to_mark.append(row["id"])

    if to_mark:
        batch_upsert(client, "rackets", [{"id": rid, "discontinued": True} for rid in to_mark])
    return to_mark


def get_all_rackets_for_manager(client: Client) -> List[Dict[str, Any]]:
    """Full catalog rows needed by RacketManager for cross-store fuzzy matching."""
    from .pricing import STORES

    price_cols = ", ".join(
        f"{s}_{field}" for s in STORES for field in ("actual_price", "original_price", "discount_percentage", "link")
    )
    cols = f"id, slug, brand, model, name, description, images, specs, {price_cols}"
    return paginate(client, "rackets", cols)
