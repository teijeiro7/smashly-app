import html as _html
import json
import re
import urllib.request
import ssl
import asyncio
from typing import Dict, List, Optional
from urllib.parse import urlparse
from .base_scraper import BaseScraper, Product, clean_price, normalize_specs, is_junior_racket


class PadelNuestroScraper(BaseScraper):
    """Scraper for PadelNuestro online store using GraphQL API."""

    # ── Magento option‑ID → human‑readable label mappings ──────────────
    _ATTR_OPTIONS: Dict[str, Dict[str, str]] = {
        "padelracket_balance": {
            "2181": "Alto", "2183": "Medio", "2182": "Bajo",
        },
        "padelracket_core": {
            "2651": "Black Eva HR3", "2652": "Black Eva HR9",
            "2184": "Black EVA", "2836": "Cloud EVA", "2785": "Comfort FOAM",
            "3267": "Custom EVA", "2657": "Dual Density",
            "3263": "EV25 Black Soft", "2654": "EVA",
            "2810": "EVA Pro High Density", "2807": "EVA Soft Performance",
            "3233": "Evalastic", "2760": "EVA 3XPly",
            "2761": "Eva High Memory", "2762": "EVA HR3",
            "3977": "EVA Mid Hard", "2789": "EVA PRO",
            "2780": "EVA PRO 50", "2781": "EVA Pro Touch",
            "2187": "EVA", "2782": "EVA SOFT 30",
            "2821": "EVA Soft Low Density", "2191": "Foam",
            "2185": "Hard EVA", "3128": "HR3",
            "3125": "HR3 Black EVA", "3122": "HR3 Core",
            "3260": "HR3 White EVA", "3200": "Koridion",
            "2186": "Medium EVA", "2649": "Mega Flex Core",
            "2577": "Multieva", "3236": "Polyglass",
            "2192": "Polietileno", "2769": "Power Blast EVA",
            "2786": "SC White EVA", "2188": "Soft EVA",
            "3971": "Soft Poly", "2189": "Supersoft EVA",
            "2763": "Super Flex", "2190": "Ultrasoft EVA",
            "2839": "X-EVA", "2771": "Xtend Carbon 3K",
        },
        "padelracket_face": {
            "2194": "Carbono", "2203": "Carbono + Grafeno",
            "2201": "Carbono 3K", "2195": "Carbono 12K",
            "2197": "Carbono 18K", "2199": "Carbono 21K",
            "2200": "Carbono 24K", "2193": "Aluminio + Carbono",
            "2204": "Fibra de Vidrio", "2206": "Grafeno",
            "2196": "Carbono 15K", "2198": "Carbono 1K",
            "2205": "Fibra de Lino", "2207": "Policarbonato",
            "2202": "Carbono 6K", "2578": "Fibrix",
            "2598": "Polietileno", "2623": "Carbono 16K",
            "2655": "Fibra de carbono", "2765": "Tricarbon",
            "2764": "Glaphite", "2783": "Basalto",
            "2813": "Carbon Flex", "2787": "Fiberflex",
            "2816": "White EVA", "2824": "Carbono 18K Textreme",
            "2833": "ElasticFiber", "2845": "Carbon Plain",
            "3058": "X Tend Carbon 3K", "3131": "Fiber Glass 3K",
            "3239": "Polyglass", "3270": "Amplitex 3K",
            "3974": "Fibertech", "3980": "X Tend Carbon 12K",
            "3983": "Soft Carbon",
        },
        "padelracket_format": {
            "2208": "Normal", "2209": "Oversize",
        },
        "padelracket_hardness": {
            "2210": "Dura", "2211": "Media", "2212": "Blanda",
        },
        "padelracket_level": {
            "2213": "Avanzado / Competición",
            "2214": "Principiante / Intermedio",
            "2215": "Profesional",
        },
        "padelracket_relief": {
            "2217": "Brillo", "2218": "Mate", "2216": "Relieve 3D",
            "2766": "Rugosa", "2219": "Arenoso",
        },
        "padelracket_shape": {
            "2220": "Beach Tennis", "2221": "Diamante",
            "2222": "Híbrida", "2223": "Pickleball",
            "2224": "Redonda", "2225": "Lágrima",
        },
        "padelracket_surface": {
            "2227": "Gomosa", "2226": "Lisa",
            "2228": "Rugosa", "2767": "Arenosa",
        },
        "padelrakect_player_type": {          # Note: typo in Magento schema
            "2230": "Control", "2229": "Polivalente", "2231": "Potencia",
        },
    }

    # Maps GraphQL field name → normalised spec key used in the Product
    _FIELD_TO_SPEC: Dict[str, str] = {
        "padelracket_balance": "Balance",
        "padelracket_core": "Núcleo",
        "padelracket_face": "Cara",
        "padelracket_format": "Formato",
        "padelracket_hardness": "Dureza",
        "padelracket_level": "Nivel",
        "padelracket_relief": "Acabado",
        "padelracket_shape": "Forma",
        "padelracket_surface": "Rugosidad",
        "padelrakect_player_type": "Tipo de Juego",
    }

    def _resolve_option(self, field: str, raw_value) -> Optional[str]:
        """Resolve a Magento numeric option‑ID to its label."""
        if raw_value is None:
            return None
        options = self._ATTR_OPTIONS.get(field, {})
        return options.get(str(raw_value))

    def _fetch_graphql(self, query: str) -> dict:
        """Execute a GraphQL query against PadelNuestro API (sync)."""
        data = json.dumps({"query": query}).encode("utf-8")
        req = urllib.request.Request(
            "https://www.padelnuestro.com/graphql",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
                "Accept-Encoding": "gzip, deflate",
                "Store": "es",
                "Origin": "https://www.padelnuestro.com",
                "Referer": "https://www.padelnuestro.com/palas-padel",
                "Connection": "keep-alive",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Dest": "empty",
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            },
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                raw = resp.read()
                # Descomprimir gzip si el servidor lo devuelve comprimido
                encoding = resp.headers.get("Content-Encoding", "")
                if encoding == "gzip":
                    import gzip
                    raw = gzip.decompress(raw)
                elif encoding == "br":
                    try:
                        import brotli
                        raw = brotli.decompress(raw)
                    except ImportError:
                        pass  # Si no está brotli, intentar decodificar igualmente
                data = json.loads(raw.decode("utf-8"))
                return data if data is not None else {}
        except Exception as e:
            print(f"[PadelNuestro] GraphQL Error: {e}")
            return {}

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

    def _scrape_price_from_html(self, url: str) -> Optional[tuple]:
        """
        Fallback: extrae el precio directamente del HTML de la página del producto.
        Se usa cuando la API GraphQL devuelve 403.
        Devuelve (price, original_price) o None si no se encuentra.

        Estrategias (en orden de prioridad):
          1. JSON-LD schema.org (@type=Product → offers.price)
          2. Atributo data-price-amount de Magento 2
          3. Span con clase 'price' (texto con €)
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
                "Referer": "https://www.padelnuestro.com/palas-padel",
            },
        )
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
                raw = resp.read()
                encoding = resp.headers.get("Content-Encoding", "")
                if encoding == "gzip":
                    import gzip as _gzip
                    raw = _gzip.decompress(raw)
                html = raw.decode("utf-8", errors="replace")
        except Exception as e:
            print(f"[PadelNuestro] HTML fetch error for {url}: {e}")
            return None

        price: Optional[float] = None
        original_price: Optional[float] = None

        # ── Estrategia 1: JSON-LD ──────────────────────────────────────────
        for match in re.finditer(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html,
            re.DOTALL | re.IGNORECASE,
        ):
            try:
                data = json.loads(match.group(1))
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if item.get("@type") == "Product":
                        offers = item.get("offers", {})
                        if isinstance(offers, list):
                            offers = offers[0]
                        raw_price = offers.get("price")
                        if raw_price:
                            price = float(str(raw_price).replace(",", "."))
                        break
            except Exception:
                continue
            if price:
                break

        # ── Estrategia 2: atributo data-price-amount de Magento 2 ─────────
        if not price:
            m = re.search(
                r'data-price-amount=["\']([0-9]+(?:[.,][0-9]+)?)["\']',
                html,
            )
            if m:
                price = float(m.group(1).replace(",", "."))

        # ── Estrategia 3: span.price con símbolo € ─────────────────────────
        if not price:
            m = re.search(
                r'<span[^>]*class="[^"]*\bprice\b[^"]*"[^>]*>\s*'
                r'([0-9]+(?:[.,][0-9]+)?)\s*(?:€|EUR)',
                html,
                re.IGNORECASE,
            )
            if m:
                price = float(m.group(1).replace(",", "."))

        if price is None:
            return None

        return price, original_price

    _COMMON_BRANDS = [
        "Nox", "Bullpadel", "Adidas", "Siux", "Head", "Babolat",
        "StarVie", "Varlion", "Kuikma", "Wilson", "Drop Shot",
        "Black Crown", "Royal Padel", "Vairo", "Dunlop", "Puma",
        "Tecnifibre", "Kelme", "Asics", "Joma", "Enebe",
        "Vibora", "Víbora", "Wingpadel", "J'hayber",
        "Softee", "Akkeron", "Eme", "Cartri",
    ]

    def _fetch_html(self, url: str) -> Optional[str]:
        """Fetch page HTML via plain HTTP (sync)."""
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
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        try:
            with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
                raw = resp.read()
                enc = resp.headers.get("Content-Encoding", "")
                if enc == "gzip":
                    import gzip
                    raw = gzip.decompress(raw)
                return raw.decode("utf-8", errors="replace")
        except Exception as e:
            print(f"[PadelNuestro] HTTP error for {url}: {e}")
            return None

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
        images: List[str] = []
        gallery_matches = re.findall(
            r'"full"\s*:\s*"(https://www\.padelnuestro\.com/media/catalog/product/[^"]+)"',
            html,
        )
        if gallery_matches:
            seen = set()
            for img_url in gallery_matches:
                if img_url not in seen:
                    images.append(img_url)
                    seen.add(img_url)
        if not images and image:
            # Use the JSON-LD image but strip the small thumbnail params
            images = [re.sub(r'\?.*$', '', image)]
            image = images[0]
        elif images:
            image = images[0]

        # ── Specs from description HTML ───────────────────────────────
        specs = self._parse_specs_from_html(description_html)
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

    def _scrape_specs_via_graphql(self, url_key: str) -> Dict[str, str]:
        """Fetch structured padel spec attributes via Magento GraphQL API."""
        fields = " ".join(self._FIELD_TO_SPEC.keys())
        query = (
            '{ products(filter: {url_key: {eq: "%s"}}) { items { %s } } }'
            % (url_key, fields)
        )
        data = self._fetch_graphql(query)
        specs: Dict[str, str] = {}
        try:
            items = data.get("data", {}).get("products", {}).get("items", [])
            if not items:
                return specs
            item = items[0]
            for field, spec_key in self._FIELD_TO_SPEC.items():
                raw_val = item.get(field)
                if raw_val is None:
                    continue
                label = self._resolve_option(field, raw_val)
                if label:
                    specs[spec_key] = label
        except Exception as e:
            print(f"[PadelNuestro] GraphQL spec parse error for {url_key}: {e}")
        return specs

    async def scrape_product(self, url: str) -> Optional[Product]:
        """Scrape product data from HTML page using JSON-LD, enriched with GraphQL specs."""
        try:
            # Normalise URL (strip .html suffix)
            if url.endswith(".html"):
                url = url[:-5]

            loop = asyncio.get_running_loop()
            html = await loop.run_in_executor(None, self._fetch_html, url)
            if not html:
                print(f"[PadelNuestro] No HTML for {url}")
                return None

            product = self._extract_product_from_html(html, url)
            if not product:
                print(f"[PadelNuestro] Could not parse product from {url}")
                return None

            # Enrich with GraphQL structured spec attributes (option-ID → label)
            url_key = url.rstrip("/").split("/")[-1]
            graphql_specs = await loop.run_in_executor(
                None, self._scrape_specs_via_graphql, url_key
            )
            for k, v in graphql_specs.items():
                if v and k not in product.specs:
                    product.specs[k] = v
            if graphql_specs:
                product.specs = normalize_specs(product.specs)

            return product

        except Exception as e:
            print(f"[PadelNuestro] Error scraping product {url}: {e}")
            return None

    def _fetch_category_page(self, page_num: int) -> List[str]:
        """Fetch one category page and return product URLs (sync)."""
        page_url = f"https://www.padelnuestro.com/palas-padel?p={page_num}"
        html = self._fetch_html(page_url)
        if not html:
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
