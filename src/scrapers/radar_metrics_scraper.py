"""
radar_metrics_scraper.py — Extrae métricas radar verificadas desde fuentes externas.

Fuentes:
  - PadelZoom.es (Primary)  → Confianza: 0.95
  - TuMejorPala.com (Secondary) → Confianza: 0.85

USO:
  from radar_metrics_scraper import scrape_pala_metrics
  metrics = scrape_pala_metrics("Bullpadel Vertex 05 Light")
  if metrics:
      print(f"Potencia: {metrics.potencia}, Control: {metrics.control}")
"""

import re
import logging
from dataclasses import dataclass
from typing import Optional

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
# Normalización de texto
# ──────────────────────────────────────────────

def normalize_text(text: str) -> str:
    """Normaliza texto para comparación."""
    if not text:
        return ''
    return (text
            .lower()
            .strip()
            .replace('\u00e1', 'a')
            .replace('\u00e9', 'e')
            .replace('\u00ed', 'i')
            .replace('\u00f3', 'o')
            .replace('\u00fa', 'u')
            .replace('\u00f1', 'n')
            .replace('\u00e0', 'a')
            .replace('\u00e8', 'e')
            .replace('\u00ec', 'i')
            .replace('\u00f2', 'o')
            .replace('\u00f9', 'u')
            .replace('  ', ' '))


def to_number(raw: str) -> Optional[float]:
    """Convierte string a número entre 0-10."""
    try:
        value = float(str(raw).replace(',', '.'))
        value = max(0, min(10, round(value * 10) / 10))
        return value
    except (ValueError, TypeError):
        return None


# ──────────────────────────────────────────────
# PadelZoom Scraper
# ──────────────────────────────────────────────

def _parse_padelzoom_scores(html: str) -> Optional[RadarMetrics]:
    """
    Parsea las métricas radar desde HTML de PadelZoom.
    
    Busca patrones como:
    - <div class="type-puntuacion"><span>Potencia</span>...</div>
    - <div class="value-puntuacion"><span>8.5</span></div>
    - O en texto: "Potencia: 8.5"
    """
    metrics_map: dict[str, float] = {}
    
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
    if not metrics_map:
        inline_regex = re.compile(
            r'(potencia|control|salida\s+de\s+bola|manejabilidad|punto\s+dulce)\s*[:\-]\s*([0-9]+(?:[.,][0-9]+)?)',
            re.IGNORECASE
        )
        for match in inline_regex.finditer(html):
            key = normalize_text(match.group(1) or '')
            val = to_number(match.group(2) or '')
            if key and val is not None and key not in metrics_map:
                metrics_map[key] = val
    
    # Mapeo de nombres de PadelZoom al formato interno
    potencia = metrics_map.get('potencia')
    control = metrics_map.get('control')
    salida = metrics_map.get('salida de bola') or metrics_map.get('salida de bola')
    manejabilidad = metrics_map.get('manejabilidad')
    punto_dulce = metrics_map.get('punto dulce')
    
    # Todas las métricas son requeridas
    if None in [potencia, control, salida, manejabilidad, punto_dulce]:
        return None
    
    return RadarMetrics(
        potencia=potencia,
        control=control,
        manejabilidad=manejabilidad,
        salida_bola=salida,
        punto_dulce=punto_dulce,
        source='padelzoom',
        confidence=0.95,
    )


def _scrape_padelzoom(pala_name: str) -> Optional[RadarMetrics]:
    """
    Busca una pala en PadelZoom.es y extrae sus métricas radar.
    
    Estrategia:
    1. Construir URL esperada: padelzoom.es/[marca]-[modelo]
    2. Intentar scraping directo
    3. Si falla, buscar en sitemap
    """
    try:
        import httpx
    except ImportError:
        logger.warning("httpx no instalado, usando requests como fallback")
        import requests as httpx
    
    try:
        # Intentar URL directa basada en el nombre
        slug = _build_slug(pala_name)
        direct_url = f"https://padelzoom.es/{slug}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'es-ES,es;q=0.9',
        }
        
        response = httpx.get(direct_url, headers=headers, timeout=15, follow_redirects=True)
        
        if response.status_code == 200:
            metrics = _parse_padelzoom_scores(response.text)
            if metrics:
                metrics.source_url = response.url
                return metrics
                
    except Exception as e:
        logger.debug(f"PadelZoom scrape failed for {pala_name}: {e}")
    
    return None


# ──────────────────────────────────────────────
# TuMejorPala Scraper
# ──────────────────────────────────────────────

def _scrape_tumejorpala(pala_name: str) -> Optional[RadarMetrics]:
    """
    Busca una pala en TuMejorPala.com y extrae sus métricas radar.
    """
    try:
        import httpx
    except ImportError:
        import requests as httpx
    
    try:
        slug = _build_slug(pala_name)
        direct_url = f"https://www.tumejorpala.com/{slug}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        }
        
        response = httpx.get(direct_url, headers=headers, timeout=15, follow_redirects=True)
        
        if response.status_code == 200:
            # TuMejorPala usa formato similar, intentar parser genérico
            metrics = _parse_tumejorpala_scores(response.text)
            if metrics:
                metrics.source_url = response.url
                return metrics
                
    except Exception as e:
        logger.debug(f"TuMejorPala scrape failed for {pala_name}: {e}")
    
    return None


def _parse_tumejorpala_scores(html: str) -> Optional[RadarMetrics]:
    """Parsea métricas desde HTML de TuMejorPala."""
    metrics_map: dict[str, float] = {}
    
    # Buscar patrones de puntuación
    patterns = [
        # Patrón: "Potencia" seguido de número
        r'(?:potencia|power)[\s:]*([0-9]+(?:[.,][0-9]+)?)',
        r'(?:control)[\s:]*([0-9]+(?:[.,][0-9]+)?)',
        r'(?:manejabilidad|maneabilidad)[\s:]*([0-9]+(?:[.,][0-9]+)?)',
        r'(?:salida\s+de\s+bola|exit)[\s:]*([0-9]+(?:[.,][0-9]+)?)',
        r'(?:punto\s+dulce|sweet\s+spot)[\s:]*([0-9]+(?:[.,][0-9]+)?)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            # Asumir que el primer match corresponde al primer tipo de métrica no asignada
            for key, pattern in zip(['potencia', 'control', 'manejabilidad', 'salida_bola', 'punto_dulce'], patterns):
                if key not in metrics_map:
                    key_matches = re.findall(pattern, html, re.IGNORECASE)
                    if key_matches:
                        val = to_number(key_matches[0])
                        if val is not None:
                            metrics_map[key] = val
    
    # Verificar que tenemos todas las métricas
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


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _build_slug(name: str) -> str:
    """Convierte nombre de pala a slug URL-friendly."""
    STOP_WORDS = {'pala', 'palas', 'padel', 'edition', 'edicion', 'review', 'pro', 'lt', 'light', 'tour', 'team', 'club'}
    
    # Limpiar y normalizar
    slug = (name
            .lower()
            .replace('\u00f1', 'n')
            .replace('\u00e1', 'a')
            .replace('\u00e9', 'e')
            .replace('\u00ed', 'i')
            .replace('\u00f3', 'o')
            .replace('\u00fa', 'u')
            .replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
            .replace(' ', '-')
            .replace('/', '-'))
    
    # Eliminar palabras vacías
    parts = [p for p in slug.split('-') if p and p not in STOP_WORDS]
    
    return '-'.join(parts)


# ──────────────────────────────────────────────
# Main API
# ──────────────────────────────────────────────

def scrape_pala_metrics(pala_name: str) -> Optional[RadarMetrics]:
    """
    Función principal: busca métricas radar en fuentes externas.
    
    Estrategia:
    1. Intentar PadelZoom.es (confianza 0.95)
    2. Si no encontrado, intentar TuMejorPala.com (confianza 0.85)
    3. Si ninguna fuente tiene la pala, retornar None
    
    Args:
        pala_name: Nombre completo de la pala (ej: "Bullpadel Vertex 05 Light")
        
    Returns:
        RadarMetrics con los 5 valores o None si no se encontró
    """
    logger.debug(f"Buscando métricas para: {pala_name}")
    
    # Intentar PadelZoom primero (mayor confianza)
    metrics = _scrape_padelzoom(pala_name)
    if metrics:
        logger.info(f"✓ Encontrado en PadelZoom: {pala_name}")
        return metrics
    
    # Fallback a TuMejorPala
    metrics = _scrape_tumejorpala(pala_name)
    if metrics:
        logger.info(f"✓ Encontrado en TuMejorPala: {pala_name}")
        return metrics
    
    logger.debug(f"No se encontraron métricas externas para: {pala_name}")
    return None


# ──────────────────────────────────────────────
# Testing
# ──────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
    )
    
    test_palas = [
        "Bullpadel Vertex 05 Light 2024",
        "Adidas Metalbone 3.0",
        "Babolat Technical V2",
        "Nox ML10 Pro Cup",
    ]
    
    if len(sys.argv) > 1:
        test_palas = sys.argv[1:]
    
    print("\n" + "=" * 60)
    print("TEST: scrape_pala_metrics")
    print("=" * 60)
    
    for pala in test_palas:
        print(f"\n🔍 {pala}")
        metrics = scrape_pala_metrics(pala)
        if metrics:
            print(f"   ✓ Source: {metrics.source} (confianza: {metrics.confidence})")
            print(f"   ✓ Potencia: {metrics.potencia}, Control: {metrics.control}")
            print(f"   ✓ Manejabilidad: {metrics.manejabilidad}, Salida bola: {metrics.salida_bola}")
            print(f"   ✓ Punto dulce: {metrics.punto_dulce}")
        else:
            print(f"   ✗ No encontrado en fuentes externas")
    
    print("\n" + "=" * 60)