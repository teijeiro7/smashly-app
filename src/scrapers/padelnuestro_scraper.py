import html as _html
import json
import re
import urllib.request
import asyncio
from typing import Dict, List, Optional
from .base_scraper import (
    BaseScraper, Product, normalize_specs, is_junior_racket,
    FetchOutcome, FetchResult, ScraperGone, sync_fetch_with_retry, ssl_ctx,
)


class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store."""

    # Label -> spec key for the server-rendered "description-attributes"
    # table on the product page (Magento's additional-attributes-wrapper).
    # This is the SAME structured data the GraphQL API used to expose
    # (option IDs already resolved to labels by the store) — GraphQL itself
    # is permanently blocked by the store's WAF (403, Fastly error 54113,
    # confirmed with every header/cookie combination tried), and the
    # current storefront bundle doesn't call it either, so there is nothing
    # left to enrich from there. This table comes for free in the same
    # HTML fetch already used for price/name.
    _ATTRIBUTE_TABLE_LABELS = {
        "marca", "color", "color 2", "producto", "balance", "núcleo",
        "cara", "formato", "dureza", "nivel de juego", "acabado", "forma",
        "superfície", "superficie", "tipo de juego", "colección jugadores", "jugador",
    }

    def _parse_attribute_table(self, html: str) -> Dict[str, str]:
        """Extract the description-attributes label/value pairs from the page."""
        specs: Dict[str, str] = {}
        for label, value in re.findall(
            r'description-attributes-label">([^<]+)</span>\s*'
            r'<span class="description-attributes-value">\s*([^<]+?)\s*</span>',
            html,
        ):
            label = _html.unescape(label).strip()
            value = _html.unescape(value).strip()
            if label.lower() in self._ATTRIBUTE_TABLE_LABELS and value:
                specs[label] = value
        return specs

    def _parse_specs_from_html(self, body_html: str) -> Dict[str, str]:
        """Parse specs from description HTML using regex."""
        specs: Dict[str, str] = {}
        if not body_html:
            return specs

        text = _html.unescape(body_html)
        text = (
            text.replace("&nbsp;", " ")
            .replace("<br>", " ")
            .replace("</p>", " ")
            .replace("<p>", " ")
        )
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"\s+", " ", text).strip()

        # 1. Forma — buscar por palabras clave normalizadas (no regex de una palabra)
        _SHAPE_KW = [
            (['lagrima', 'lágrima', 'gota', 'tear'],        'Lágrima'),
            (['diamante', 'diamond'],                         'Diamante'),
            (['redonda', 'round', 'redondo'],                 'Redonda'),
            (['híbrida', 'hibrida', 'hybrid'],                'Híbrida'),
        ]
        text_l = text.lower()
        for keywords, label in _SHAPE_KW:
            if any(re.search(r'\b' + re.escape(kw) + r'\b', text_l) for kw in keywords):
                specs['Forma'] = label
                break

        # 2. Balance
        match = re.search(r"balance\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)", text, re.IGNORECASE)
        if match:
            specs["Balance"] = match.group(1).title()

        # 3. Peso
        match = re.search(
            r"(\d{3}\s*[-–]\s*\d{3})\s*(?:gr|gramos|g)", text, re.IGNORECASE
        )
        if not match:
            match = re.search(
                r"peso\s+(?:aproximado\s+)?(?:de\s+)?(\d{3}(?:[-–]\d{3})?)",
                text,
                re.IGNORECASE,
            )
        if match:
            specs["Peso"] = match.group(1) + " g"

        # 4. Núcleo/Goma — accepts "núcleo de goma EVA X", "goma EVA X", "núcleo EVA X"
        match = re.search(
            r"(?:núcleo|goma|core)\s+(?:de\s+goma\s+|de\s+)?([A-Za-záéíóúÁÉÍÓÚñÑ0-9][A-Za-záéíóúÁÉÍÓÚñÑ0-9 ]+?)(?=[,.]|\s+con\s|\s+y\s|$)",
            text,
            re.IGNORECASE,
        )
        if match:
            val = match.group(1).strip()
            if len(val) < 35 and any(kw in val.lower() for kw in ["eva", "foam", "goma", "poly", "soft"]):
                specs["Núcleo"] = val.title()

        # 5. Cara/Material — "caras de Black Carbon 12K", "fabricada con carbono 24K"
        match = re.search(
            r"cara(?:s)?\s+(?:de\s+)?"
            r"((?:[A-Za-záéíóúÁÉÍÓÚñÑ0-9]+\s+)*(?:carbono|carbon|fibra[\w ]+|grafeno)(?:\s+\d+[kK])?)",
            text, re.IGNORECASE,
        )
        if not match:
            match = re.search(
                r"(?:fabricad[ao]s?\s+con|material\s+(?:de\s+)?)"
                r"((?:[A-Za-záéíóúÁÉÍÓÚñÑ0-9]+\s+)*(?:carbono|carbon|fibra[\w ]+|grafeno)(?:\s+\d+[kK])?)",
                text, re.IGNORECASE,
            )
        if match:
            val = match.group(1).strip()
            if len(val) < 40:
                specs["Cara"] = val.title()

        # 5b. Acabado — "acabado rugoso", "acabado mate", "relieve 3D"
        match = re.search(
            r"acabado\s+(rugoso|liso|mate|brillante|3D|relieve|arenoso|s[aá]ndwich)",
            text,
            re.IGNORECASE,
        )
        if match:
            specs["Acabado"] = match.group(1).title()

        # 6. Nivel
        text_l_nivel = text.lower()
        if "profesional" in text_l_nivel and ("jugador" in text_l_nivel or "nivel" in text_l_nivel):
            specs["Nivel"] = "Profesional"
        elif "avanzado" in text_l_nivel and ("jugador" in text_l_nivel or "nivel" in text_l_nivel):
            specs["Nivel"] = "Avanzado"
        elif "intermedio" in text_l_nivel and ("jugador" in text_l_nivel or "nivel" in text_l_nivel):
            specs["Nivel"] = "Intermedio"
        elif ("iniciaci" in text_l_nivel or "principiante" in text_l_nivel) and ("jugador" in text_l_nivel or "nivel" in text_l_nivel):
            specs["Nivel"] = "Iniciación"

        # 7. Perfil
        match = re.search(
            r'(?:perfil|grosor|espesor|thickness)[:\s]+(\d+(?:[.,]\d+)?)\s*mm',
            text, re.IGNORECASE
        )
        if match:
            specs["Perfil"] = match.group(1).replace(",", ".") + " mm"

        return specs

    _COMMON_BRANDS = [
        "Nox", "Bullpadel", "Adidas", "Siux", "Head", "Babolat",
        "StarVie", "Varlion", "Kuikma", "Wilson", "Drop Shot",
        "Black Crown", "Royal Padel", "Vairo", "Dunlop", "Puma",
        "Tecnifibre", "Kelme", "Asics", "Joma", "Enebe",
        "Vibora", "Víbora", "Wingpadel", "J'hayber",
        "Softee", "Akkeron", "Eme", "Cartri",
    ]

    def _fetch_html(self, url: str) -> str:
        """Fetch page HTML via plain HTTP (sync).

        Raises ScraperGone if the store redirects to another page (product
        retired). Raises the underlying exception on network failure once
        retries are exhausted — callers must NOT treat that as "no price".
        """
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "es-ES,es;q=0.9",
            },
        )

        def _once():
            with urllib.request.urlopen(req, timeout=20, context=ssl_ctx()) as resp:
                # Detect redirect to category page (discontinued product)
                final_url = resp.url.split("?")[0].rstrip("/")
                req_url = url.split("?")[0].rstrip("/")
                if final_url != req_url:
                    raise ScraperGone(f"redirected: {url} -> {resp.url}")
                raw = resp.read()
                enc = resp.headers.get("Content-Encoding", "")
                if enc == "gzip":
                    import gzip
                    raw = gzip.decompress(raw)
                return raw.decode("utf-8", errors="replace")

        return sync_fetch_with_retry(_once, label=f"PadelNuestro:{url}", max_retries=4, base_delay=6.0)

    def _extract_product_from_html(self, html: str, url: str) -> Optional[Product]:
        """Extract product data from page HTML using JSON-LD + data attributes."""
        # ── JSON-LD: name, brand, description, image, final price ─────
        name: Optional[str] = None
        brand: str = "Unknown"
        description_html: str = ""
        image: str = ""
        price: float = 0.0
        original_price: Optional[float] = None

        for m in re.finditer(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html,
            re.DOTALL | re.IGNORECASE,
        ):
            try:
                data = json.loads(m.group(1))
                if data.get("@type") == "Product":
                    name = data.get("name")
                    brand_obj = data.get("brand", {})
                    if isinstance(brand_obj, dict):
                        brand = brand_obj.get("name", "Unknown")
                    elif isinstance(brand_obj, str):
                        brand = brand_obj
                    description_html = data.get("description", "")
                    image = data.get("image", "")
                    offers = data.get("offers", {})
                    if isinstance(offers, list):
                        offers = offers[0]
                    raw_price = offers.get("price")
                    if raw_price is not None:
                        price = float(str(raw_price).replace(",", "."))
                    break
            except Exception:
                continue

        if not name:
            return None
        if is_junior_racket(name):
            print(f"[PadelNuestro] Skipping junior racket: {name}")
            return None

        # ── Original price from data-price-type=oldPrice ──────────────
        old_prices = re.findall(
            r'data-price-type=["\']oldPrice["\'][^>]*data-price-amount=["\']([0-9]+(?:[.,][0-9]+)?)["\']',
            html,
        )
        if not old_prices:
            old_prices = re.findall(
                r'data-price-amount=["\']([0-9]+(?:[.,][0-9]+)?)["\'][^>]*data-price-type=["\']oldPrice["\']',
                html,
            )
        if old_prices:
            old_val = float(old_prices[0].replace(",", "."))
            if old_val > price:
                original_price = old_val

        # ── Images: media_gallery from inline JS ──────────────────────
        # Magento serializes URLs with escaped slashes (https:\/\/...) inside JS strings.
        images: List[str] = []
        gallery_matches = re.findall(
            r'"full"\s*:\s*"(https:\\/\\/www\\.padelnuestro\\.com\\/media\\/catalog\\/product\\/[^"]+)"',
            html,
        )
        if gallery_matches:
            seen: set = set()
            for img_url in gallery_matches:
                clean_url = re.sub(r'\?.*$', '', img_url.replace('\\/', '/'))
                if clean_url not in seen:
                    images.append(clean_url)
                    seen.add(clean_url)
        if not images and image:
            images = [re.sub(r'\?.*$', '', image)]
            image = images[0]
        elif images:
            image = images[0]

        # ── Specs: attribute table (structured, reliable) + regex fallback
        # on the marketing description (catches Peso/Perfil, which aren't
        # in the table) ────────────────────────────────────────────────
        specs = self._parse_specs_from_html(description_html)
        specs.update(self._parse_attribute_table(html))
        specs = normalize_specs(specs)

        # Fallback brand from name
        if brand == "Unknown" and name:
            name_upper = name.upper()
            for b in self._COMMON_BRANDS:
                if b.upper() in name_upper:
                    brand = b
                    break
            if brand == "Unknown":
                brand = name.split(" ")[0].title()

        return Product(
            url=url,
            name=name,
            price=price,
            original_price=original_price,
            brand=brand,
            image=image,
            images=images,
            specs=specs,
            description=description_html,
        )

    async def scrape_product(self, url: str) -> FetchResult:
        """Scrape product data from HTML page using JSON-LD + the attribute table."""
        # Normalise URL (strip .html suffix)
        if url.endswith(".html"):
            url = url[:-5]

        loop = asyncio.get_running_loop()
        try:
            html = await loop.run_in_executor(None, self._fetch_html, url)
        except ScraperGone:
            return FetchResult(FetchOutcome.GONE)
        except Exception as e:
            print(f"[PadelNuestro] HTTP error for {url}: {e}")
            return FetchResult(FetchOutcome.FAILED, error=str(e))

        try:
            product = self._extract_product_from_html(html, url)
        except Exception as e:
            print(f"[PadelNuestro] Error parsing product {url}: {e}")
            return FetchResult(FetchOutcome.FAILED, error=str(e))

        if not product:
            return FetchResult(FetchOutcome.FAILED, error="could not extract product from HTML (page loaded, parse failed)")

        if product.price is None or product.price <= 0:
            return FetchResult(FetchOutcome.NO_PRICE, product=product)
        return FetchResult(FetchOutcome.OK, product=product)

    def _fetch_category_page(self, page_num: int) -> List[str]:
        """Fetch one category page and return product URLs (sync)."""
        page_url = f"https://www.padelnuestro.com/palas-padel?p={page_num}"
        try:
            html = self._fetch_html(page_url)
        except Exception as e:
            print(f"[PadelNuestro] Category page {page_num} fetch failed: {e}")
            return []
        # product-item-link hrefs appear in initial HTML (server-rendered)
        links = re.findall(r'class="product-item-link"[^>]*href="([^"]+)"', html)
        links += re.findall(r'href="([^"]+)"[^>]*class="product-item-link"', html)
        return list(dict.fromkeys(links))  # dedupe, preserve order

    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs by paginating the category HTML pages."""
        _EXCLUDE = {
            "zapatilla", "paletero", "mochila", "camiseta", "pantalon",
            "falda", "gorra", "calcetin", "funda", "overgrip", "protector",
        }

        product_urls: List[str] = []
        seen: set = set()
        page_num = 1
        max_pages = 40

        print("[PadelNuestro] Scraping category via HTML pagination...")

        loop = asyncio.get_running_loop()
        while page_num <= max_pages:
            links = await loop.run_in_executor(
                None, self._fetch_category_page, page_num
            )
            if not links:
                print(f"[PadelNuestro] Page {page_num}: no products. Done.")
                break

            added = 0
            for link in links:
                slug = link.rstrip("/").split("/")[-1].lower()
                if any(term in slug for term in _EXCLUDE):
                    continue
                if link not in seen:
                    product_urls.append(link)
                    seen.add(link)
                    added += 1

            print(
                f"[PadelNuestro] Page {page_num}: {len(links)} found, "
                f"{added} added. Total: {len(product_urls)}"
            )
            page_num += 1

        return product_urls
