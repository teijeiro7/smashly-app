import re
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Dict, List, Optional, Any, Set

from supabase import Client
from thefuzz import fuzz

from .paddle_normalizer import normalize_paddle_name, normalize_for_comparison, slugify_paddle
from .pricing import STORES


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


class RacketManager:
    """
    Manages the catalog with rigorous cross-store deduplication.

    Supabase is the source of truth: the constructor takes rows already
    fetched from the `rackets` table (see db.get_all_rackets_for_manager),
    and `save()` writes touched entries back — no rackets.json anywhere.
    """

    def __init__(self, client: Client, rows: List[Dict[str, Any]]):
        self.client = client
        self.data: Dict[str, Any] = {}
        for row in rows:
            if not isinstance(row, dict):
                continue
            slug = row.get("slug")
            if not slug:
                continue
            self.data[slug] = self._row_to_entry(row)
        self._sanitize_loaded_data()
        self.url_map: Dict[str, str] = self._build_url_map()
        self._touched: Set[str] = set()

    # =========================================================================
    # Row <-> in-memory entry conversion
    # =========================================================================

    @staticmethod
    def _row_to_entry(row: Dict[str, Any]) -> Dict[str, Any]:
        prices = []
        for store in STORES:
            link = row.get(f"{store}_link")
            if not link:
                continue
            prices.append({
                "store": store,
                "price": row.get(f"{store}_actual_price"),
                "original_price": row.get(f"{store}_original_price"),
                "url": link,
                "currency": "EUR",
            })
        return {
            "id": row.get("id"),
            "brand": row.get("brand") or "Unknown",
            "model": row.get("model") or row.get("name") or "",
            "description": row.get("description") or "",
            "specs": row.get("specs") or {},
            "images": row.get("images") or [],
            "prices": prices,
        }

    def _entry_to_row(self, slug: str, entry: Dict[str, Any]) -> Dict[str, Any]:
        row: Dict[str, Any] = {
            "slug": slug,
            "name": entry["model"],
            "brand": entry["brand"],
            "model": entry["model"],
            "description": entry.get("description", ""),
            "specs": entry.get("specs", {}),
            "images": entry.get("images", []),
            "updated_at": _now_utc(),
        }
        any_price = False
        for p in entry.get("prices", []):
            store = p.get("store")
            if store not in STORES:
                continue
            # A scraped Product always carries a float price (never None) —
            # normalize the "no confirmed price" case (0 / 0.0) to NULL here,
            # otherwise a brand-new out-of-stock product would be stored with
            # an actual_price of 0.0 instead of comparison_only.
            price = p.get("price") or None
            original = p.get("original_price") or None
            discount = 0
            if price and original and original > price:
                discount = round((1 - price / original) * 100)
                any_price = True
            elif price:
                any_price = True
            row[f"{store}_actual_price"] = price
            row[f"{store}_original_price"] = original
            row[f"{store}_discount_percentage"] = discount
            row[f"{store}_link"] = p.get("url")
        if any_price:
            row["comparison_only"] = False
        if entry.get("id"):
            row["id"] = entry["id"]
        return row

    def save(self, dry_run: bool = False) -> int:
        """Persist every touched slug. Existing rackets update by id; brand-new ones insert."""
        written = 0
        for slug in self._touched:
            entry = self.data[slug]
            row = self._entry_to_row(slug, entry)
            if dry_run:
                written += 1
                continue
            if entry.get("id"):
                row_id = row.pop("id")
                self.client.table("rackets").update(row).eq("id", row_id).execute()
            else:
                row["created_at"] = _now_utc()
                result = self.client.table("rackets").insert(row).execute()
                if result.data:
                    entry["id"] = result.data[0]["id"]
            written += 1
        self.url_map = self._build_url_map()
        return written

    # =========================================================================
    # Sanitation / URL map
    # =========================================================================

    def _coerce_specs(self, raw_specs: Any) -> Dict[str, str]:
        """Normalize specs to dict format (legacy rows may store JSON strings)."""
        if isinstance(raw_specs, dict):
            return raw_specs
        if isinstance(raw_specs, str):
            import json
            try:
                parsed = json.loads(raw_specs)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                return {}
        return {}

    @staticmethod
    def _is_placeholder_value(value: Any) -> bool:
        if value is None:
            return True
        text = str(value).strip().lower()
        return text in {"", "n/a", "na", "n.a", "desconocido", "no disponible", "none", "null", "-"}

    @staticmethod
    def _is_invalid_shape_value(value: Any) -> bool:
        if value is None:
            return True
        text = str(value).strip().lower()
        if text in {"redonda", "diamante", "lagrima", "lágrima", "hibrida", "híbrida"}:
            return False
        if len(text) <= 2:
            return True
        invalid_tokens = {
            "en", "parte", "geom", "h", "l", "rugosa", "rugoso", "mate", "brillo", "arenoso", "relieve"
        }
        return text in invalid_tokens

    def _sanitize_loaded_data(self):
        """Defensively normalize legacy/malformed records loaded from the DB."""
        cleaned: Dict[str, Any] = {}
        for slug, racket in self.data.items():
            if not isinstance(racket, dict):
                continue

            racket["specs"] = self._coerce_specs(racket.get("specs"))
            if "Forma" in racket["specs"] and self._is_invalid_shape_value(racket["specs"].get("Forma")):
                racket["specs"].pop("Forma", None)

            images = racket.get("images", [])
            if not isinstance(images, list):
                images = [images] if images else []
            racket["images"] = [img for img in images if isinstance(img, str) and img]

            prices = racket.get("prices", [])
            if not isinstance(prices, list):
                prices = []
            racket["prices"] = [p for p in prices if isinstance(p, dict)]

            cleaned[slug] = racket
        self.data = cleaned

    def _build_url_map(self) -> Dict[str, str]:
        mapping = {}
        for slug, racket in self.data.items():
            if not isinstance(racket, dict):
                continue
            for price_entry in racket.get("prices", []):
                if isinstance(price_entry, dict) and "url" in price_entry:
                    mapping[price_entry["url"]] = slug
        return mapping

    @staticmethod
    def _optimize_image_url(url: str) -> str:
        """Optimize image URL for maximum quality."""
        if not url:
            return url
        if url.startswith('//'):
            url = f'https:{url}'
        parsed = urlparse(url)

        # Shopify cleanup
        if 'shopify.com' in parsed.netloc or 'cdn.shopify.com' in parsed.netloc:
            path = re.sub(r'_(\d+x\d*|\d*x\d+)(?:_crop_center)?(?=\.)', '', parsed.path)
            params = parse_qs(parsed.query)
            clean_params = {'v': params['v'][0]} if 'v' in params else {}
            return urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, urlencode(clean_params), parsed.fragment))

        # Magento cleanup
        if 'padelnuestro.com' in parsed.netloc:
            return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, '', parsed.fragment))

        return url

    def _detect_brand_from_name(self, name: str) -> str:
        """Helper to rescue Unknown brands."""
        name_upper = name.upper()
        # Lista de marcas prioritarias (primero las compuestas)
        brands = [
            'DROP SHOT', 'BLACK CROWN', 'ROYAL PADEL', 'STAR VIE', 'ADIDAS',
            'BULLPADEL', 'NOX', 'HEAD', 'BABOLAT', 'SIUX', 'WILSON', 'VARLION',
            'KUIKMA', 'OXYDOG', 'VIBOR-A', 'LOK', 'ENEBE', 'JOMA'
        ]
        for brand in brands:
            if brand in name_upper:
                return brand.title() if brand != 'ADIDAS' else 'Adidas'  # Case specific
        return "Unknown"

    def _normalize_name_for_comparison(self, name: str) -> str:
        """Delega en paddle_normalizer.normalize_for_comparison."""
        return normalize_for_comparison(name)

    # =========================================================================
    # CORE DEDUPLICATION LOGIC
    # =========================================================================

    def _extract_features(self, name: str) -> dict:
        name_lower = name.lower()
        # Collapse internal hyphens for suffix/feature detection: "carb-on" → "carbon"
        name_norm = re.sub(r"(?<=\w)-(?=\w)", "", name_lower)

        # Year
        year_match = re.search(r'\b(202[3-7])\b', name_norm)
        year = year_match.group(1) if year_match else None

        # Suffixes
        critical_suffixes = [
            "woman", "w", "light", "lite", "air", "junior", "jr",
            "hybrid", "ctrl", "control", "attack", "comfort", "cmf", "master",
            "limited", "ltd", "pro", "team", "elite", "flow", "fdb",
            "12k", "18k", "24k", "3k", "carbon",
        ]
        found_suffixes = {s for s in critical_suffixes if f" {s} " in f" {name_norm} " or f"-{s}" in name_norm}

        # Clean Name
        clean_name = self._normalize_name_for_comparison(name)

        return {
            "year": year,
            "suffixes": found_suffixes,
            "clean_name": clean_name
        }

    def _are_compatible(self, f_a: dict, f_b: dict) -> bool:
        # Conflict 1: Years
        if f_a['year'] and f_b['year'] and f_a['year'] != f_b['year']:
            return False

        # Conflict 2: Suffixes (Must match exactly if present)
        if f_a['suffixes'] != f_b['suffixes']:
            return False

        return True

    def merge_product(self, product: Any, store_name: str) -> Optional[str]:
        """Merge product with rigorous checks and auto-correction. Returns the slug it was merged into."""
        p_dict = product.model_dump() if hasattr(product, 'model_dump') else product.to_dict()
        p_name_raw = p_dict.get('name', '')
        # ── NORMALIZACIÓN EN IMPORT TIME ──────────────────────────────────────
        # Elimina "pala", "padel", capitalización variable, espacios extra, etc.
        # Esto garantiza que "Noxat10", "NOXAT10" y "pala Noxat10" producen
        # la misma clave y no generan entradas duplicadas en la BD.
        p_name = normalize_paddle_name(p_name_raw)
        if p_name != p_name_raw:
            print(f"  [normalizer] '{p_name_raw}' → '{p_name}'")
        p_brand = p_dict.get('brand', 'Unknown')
        p_url = p_dict.get('url', '')

        # 0. RESCUE UNKNOWN BRAND
        if p_brand == "Unknown" or p_brand == "":
            detected = self._detect_brand_from_name(p_name)
            if detected != "Unknown":
                print(f"Rescued Brand: {p_name} -> {detected}")
                p_brand = detected
                p_dict['brand'] = detected

        # 1. STRICT FILTER: Exclude Packs
        forbidden = ['pack', 'duo', 'conjunto', 'oferta', '+', 'mochila', 'paletero', 'zapatillas']
        if any(term in p_name.lower() for term in forbidden):
            return None

        slug = None

        # 2. Exact URL Match
        if p_url in self.url_map:
            slug = self.url_map[p_url]

        # 3. Hybrid Fingerprint Match
        if not slug:
            input_features = self._extract_features(p_name)
            best_score = 0
            best_match_slug = None

            for existing_slug, data in self.data.items():
                if not isinstance(data, dict):
                    continue
                # Filter A: Brand must match (normalized)
                existing_brand = data.get('brand', 'Unknown')

                # Fix for existing bad data in DB (e.g. "Unknown" in DB but real brand now)
                if existing_brand == "Unknown":
                    existing_brand = self._detect_brand_from_name(data['model'])

                if existing_brand.lower() != p_brand.lower():
                    continue

                existing_model = data.get('model', '')
                if not isinstance(existing_model, str) or not existing_model:
                    continue

                existing_features = self._extract_features(existing_model)

                # Filter B: Hard Compatibility
                if not self._are_compatible(input_features, existing_features):
                    continue

                # Filter C: Fuzzy Match
                score = fuzz.token_sort_ratio(input_features['clean_name'], existing_features['clean_name'])

                if input_features['year'] and input_features['year'] == existing_features['year']:
                    score += 5

                # Threshold
                if score > 88:
                    if score > best_score:
                        best_score = score
                        best_match_slug = existing_slug

            if best_match_slug:
                slug = best_match_slug
                existing_entry = self.data[slug]

                # Logic: If current has no year, but new one does, take new name.
                existing_feats = self._extract_features(existing_entry['model'])
                if not existing_feats['year'] and input_features['year']:
                    existing_entry['model'] = p_name
                # Logic: If both have year (or neither), prefer the one WITHOUT player name (cleaner)
                elif len(p_name) < len(existing_entry['model']):
                    pass  # Simple heuristic: shorter often means less marketing fluff

            else:
                # No match found — create new entry
                slug_brand = p_brand if p_brand != "Unknown" else "generic"

                brand_prefix = slug_brand.lower()
                model_lower = p_name.lower()

                if model_lower.startswith(brand_prefix):
                    slug = slugify_paddle("", p_name)
                else:
                    slug = slugify_paddle(slug_brand, p_name)

                counter = 1
                original_slug = slug
                while slug in self.data:
                    slug = f"{original_slug}-{counter}"
                    counter += 1

                print(f"New Racket: {p_name} [{slug}]")
                self.data[slug] = {
                    "id": None,
                    "brand": p_brand,
                    "model": p_name,
                    "description": p_dict.get('description', ''),
                    "specs": {},
                    "images": [],
                    "prices": []
                }

        racket_entry = self.data[slug]
        self.url_map[p_url] = slug

        # Legacy safeguard: old records may still contain specs as serialized JSON string.
        racket_entry["specs"] = self._coerce_specs(racket_entry.get("specs"))

        # Force Brand update if it was Unknown before
        if racket_entry.get('brand') == "Unknown" and p_brand != "Unknown":
            racket_entry['brand'] = p_brand

        # 5. Merge Specs
        for key, value in p_dict.get('specs', {}).items():
            curr_val = racket_entry["specs"].get(key)

            should_replace = False
            if key == "Forma":
                should_replace = self._is_invalid_shape_value(curr_val) and not self._is_invalid_shape_value(value)
            else:
                should_replace = self._is_placeholder_value(curr_val) and not self._is_placeholder_value(value)

            if should_replace or (not curr_val):
                racket_entry["specs"][key] = value

        # 6. Merge Images
        new_imgs = p_dict.get('images') or []
        if p_dict.get('image') and p_dict.get('image') not in new_imgs:
            new_imgs.insert(0, p_dict.get('image'))

        current_imgs = set(racket_entry["images"])
        for img in new_imgs:
            opt_img = self._optimize_image_url(img)
            if opt_img and opt_img not in current_imgs:
                racket_entry["images"].append(opt_img)
                current_imgs.add(opt_img)

        # 7. Update Price
        store_entry = next((item for item in racket_entry["prices"] if item["store"] == store_name), None)

        if store_entry:
            store_entry["price"] = p_dict.get('price')
            store_entry["url"] = p_url
            if p_dict.get('original_price'):
                store_entry["original_price"] = p_dict.get('original_price')
        else:
            racket_entry["prices"].append({
                "store": store_name,
                "price": p_dict.get('price'),
                "original_price": p_dict.get('original_price'),
                "url": p_url,
                "currency": "EUR",
            })

        self._touched.add(slug)
        return slug
