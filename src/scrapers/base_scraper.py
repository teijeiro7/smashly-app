from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, List, Callable, TypeVar
import re
import random
import urllib.request
import urllib.error
import ssl
import time
import asyncio

# ============================================================================
# Fetch outcome contract
# ============================================================================
#
# Scrapers must distinguish "the network failed" from "the store told us
# there's no price". A 429/403/timeout is not information about the product
# — writing NULL on that signal is what wiped out most of padelproshop's and
# padelmarket's prices. Only OK/NO_PRICE/GONE are confirmed signals that may
# ever clear a price in the database; FAILED must never touch stored data.

class FetchOutcome(Enum):
    OK = "ok"               # page loaded, price extracted
    NO_PRICE = "no_price"   # page loaded, product confirmed to have no sellable price
    GONE = "gone"           # 404 or confirmed redirect — retired from the store
    FAILED = "failed"       # network/parse failure — no signal, don't touch anything


class ScraperGone(Exception):
    """Raised by a scraper's fetch layer to signal a confirmed removal (404/redirect)."""


@dataclass
class FetchResult:
    outcome: FetchOutcome
    product: Optional["Product"] = None
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.outcome is FetchOutcome.OK


# ============================================================================
# Sync retry helper (scrapers run urllib calls in a thread executor)
# ============================================================================

T = TypeVar("T")

_RETRYABLE_HTTP_CODES = {429, 403, 500, 502, 503, 504}


def sync_fetch_with_retry(
    fetch_once: Callable[[], T],
    *,
    label: str = "",
    max_retries: int = 4,
    base_delay: float = 3.0,
) -> T:
    """
    Runs `fetch_once()` (a single urllib call), retrying on 429/403/5xx and
    network errors with exponential backoff + jitter. Respects the
    `Retry-After` header when the store sends one.

    Raises `ScraperGone` on HTTP 404 (caller should map to FetchOutcome.GONE).
    Raises the underlying exception once retries are exhausted (caller
    should map to FetchOutcome.FAILED — never write NULL on this path).
    """
    last_exc: Optional[Exception] = None
    for attempt in range(max_retries):
        try:
            return fetch_once()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise ScraperGone(f"404 for {label}") from e
            if e.code in _RETRYABLE_HTTP_CODES and attempt < max_retries - 1:
                wait = _retry_wait(e, attempt, base_delay)
                print(f"    ⚠️  [{label}] HTTP {e.code}, retry {attempt + 1}/{max_retries} in {wait:.1f}s")
                time.sleep(wait)
                last_exc = e
                continue
            last_exc = e
            raise
        except urllib.error.URLError as e:
            if attempt < max_retries - 1:
                wait = base_delay * (2 ** attempt) + random.uniform(0, 1.5)
                print(f"    ⚠️  [{label}] network error, retry {attempt + 1}/{max_retries} in {wait:.1f}s: {e.reason}")
                time.sleep(wait)
                last_exc = e
                continue
            last_exc = e
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError(f"sync_fetch_with_retry exhausted retries with no exception for {label}")


def _retry_wait(e: "urllib.error.HTTPError", attempt: int, base_delay: float) -> float:
    retry_after = e.headers.get("Retry-After") if e.headers else None
    if retry_after:
        try:
            wait = float(retry_after)
        except ValueError:
            wait = base_delay * (2 ** attempt)
    else:
        wait = base_delay * (2 ** attempt)
    return wait + random.uniform(0, wait * 0.3)


def ssl_ctx() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


# ============================================================================
# Shared Utility Functions
# ============================================================================

def clean_price(text: str) -> float:
    """Parse price from text with automatic format detection."""
    if not text:
        return 0.0

    text = text.replace('€', '').replace('EUR', '').replace('&nbsp;', '').replace(' ', '').strip()

    if ',' in text and '.' in text:
        text = text.replace('.', '').replace(',', '.')
    elif ',' in text:
        text = text.replace(',', '.')

    try:
        match = re.search(r'[\d.]+', text)
        if match:
            price = float(match.group(0))
            # Fix cents format (e.g., 14995 -> 149.95)
            if '.' not in text and ',' not in text:
                if 1000 <= price < 100000:
                    price = price / 100.0
            return price
        return 0.0
    except ValueError:
        return 0.0

SPEC_NAME_MAP = {
    'forma': 'Forma', 'format': 'Forma', 'shape': 'Forma',
    'formato': 'Formato',  # tamaño de pala (Normal/Oversize) — NO es Forma (Redonda/Diamante/Lágrima)
    'peso': 'Peso', 'weight': 'Peso', 'talla-peso': 'Peso',
    'balance': 'Balance', 'balanceo': 'Balance',
    'núcleo': 'Núcleo', 'nucleo': 'Núcleo', 'goma': 'Núcleo', 'foam': 'Núcleo', 'core': 'Núcleo',
    'cara': 'Cara', 'caras': 'Cara', 'material': 'Cara', 'fibra': 'Cara', 'surface': 'Cara', 'material cara': 'Cara',
    'marco': 'Marco', 'frame': 'Marco',
    'nivel': 'Nivel', 'level': 'Nivel', 'nivel de juego': 'Nivel',
    'perfil': 'Perfil', 'grosor': 'Perfil', 'espesor': 'Perfil',
    'rugosidad': 'Rugosidad', 'superficie': 'Rugosidad',
    'superfície': 'Rugosidad',  # PadelNuestro renderiza el label con tilde en la í (typo de su sitio)
    'acabado': 'Acabado',  # relieve/brillo (Mate/Brillo) — NO es lo mismo que Rugosidad (textura de la superficie)
    'colores': 'Colores', 'color': 'Colores',
    'género': 'Género', 'genero': 'Género', 'sexo': 'Género',
}

def normalize_spec_name(key: str) -> str:
    key_lower = key.lower().strip().replace(':', '')
    return SPEC_NAME_MAP.get(key_lower, key.strip())

def normalize_spec_value(key: str, value: str) -> str:
    if not value: return value
    value = value.strip()
    key_lower = key.lower()

    # Normalización de Forma
    if 'forma' in key_lower:
        val_l = value.lower().strip()
        if any(x in val_l for x in ['lagrima', 'lágrima', 'tear', 'gota']): return 'Lágrima'
        if any(x in val_l for x in ['diamante', 'diamond']):                  return 'Diamante'
        if any(x in val_l for x in ['redonda', 'redondo', 'round']):          return 'Redonda'
        if any(x in val_l for x in ['híbrida', 'hibrida', 'hibrido', 'hybrid']): return 'Híbrida'
        # Rechazar valores claramente inválidos para Forma
        invalid = {'rugoso', 'rugosa', 'mate', 'brillo', 'relieve', 'arenoso'}
        if val_l in invalid or len(val_l) <= 2:
            return ''   # Se descartará en normalize_specs si está vacío
        return value.strip()

    # Normalización de Balance
    if 'balance' in key_lower:
        val_l = value.lower()
        if any(x in val_l for x in ['alto', 'high']): return 'Alto'
        if any(x in val_l for x in ['medio', 'medium']): return 'Medio'
        if any(x in val_l for x in ['bajo', 'low']): return 'Bajo'

    # Normalización de Peso (Estricta numérica)
    if 'peso' in key_lower:
        # Extraer todos los grupos de 3 dígitos (lookaround para no partir 4+ digit numbers)
        nums = re.findall(r'(?<!\d)\d{3}(?!\d)', value)
        if len(nums) >= 2:
            # Ordenar para asegurar min-max
            nums = sorted([int(n) for n in nums])
            return f"{nums[0]}-{nums[-1]} g"
        elif len(nums) == 1:
            return f"{nums[0]} g"
        # Si no hay números claros, devolver original limpio
        return value

    if 'núcleo' in key_lower or 'goma' in key_lower:
        if 'eva' in value.lower(): return value.replace('eva', 'EVA').replace('Eva', 'EVA')
        if 'foam' in value.lower(): return value.replace('foam', 'Foam').replace('FOAM', 'Foam')

    if 'perfil' in key_lower:
        m = re.search(r'(\d+(?:[.,]\d+)?)', value)
        if m:
            return m.group(1).replace(',', '.') + ' mm'
        return value

    return value

_JUNIOR_PATTERN = re.compile(
    r'\b(junior|jr|kid|kids|ni[ñn]o|ni[ñn]a|infantil|bambini|bambino)\b',
    re.IGNORECASE,
)

def is_junior_racket(name: str) -> bool:
    """Return True if the racket name indicates a children's/junior product."""
    return bool(_JUNIOR_PATTERN.search(name or ""))


def normalize_specs(specs: Dict[str, str]) -> Dict[str, str]:
    normalized = {}
    for key, value in specs.items():
        norm_key = normalize_spec_name(key)
        norm_value = normalize_spec_value(norm_key, value)
        # Descartar entradas inválidas: vacías, demasiado cortas (≤2 chars), o clave 'Marca'
        if norm_key.lower() == 'marca':
            continue
        if not norm_value or len(norm_value.strip()) <= 2:
            continue
        normalized[norm_key] = norm_value
    return normalized


# ============================================================================
# Product & BaseScraper
# ============================================================================

class Product:
    def __init__(self, url: str, name: str, price: float, brand: str, image: str,
                 specs: Dict[str, str], original_price: Optional[float] = None,
                 description: Optional[str] = None, images: Optional[List[str]] = None):
        self.url = url
        self.name = name
        self.price = price
        self.original_price = original_price
        self.brand = brand
        self.image = image
        self.images = images or ([image] if image else [])
        self.specs = specs
        self.description = description

    def to_dict(self) -> dict:
        return {
            "url": self.url, "name": self.name, "price": self.price,
            "original_price": self.original_price, "brand": self.brand,
            "image": self.image, "images": self.images, "specs": self.specs,
            "description": self.description
        }

class BaseScraper(ABC):
    """
    Base class for all scrapers.
    Removed Playwright dependency as current scrapers use HTTP/urllib.
    """
    def __init__(self):
        self.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

    async def init(self):
        """No-op for compatibility."""
        pass

    async def close(self):
        """No-op for compatibility."""
        pass

    @abstractmethod
    async def scrape_product(self, url: str) -> FetchResult:
        pass

    @abstractmethod
    async def scrape_category(self, url: str) -> List[str]:
        pass
