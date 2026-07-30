"""
radar_metrics_scraper.py — Extrae métricas radar verificadas desde fuentes externas con búsqueda inteligente y fallback determinista.

Fuentes:
  - PadelZoom.es (Primary)  → Confianza: 0.95
  - TuMejorPala.com (Secondary) → Confianza: 0.85

USO:
  from src.scrapers.radar_metrics_scraper import scrape_pala_metrics, calculate_deterministic_metrics
  metrics = scrape_pala_metrics("Bullpadel Vertex 05 Light")
"""

import re
import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Dataclasses
# ──────────────────────────────────────────────

@dataclass
class RadarMetrics:
    """Métricas radar de una pala (escala 0-10)."""
    potencia: float
    control: float
    manejabilidad: float
    salida_bola: float
    punto_dulce: float
    source: str
    confidence: float
    source_url: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            'radar_potencia': round(self.potencia, 1),
            'radar_control': round(self.control, 1),
            'radar_manejabilidad': round(self.manejabilidad, 1),
            'radar_salida_bola': round(self.salida_bola, 1),
            'radar_punto_dulce': round(self.punto_dulce, 1),
        }


# ──────────────────────────────────────────────
# Normalización y Limpieza de Nombres
# ──────────────────────────────────────────────

def normalize_text(text: str) -> str:
    """Normaliza texto para comparación."""
    if not text:
        return ''
    return (text
            .lower()
            .strip()
            .replace('á', 'a')
            .replace('é', 'e')
            .replace('í', 'i')
            .replace('ó', 'o')
            .replace('ú', 'u')
            .replace('ñ', 'n')
            .replace('  ', ' '))


def clean_pala_name_for_search(name: str) -> str:
    """
    Limpia el nombre de la pala eliminado códigos SKU, etiquetas de categoría (Beach Tennis, Pickleball)
    y palabras ruído para maximizar aciertos en buscadores de reseñas.
    """
    if not name:
        return ''

    cleaned = name

    # Eliminar prefijos de otros deportes
    cleaned = re.sub(r'^(beach\s+tennis|pickleball)\s+', '', cleaned, flags=re.IGNORECASE)
    
    # Eliminar códigos SKU numéricos largos o alfanuméricos al final (ej. "221043", "pb3ca0u16")
    cleaned = re.sub(r'\b[a-z0-9]{7,}\b', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d{5,}\b', '', cleaned)

    # Eliminar corchetes, paréntesis y palabras de relleno comunes
    cleaned = re.sub(r'[\(\)\[\]]', ' ', cleaned)
    cleaned = re.sub(r'\b(pala|palas|padel)\b', '', cleaned, flags=re.IGNORECASE)

    # Normalizar espacios
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def to_number(raw: str) -> Optional[float]:
    """Convierte string a número entre 0-10."""
    try:
        value = float(str(raw).replace(',', '.'))
        value = max(0.0, min(10.0, round(value * 10) / 10))
        return value
    except (ValueError, TypeError):
        return None


# ──────────────────────────────────────────────
# PadelZoom Scraper
# ──────────────────────────────────────────────

def _parse_padelzoom_scores(html: str) -> Optional[RadarMetrics]:
    """Parsea métricas radar desde HTML de PadelZoom."""
    metrics_map: Dict[str, float] = {}

    # Patrón bloque: type-puntuacion + value-puntuacion
    block_regex = re.compile(
        r'<div class="type-puntuacion">[\s\S]*?<span>([^<]+)</span>[\s\S]*?'
        r'<div class="value-puntuacion">[\s\S]*?<span>([0-9]+(?:[.,][0-9]+)?)</span>',
        re.IGNORECASE
    )

    for match in block_regex.finditer(html):
        key = normalize_text(match.group(1) or '')
        val = to_number(match.group(2) or '')
        if key and val is not None:
            metrics_map[key] = val

    # Patrón inline: "Potencia: 8.5" / "Control: 9.0"
    if len(metrics_map) < 5:
        inline_regex = re.compile(
            r'(potencia|control|salida\s+de\s+bola|manejabilidad|punto\s+dulce)\s*[:\-]\s*([0-9]+(?:[.,][0-9]+)?)',
            re.IGNORECASE
        )
        for match in inline_regex.finditer(html):
            key = normalize_text(match.group(1) or '')
            val = to_number(match.group(2) or '')
            if key and val is not None and key not in metrics_map:
                metrics_map[key] = val

    potencia = metrics_map.get('potencia')
    control = metrics_map.get('control')
    salida = metrics_map.get('salida de bola')
    manejabilidad = metrics_map.get('manejabilidad')
    punto_dulce = metrics_map.get('punto dulce')

    if None in [potencia, control, salida, manejabilidad, punto_dulce]:
        return None

    return RadarMetrics(
        potencia=potencia, # type: ignore
        control=control, # type: ignore
        manejabilidad=manejabilidad, # type: ignore
        salida_bola=salida, # type: ignore
        punto_dulce=punto_dulce, # type: ignore
        source='padelzoom',
        confidence=0.95,
    )


def _scrape_padelzoom(pala_name: str) -> Optional[RadarMetrics]:
    """Busca una pala en PadelZoom.es realizando una búsqueda dinámica o slug directo."""
    try:
        import httpx
    except ImportError:
        import requests as httpx # type: ignore

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'es-ES,es;q=0.9',
    }

    clean_name = clean_pala_name_for_search(pala_name)
    if not clean_name:
        return None

    # Estrategia 1: Búsqueda dinámica en PadelZoom (?s=query)
    try:
        search_url = f"https://padelzoom.es/?s={quote_plus(clean_name)}"
        res = httpx.get(search_url, headers=headers, timeout=10, follow_redirects=True)
        if res.status_code == 200:
            # Extraer enlaces a palas individuales en padelzoom.es
            found_urls = re.findall(r'href="(https://padelzoom\.es/[a-z0-9-]+/)"', res.text, re.IGNORECASE)
            
            # Filtrar páginas generales que no son fichas de palas
            blacklisted = ('/las-mejores-', '/mejores-', '/blog/', '/categoria/', '/contacto/', '/politica-', '/aviso-')
            candidate_urls = []
            for u in set(found_urls):
                if not any(b in u for b in blacklisted):
                    candidate_urls.append(u)

            # Probar las primeras candidatos
            for candidate_url in candidate_urls[:3]:
                try:
                    r_detail = httpx.get(candidate_url, headers=headers, timeout=10, follow_redirects=True)
                    if r_detail.status_code == 200:
                        metrics = _parse_padelzoom_scores(r_detail.text)
                        if metrics:
                            metrics.source_url = str(r_detail.url)
                            return metrics
                except Exception as e:
                    logger.debug(f"PadelZoom candidate failed {candidate_url}: {e}")
    except Exception as e:
        logger.debug(f"PadelZoom search failed for {clean_name}: {e}")

    # Estrategia 2: Slug directo
    try:
        slug = _build_slug(clean_name)
        direct_url = f"https://padelzoom.es/{slug}/"
        res = httpx.get(direct_url, headers=headers, timeout=10, follow_redirects=True)
        if res.status_code == 200:
            metrics = _parse_padelzoom_scores(res.text)
            if metrics:
                metrics.source_url = str(res.url)
                return metrics
    except Exception as e:
        logger.debug(f"PadelZoom direct slug failed for {clean_name}: {e}")

    return None


# ──────────────────────────────────────────────
# TuMejorPala Scraper
# ──────────────────────────────────────────────

def _scrape_tumejorpala(pala_name: str) -> Optional[RadarMetrics]:
    """Busca una pala en TuMejorPala.com."""
    try:
        import httpx
    except ImportError:
        import requests as httpx # type: ignore

    clean_name = clean_pala_name_for_search(pala_name)
    if not clean_name:
        return None

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
    }

    try:
        slug = _build_slug(clean_name)
        direct_url = f"https://tumejorpala.com/{slug}/"
        res = httpx.get(direct_url, headers=headers, timeout=10, follow_redirects=True)
        if res.status_code == 200:
            metrics = _parse_tumejorpala_scores(res.text)
            if metrics:
                metrics.source_url = str(res.url)
                return metrics
    except Exception as e:
        logger.debug(f"TuMejorPala scrape failed for {clean_name}: {e}")

    return None


def _parse_tumejorpala_scores(html: str) -> Optional[RadarMetrics]:
    """Parsea métricas desde HTML de TuMejorPala."""
    key_patterns = [
        ('potencia',      r'(?:potencia|power)[\s:]*([0-9]+(?:[.,][0-9]+)?)'),
        ('control',       r'(?:control)[\s:]*([0-9]+(?:[.,][0-9]+)?)'),
        ('manejabilidad', r'(?:manejabilidad|maneabilidad)[\s:]*([0-9]+(?:[.,][0-9]+)?)'),
        ('salida_bola',   r'(?:salida\s+de\s+bola|exit)[\s:]*([0-9]+(?:[.,][0-9]+)?)'),
        ('punto_dulce',   r'(?:punto\s+dulce|sweet\s+spot)[\s:]*([0-9]+(?:[.,][0-9]+)?)'),
    ]

    metrics_map: Dict[str, float] = {}
    for key, pattern in key_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            val = to_number(matches[0])
            if val is not None:
                metrics_map[key] = val

    required = ['potencia', 'control', 'manejabilidad', 'salida_bola', 'punto_dulce']
    if not all(k in metrics_map for k in required):
        return None

    return RadarMetrics(
        potencia=metrics_map['potencia'],
        control=metrics_map['control'],
        manejabilidad=metrics_map['manejabilidad'],
        salida_bola=metrics_map['salida_bola'],
        punto_dulce=metrics_map['punto_dulce'],
        source='tumejorpala',
        confidence=0.85,
    )


def _build_slug(name: str) -> str:
    """Convierte el nombre de una pala a slug URL-friendly."""
    slug = normalize_text(name).replace(' ', '-').replace('/', '-')
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug


# ──────────────────────────────────────────────
# Deterministic Fallback Generator
# ──────────────────────────────────────────────

def calculate_deterministic_metrics(racket: dict) -> RadarMetrics:
    """
    Calcula métricas radar estimadas deterministas entre 0-10 basadas en
    las características físicas reales de la pala (Forma, Balance, Peso, Dureza).
    Garantiza que el 100% de palas tengan métricas utilizables.
    """
    specs = racket.get('specs') or {}
    if isinstance(specs, str):
        import json
        try:
            specs = json.loads(specs)
        except Exception:
            specs = {}

    forma = str(racket.get('characteristics_shape') or racket.get('caracteristicas_forma') or specs.get('Forma') or '').lower()
    balance = str(racket.get('characteristics_balance') or racket.get('caracteristicas_balance') or specs.get('Balance') or '').lower()
    dureza = str(racket.get('characteristics_hardness') or racket.get('caracteristicas_dureza') or specs.get('Dureza') or '').lower()
    
    peso_raw = racket.get('peso') or specs.get('Peso') or 365
    peso = 365.0
    if peso_raw:
        nums = re.findall(r'\d+(?:\.\d+)?', str(peso_raw))
        if nums:
            vals = [float(n) for n in nums]
            peso = sum(vals) / len(vals)

    # Potencia
    potencia = 5.5
    if 'diamante' in forma:
        potencia += 2.5
    elif 'lagrima' in forma or 'lágrima' in forma:
        potencia += 1.5
    
    if 'alto' in balance:
        potencia += 1.5
    elif 'medio' in balance:
        potencia += 0.5

    if peso > 370:
        potencia += 0.5
    if 'dura' in dureza or 'hard' in dureza:
        potencia += 0.5
    potencia = max(1.0, min(10.0, round(potencia, 1)))

    # Control
    control = 5.5
    if 'redonda' in forma:
        control += 2.5
    elif 'lagrima' in forma or 'lágrima' in forma:
        control += 1.0

    if 'bajo' in balance:
        control += 1.5
    elif 'medio' in balance:
        control += 0.5

    if 'blanda' in dureza or 'soft' in dureza:
        control += 0.5
    control = max(1.0, min(10.0, round(control, 1)))

    # Manejabilidad
    manejabilidad = 5.5
    if peso < 355:
        manejabilidad += 2.5
    elif peso <= 365:
        manejabilidad += 1.0

    if 'bajo' in balance:
        manejabilidad += 1.5
    elif 'medio' in balance:
        manejabilidad += 0.5
    manejabilidad = max(1.0, min(10.0, round(manejabilidad, 1)))

    # Salida de bola
    salida_bola = 5.5
    if 'blanda' in dureza or 'soft' in dureza:
        salida_bola += 2.5
    elif 'media' in dureza:
        salida_bola += 1.0

    if 'redonda' in forma or 'lagrima' in forma or 'lágrima' in forma:
        salida_bola += 0.5
    salida_bola = max(1.0, min(10.0, round(salida_bola, 1)))

    # Punto dulce
    punto_dulce = 5.5
    if 'redonda' in forma:
        punto_dulce += 2.5
    elif 'lagrima' in forma or 'lágrima' in forma:
        punto_dulce += 1.0

    if 'blanda' in dureza or 'soft' in dureza:
        punto_dulce += 0.5
    punto_dulce = max(1.0, min(10.0, round(punto_dulce, 1)))

    return RadarMetrics(
        potencia=potencia,
        control=control,
        manejabilidad=manejabilidad,
        salida_bola=salida_bola,
        punto_dulce=punto_dulce,
        source='estimacion_algoritmica',
        confidence=0.65,
    )


# ──────────────────────────────────────────────
# Main API
# ──────────────────────────────────────────────

def scrape_pala_metrics(pala_name: str) -> Optional[RadarMetrics]:
    """
    Busca métricas radar en fuentes externas verificadas.
    """
    logger.debug(f"Buscando métricas externas para: {pala_name}")

    # 1. PadelZoom (confianza 0.95)
    metrics = _scrape_padelzoom(pala_name)
    if metrics:
        logger.info(f"✓ Encontrado en PadelZoom: {pala_name}")
        return metrics

    # 2. TuMejorPala (confianza 0.85)
    metrics = _scrape_tumejorpala(pala_name)
    if metrics:
        logger.info(f"✓ Encontrado en TuMejorPala: {pala_name}")
        return metrics

    return None