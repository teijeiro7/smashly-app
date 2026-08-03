import html as _html
import json
import re
import time
import random
import urllib.request
import asyncio
from typing import Dict, List, Optional
from .base_scraper import (
    BaseScraper, Product, normalize_specs, is_junior_racket,
    FetchOutcome, FetchResult, ScraperGone, sync_fetch_with_retry, ssl_ctx,
    browser_headers,
)


class PadelMarketScraper(BaseScraper):
    """Scraper for PadelMarket online store."""

    # Palabras clave de forma y su valor normalizado
    _SHAPE_KEYWORDS = [
        (['lagrima', 'lágrima', 'tear', 'gota'], 'Lágrima'),
        (['diamante', 'diamond'], 'Diamante'),
        (['redonda', 'round', 'redondo'], 'Redonda'),
        (['hibrida', 'híbrida', 'hybrid'], 'Híbrida'),
    ]

    def _infer_shape_from_text(self, text: str) -> Optional[str]:
        """Intenta deducir la forma de la pala buscando palabras clave."""
        text_l = text.lower()
        for keywords, label in self._SHAPE_KEYWORDS:
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', text_l):
                    return label
        return None

    def _parse_specs_from_html(self, html: str) -> Dict[str, str]:
        """Parse specs from Shopify body_html OR product HTML."""
        specs: Dict[str, str] = {}
        if not html:
            return specs

        # Extract structured list items (Theme-specific)
        matches = re.finditer(
            r'<(?:li|tr|td)[^>]*>\s*<strong[^>]*>\s*([^<]+?)\s*:?\s*</strong>\s*([^<]+?)\s*</(?:li|tr|td)>',
            html,
            re.IGNORECASE | re.DOTALL
        )
        for m in matches:
            key = m.group(1).strip().rstrip(':')
            # The separator colon can land outside <strong>...</strong> (e.g.
            # "<strong>Tipo de juego</strong>: Polivalente") and leak into the
            # value — strip it, or it ends up stored as ": Polivalente".
            val = re.sub(r'^\s*:\s*', '', m.group(2).strip())
            if key and val:
                specs[key] = val

        # Unescape and clean text for further extraction
        text = _html.unescape(html)
        text = text.replace('&nbsp;', ' ').replace('<br>', ' ').replace('</p>', ' ').replace('<p>', ' ')
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        text_l = text.lower()

        # Forma
        if 'Forma' not in specs:
            shape = self._infer_shape_from_text(text)
            if shape:
                specs['Forma'] = shape

        # Balance
        if 'Balance' not in specs:
            match = re.search(r'balance\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)', text, re.IGNORECASE)
            if match:
                specs['Balance'] = match.group(1).title()

        # Peso
        if 'Peso' not in specs:
            match = re.search(r'(\d{3}\s*[-–]\s*\d{3})\s*(?:gr|gramos|g)', text, re.IGNORECASE)
            if match:
                specs['Peso'] = match.group(1) + " g"

        # Cara/Material
        if 'Cara' not in specs:
            match = re.search(
                r'(?:(?:con|de)\s+)?'
                r'((?:black\s+)?(?:carbono|carbon|fibra\s+de\s+(?:carbono|vidrio)|grafeno)'
                r'(?:\s+\d+[kK])?)',
                text, re.IGNORECASE
            )
            if match:
                val = match.group(1).strip()
                if len(val) < 40:
                    specs['Cara'] = val.title()

        # Núcleo
        if 'Núcleo' not in specs:
            match = re.search(
                r'(?:n[uú]cleo|goma|core)\s+(?:de\s+goma\s+|de\s+)?'
                r'([A-Za-záéíóúÁÉÍÓÚñÑ0-9][A-Za-záéíóúÁÉÍÓÚñÑ0-9 ]+?(?:eva|foam|poly)(?:\s+[A-Za-z]+)?)',
                text, re.IGNORECASE
            )
            if match:
                val = match.group(1).strip()
                if len(val) < 30:
                    specs['Núcleo'] = val.title()

        # Nivel
        if 'Nivel' not in specs:
            if 'profesional' in text_l and ('jugador' in text_l or 'nivel' in text_l):
                specs['Nivel'] = 'Profesional'
            elif 'avanzado' in text_l and ('jugador' in text_l or 'nivel' in text_l):
                specs['Nivel'] = 'Avanzado'
            elif 'intermedio' in text_l and ('jugador' in text_l or 'nivel' in text_l):
                specs['Nivel'] = 'Intermedio'
            elif ('iniciaci' in text_l or 'principiante' in text_l) and ('jugador' in text_l or 'nivel' in text_l):
                specs['Nivel'] = 'Iniciación'

        # Perfil / grosor
        if 'Perfil' not in specs:
            match = re.search(r'(?:perfil|grosor|espesor|thickness)[:\s]+(\d+(?:[.,]\d+)?)\s*mm', text, re.IGNORECASE)
            if match:
                specs['Perfil'] = match.group(1).replace(',', '.') + ' mm'

        return specs

    def _fetch_product_json(self, handle: str) -> dict:
        """Fetch a single product's full data from the Shopify JSON API (sync)."""
        time.sleep(random.uniform(0.8, 1.5))
        api_url = f"https://padelmarket.com/es-eu/products/{handle}.json"
        req = urllib.request.Request(api_url, headers=browser_headers(
            origin="https://padelmarket.com/", accept="application/json",
        ))

        def _once():
            with urllib.request.urlopen(req, timeout=30, context=ssl_ctx()) as resp:
                return json.loads(resp.read().decode('utf-8'))

        data = sync_fetch_with_retry(_once, label=f"PadelMarket:{handle}", max_retries=4, base_delay=8.0)
        return data.get('product', {})

    async def scrape_product(self, url: str) -> FetchResult:
        """Scrape product data using the Shopify JSON API."""

        # Extract handle: /products/pala-xyz -> pala-xyz
        handle = url.rstrip('/').split('/products/')[-1].split('?')[0]
        if not handle:
            return FetchResult(FetchOutcome.FAILED, error="could not extract handle from URL")

        try:
            loop = asyncio.get_running_loop()
            product_data = await loop.run_in_executor(
                None, self._fetch_product_json, handle
            )
        except ScraperGone:
            return FetchResult(FetchOutcome.GONE)
        except Exception as e:
            print(f"[PadelMarket] API error for {handle}: {e}")
            return FetchResult(FetchOutcome.FAILED, error=str(e))

        if not product_data or not isinstance(product_data, dict):
            return FetchResult(FetchOutcome.FAILED, error="empty or invalid API response")

        # Basic fields
        name = product_data.get('title')
        if not name:
            return FetchResult(FetchOutcome.FAILED, error="product JSON missing title")
        if is_junior_racket(name):
            print(f"[PadelMarket] Skipping junior racket: {name}")
            return FetchResult(FetchOutcome.FAILED, error="junior racket, excluded from catalog")

        variants = product_data.get('variants') if isinstance(product_data.get('variants'), list) else []
        first_variant = variants[0] if variants and isinstance(variants[0], dict) else {}

        # Price parsing
        price: Optional[float] = None
        if first_variant:
            try:
                raw_price = first_variant.get('price')
                if raw_price is not None:
                    price = float(raw_price)
            except (ValueError, TypeError):
                pass

        # Original Price
        original_price = None
        if first_variant:
            try:
                op = first_variant.get('compare_at_price')
                if op:
                    original_price = float(op)
            except (ValueError, TypeError, AttributeError):
                pass

        # Brand
        brand = product_data.get('vendor') or 'Unknown'

        # Images
        images = []
        raw_images = product_data.get('images')
        if isinstance(raw_images, list):
            for img in raw_images:
                src = img.get('src') if isinstance(img, dict) else img
                if src:
                    images.append(src)

        image = images[0] if images else ''

        # Specs from body_html
        specs = self._parse_specs_from_html(product_data.get('body_html', ''))

        # Fallback to full HTML if Forma or other key specs are missing
        if 'Forma' not in specs:
            try:
                req = urllib.request.Request(url, headers=browser_headers(
                    origin="https://padelmarket.com/",
                    accept="text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                ))

                def _fetch_full_html():
                    with urllib.request.urlopen(req, timeout=15, context=ssl_ctx()) as resp:
                        return resp.read().decode('utf-8')

                full_html = await loop.run_in_executor(None, _fetch_full_html)
                more_specs = self._parse_specs_from_html(full_html)
                specs.update(more_specs)
            except Exception as e:
                print(f"[PadelMarket] HTML fallback error for {handle}: {e}")

        # Final shape inference from cumulative text if still missing
        if 'Forma' not in specs:
            text_context = (product_data.get('body_html', '') + " " + product_data.get('title', '')).lower()
            inferred = self._infer_shape_from_text(text_context)
            if inferred:
                specs['Forma'] = inferred

        specs = normalize_specs(specs)

        product = Product(
            url=url,
            name=name,
            price=price or 0.0,
            original_price=original_price,
            brand=brand,
            image=image,
            images=images,
            specs=specs,
        )

        if price is None or price <= 0:
            return FetchResult(FetchOutcome.NO_PRICE, product=product)
        return FetchResult(FetchOutcome.OK, product=product)

    def _fetch_category_page(self, collection_path: str, page_num: int) -> List[str]:
        """Fetch one collection HTML page and return canonical product URLs (sync).

        The store's Cloudflare setup hard-blocks the Shopify `products.json`
        collection endpoint (`local_rate_limited`) for every client, but serves
        the collection HTML fine — so we paginate the HTML instead.
        """
        time.sleep(random.uniform(1.0, 2.0))
        page_url = f"https://padelmarket.com{collection_path}?page={page_num}"
        req = urllib.request.Request(page_url, headers=browser_headers(
            origin="https://padelmarket.com/",
            accept="text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ))

        def _once():
            with urllib.request.urlopen(req, timeout=30, context=ssl_ctx()) as resp:
                return resp.read().decode('utf-8')

        html = sync_fetch_with_retry(
            _once, label=f"PadelMarket:page{page_num}", max_retries=2, base_delay=6.0,
        )
        # Product card links look like /es-eu/collections/palas/products/{handle}.
        # Grab the handle from any /products/{handle} path and canonicalize.
        handles = re.findall(r'/products/([a-z0-9][a-z0-9-]*)', html)
        return [f"https://padelmarket.com/es-eu/products/{h}" for h in dict.fromkeys(handles)]

    async def scrape_category(self, url: str) -> List[str]:
        """Scrape product URLs by paginating the collection HTML pages."""
        if '/collections/' in url:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            collection_path = parsed.path.rstrip('/')
        else:
            collection_path = '/es-eu/collections/palas'

        product_urls: List[str] = []
        seen: set = set()
        page_num = 1
        max_pages = 40

        print("[PadelMarket] Scraping category via HTML pagination...")

        loop = asyncio.get_running_loop()
        while page_num <= max_pages:
            try:
                links = await loop.run_in_executor(
                    None, self._fetch_category_page, collection_path, page_num
                )
            except Exception as e:
                print(f"[PadelMarket] API error on page {page_num}: {e}")
                break

            if not links:
                print(f"[PadelMarket] Page {page_num}: no products. Done.")
                break

            added = 0
            for link in links:
                if link not in seen:
                    product_urls.append(link)
                    seen.add(link)
                    added += 1

            print(f"[PadelMarket] Page {page_num}: {len(links)} found, {added} added. Total: {len(product_urls)}")
            page_num += 1

        print(f"[PadelMarket] Final count: {len(product_urls)} products from HTML")
        return product_urls
