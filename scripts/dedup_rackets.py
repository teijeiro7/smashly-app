#!/usr/bin/env python3
"""
Duplicate racket detector and merger for Smashly catalog.

Rules (conservative):
  1. COMPARISON_ONLY: comparison_only=True + the base name (without year) of the
     comparison entry is a DIRECT SUBSTRING of the buyable entry's name, or vice versa,
     AND both belong to the same brand. Requires at least 60% of the shorter name
     to be shared as a contiguous prefix — no loose token matching.
  2. PLAYER_EDITION: model_b == model_a + " " + suffix where suffix looks like a
     person's full name (≥ 2 words, no product keywords like lite/ctrl/control/air/pro
     /force/team/silver/black/white/blue/red/soft/hard/power/speed/tour).

Usage:
  python3 dedup_rackets.py             # dry run
  python3 dedup_rackets.py --execute   # apply changes
"""

import sys
import re
import json
import urllib.request

SUPABASE_URL = "https://lrdgyfmkkboyhoycrnov.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZGd5Zm1ra2JveWhveWNybm92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MTg0NSwiZXhwIjoyMDY3MDQ3ODQ1fQ.etjT9fa5Ev8OX56IP1mRRwh-Ow7lZl93MfLvxfTM8mc"

STORE_COLS = [
    "padelnuestro_actual_price", "padelnuestro_original_price",
    "padelnuestro_discount_percentage", "padelnuestro_link", "padelnuestro_last_seen",
    "padelmarket_actual_price", "padelmarket_original_price",
    "padelmarket_discount_percentage", "padelmarket_link", "padelmarket_last_seen",
    "padelproshop_actual_price", "padelproshop_original_price",
    "padelproshop_discount_percentage", "padelproshop_link", "padelproshop_last_seen",
]

# Words that disqualify a suffix from being a player name
PRODUCT_KEYWORDS = {
    "lite", "light", "team", "pro", "elite", "control", "ctrl", "force", "air",
    "power", "silver", "gold", "black", "white", "blue", "red", "green", "orange",
    "yellow", "grey", "gray", "soft", "hard", "speed", "tour", "carbon", "attack",
    "comfort", "motion", "extreme", "crown", "mujer", "woman", "junior", "boy",
    "girl", "man", "plus", "max", "ultra", "super", "mini", "nano", "flash",
    "premium", "special", "limited", "edition", "edt", "series", "collection",
    "gen", "generation", "version", "v2", "v3", "v4", "v5",
    "2.0", "3.0", "4.0", "1.0", "2.5", "3.3", "3.4", "3.5",
    "air", "fdb", "prf", "ltd",
    "finish", "sand", "rough", "smooth", "texture", "mat", "gloss",
    "round", "eva", "carbon", "fiber", "fibre", "composite",
    "reedicion", "reedición", "reissue",
}

YEAR_RE = re.compile(r'\b(20\d{2})\b')


def supabase_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def supabase_patch(table, row_id, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    payload = json.dumps(data).encode()
    req = urllib.request.Request(url, data=payload, method="PATCH", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    with urllib.request.urlopen(req) as r:
        return r.status


def supabase_delete(table, row_id):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    req = urllib.request.Request(url, method="DELETE", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=minimal",
    })
    with urllib.request.urlopen(req) as r:
        return r.status


def fetch_all_rackets():
    cols = ["id", "brand", "model", "comparison_only"] + STORE_COLS
    all_data = []
    offset, page = 0, 500
    while True:
        path = f"rackets?select={','.join(cols)}&order=brand,model&limit={page}&offset={offset}"
        chunk = supabase_get(path)
        if not chunk:
            break
        all_data.extend(chunk)
        if len(chunk) < page:
            break
        offset += page
    return all_data


def norm(s):
    return (s or '').lower().strip()


def strip_year(s):
    return YEAR_RE.sub('', s).strip()


def is_player_name(suffix):
    """True only if suffix looks like a real person's name: ≥2 words, no product keywords."""
    suffix = suffix.strip().lstrip('- ').strip()
    if not suffix:
        return False
    words = re.split(r'[\s.]+', suffix)
    words = [w for w in words if w]
    # Must have at least 2 parts (first + last name, or initial + last)
    if len(words) < 2:
        return False
    # None of the words should be product keywords
    if any(w in PRODUCT_KEYWORDS for w in words):
        return False
    # All words should start with a letter (not digit)
    if not all(w[0].isalpha() for w in words if w):
        return False
    return True


def is_same_base_model(comp_model, buyable_model):
    """
    True if after stripping all years, both names are exactly equal
    (same racket, different year marking) OR one is a direct continuation
    of the other with ONLY a year difference (no extra product words).
    """
    ca = strip_year(norm(comp_model)).strip()
    cb = strip_year(norm(buyable_model)).strip()
    if not ca or not cb:
        return False
    # Exact match after year removal
    if ca == cb:
        return True
    # One is a prefix of the other with NO extra words (only whitespace difference)
    # This handles "model name" vs "model name " edge cases only — not partial word matches
    return False


def store_count(r):
    return sum(1 for c in STORE_COLS if r.get(c))


def fields_to_merge(base, donor):
    return {col: donor[col] for col in STORE_COLS if not base.get(col) and donor.get(col)}


def find_duplicates(rackets):
    by_brand = {}
    for r in rackets:
        by_brand.setdefault(r['brand'] or '', []).append(r)

    pairs = []
    seen_ids = set()

    for brand, group in by_brand.items():
        for i, a in enumerate(group):
            for j, b in enumerate(group):
                if i >= j:
                    continue
                if a['id'] in seen_ids or b['id'] in seen_ids:
                    continue

                ma = norm(a['model'])
                mb = norm(b['model'])

                # Rule 1: comparison_only + direct substring name match
                if a['comparison_only'] != b['comparison_only']:
                    comp = a if a['comparison_only'] else b
                    buyable = b if a['comparison_only'] else a
                    if is_same_base_model(comp['model'], buyable['model']):
                        pairs.append((buyable, comp, 'delete_comp'))
                        seen_ids.add(comp['id'])
                        seen_ids.add(buyable['id'])
                        continue

                # Rule 2: player edition — longer == shorter + " " + player_name
                shorter, longer = (a, b) if len(ma) <= len(mb) else (b, a)
                ms = norm(shorter['model'])
                ml = norm(longer['model'])
                if ml.startswith(ms + ' ') or ml.startswith(ms + ' - '):
                    suffix = ml[len(ms):].lstrip(' -').strip()
                    if is_player_name(suffix):
                        pairs.append((shorter, longer, 'merge_player'))
                        seen_ids.add(shorter['id'])
                        seen_ids.add(longer['id'])

    return pairs


def run(execute=False, player_only=False):
    print("Fetching rackets...")
    rackets = fetch_all_rackets()
    print(f"Total: {len(rackets)} rackets\n")

    pairs = find_duplicates(rackets)
    comp_pairs = [(b, d) for b, d, a in pairs if a == 'delete_comp']
    player_pairs = [(b, d) for b, d, a in pairs if a == 'merge_player']

    print(f"=== COMPARISON_ONLY TO DELETE ({len(comp_pairs)}) ===")
    for base, dup in comp_pairs:
        print(f"  KEEP  [{base['id']}] {base['model']}")
        print(f"  DEL   [{dup['id']}] {dup['model']}")
        print()

    print(f"=== PLAYER EDITIONS TO MERGE+DELETE ({len(player_pairs)}) ===")
    for base, dup in player_pairs:
        updates = fields_to_merge(base, dup)
        print(f"  BASE  [{base['id']}] {base['model']}")
        print(f"  MERGE [{dup['id']}] {dup['model']}")
        if updates:
            for k, v in updates.items():
                print(f"         copy {k}: {v}")
        else:
            print(f"         (no new store data)")
        print()

    print(f"Total: {len(comp_pairs)} deletions + {len(player_pairs)} player merges = {len(pairs)} ops")

    if not execute:
        print("\n[DRY RUN] Pass --execute to apply changes.")
        return

    print("\n[EXECUTING]...")
    errors = 0
    for base, dup in ([] if player_only else comp_pairs):
        try:
            supabase_delete('rackets', dup['id'])
            print(f"  DELETED {dup['model']}")
        except Exception as e:
            print(f"  ERROR {dup['id']}: {e}")
            errors += 1

    for base, dup in player_pairs:
        updates = fields_to_merge(base, dup)
        try:
            if updates:
                supabase_patch('rackets', base['id'], updates)
                print(f"  PATCHED {base['model']} (+{len(updates)} from {dup['model']})")
            supabase_delete('rackets', dup['id'])
            print(f"  DELETED {dup['model']}")
        except Exception as e:
            print(f"  ERROR {dup['id']}: {e}")
            errors += 1

    print(f"\nDone. Errors: {errors}")


if __name__ == '__main__':
    execute = '--execute' in sys.argv
    player_only = '--player-only' in sys.argv
    run(execute=execute, player_only=player_only)
