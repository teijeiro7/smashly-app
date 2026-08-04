"""Textos en pantalla (los overlays del hook) y tarjeta de cierre.

Los overlays son el tercer canal de la regla de los 3 segundos: hook visual +
hook verbal + texto en pantalla. Aquí se generan como un .ass aparte de los
subtítulos, con estilo distinto (más arriba, píldora de fondo, más grande) para
que no compitan visualmente.

Formato del JSON de overlays:

    [
      {"text": "300€ · pala equivocada", "start": 0.0,  "end": 7.5},
      {"text": "la marca no te dice nada", "start": 8.0,  "end": 11.5},
      {"text": "el balance sí",            "start": 11.5, "end": 15.5,
       "style": "accent"},
      {"text": "¿tú también? 👇",          "start": 22.0, "end": 24.0,
       "pos": "center"}
    ]

Campos: text (obligatorio), start, end, style ("plain"|"accent"), pos
("top"|"center"). Por defecto style="plain", pos="top".
"""

from __future__ import annotations

import json
from pathlib import Path

# Paleta de marca en formato ASS (&HAABBGGRR)
WHITE = "&H00FFFFFF"
AMBER = "&H000677D9"          # #d97706
GREEN_DEEP = "&H00182818"     # aprox. #0f2818
BLACK = "&H00000000"
# Fondo semitransparente para la píldora (AA=60 → ~62% opaco)
BOX_DARK = "&H60101810"


def _ts(t: float) -> str:
    t = max(t, 0.0)
    return f"{int(t // 3600):d}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def load(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("overlays", [])
    out = []
    for i, d in enumerate(data):
        if "text" not in d:
            raise SystemExit(f"overlays[{i}]: falta 'text'")
        out.append(
            {
                "text": str(d["text"]),
                "start": float(d.get("start", 0.0)),
                "end": float(d.get("end", d.get("start", 0.0) + 3.0)),
                "style": d.get("style", "plain"),
                "pos": d.get("pos", "top"),
            }
        )
    return out


def build_ass(
    items: list[dict],
    width: int,
    height: int,
    *,
    font: str = "DejaVu Sans",
    font_scale: float = 0.042,
    top_frac: float = 0.13,
    max_chars: int = 24,
    fade_ms: int = 180,
) -> str:
    """Genera el .ass de overlays para una resolución concreta.

    top_frac deja libre el 13% superior, donde va la UI de la plataforma.
    El cuerpo se reduce si el texto no cabe, igual que en los subtítulos.
    """
    margin_h = int(width * 0.06)
    avail = width - 2 * margin_h

    longest = max((len(_wrap(i["text"], max_chars).replace("\\N", "")) for i in items), default=1)
    # aproximación de ancho de carácter para una sans bold
    base = max(int(height * font_scale), 16)
    fits = int(avail / (0.60 * max(_longest_line(items, max_chars), 1)))
    fontsize = max(min(base, fits), int(height * 0.024))
    outline = max(int(fontsize * 0.10), 2)

    margin_top = int(height * top_frac)

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ovTop,{font},{fontsize},{WHITE},{WHITE},{BLACK},{BOX_DARK},-1,0,0,0,100,100,1,0,3,{outline},0,8,{margin_h},{margin_h},{margin_top},1
Style: ovTopA,{font},{fontsize},{AMBER},{AMBER},{BLACK},{BOX_DARK},-1,0,0,0,100,100,1,0,3,{outline},0,8,{margin_h},{margin_h},{margin_top},1
Style: ovMid,{font},{int(fontsize * 1.15)},{WHITE},{WHITE},{BLACK},{BOX_DARK},-1,0,0,0,100,100,1,0,3,{outline},0,5,{margin_h},{margin_h},0,1
Style: ovMidA,{font},{int(fontsize * 1.15)},{AMBER},{AMBER},{BLACK},{BOX_DARK},-1,0,0,0,100,100,1,0,3,{outline},0,5,{margin_h},{margin_h},0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events: list[str] = []
    for it in items:
        accent = it["style"] == "accent"
        style = ("ovMidA" if accent else "ovMid") if it["pos"] == "center" else (
            "ovTopA" if accent else "ovTop"
        )
        txt = _wrap(it["text"], max_chars).replace("{", "").replace("}", "")
        events.append(
            f"Dialogue: 1,{_ts(it['start'])},{_ts(it['end'])},{style},,0,0,0,,"
            f"{{\\fad({fade_ms},{fade_ms})}}{txt}"
        )
    return head + "\n".join(events) + "\n"


def _wrap(text: str, max_chars: int) -> str:
    """Parte en líneas de como máximo max_chars, sin cortar palabras."""
    if "\\N" in text:
        return text
    words, lines, cur = text.split(), [], ""
    for w in words:
        cand = f"{cur} {w}".strip()
        if cur and len(cand) > max_chars:
            lines.append(cur)
            cur = w
        else:
            cur = cand
    if cur:
        lines.append(cur)
    return "\\N".join(lines)


def _longest_line(items: list[dict], max_chars: int) -> int:
    best = 1
    for it in items:
        for line in _wrap(it["text"], max_chars).split("\\N"):
            best = max(best, len(line))
    return best


def write_ass(path: Path, **kwargs) -> Path:
    path.write_text(build_ass(**kwargs), encoding="utf-8")
    return path


# --------------------------------------------------------------------------- #
# Tarjeta de cierre
# --------------------------------------------------------------------------- #

def outro_filter(
    width: int,
    height: int,
    *,
    url: str = "smashly-app.es",
    font: str = "DejaVu Sans",
) -> tuple[str, str]:
    """Devuelve (lavfi_input, filtro) para generar la tarjeta de cierre.

    Fondo con el gradiente de marca aproximado y la URL debajo del logo, que se
    superpone aparte porque viene de un PNG.
    """
    fontsize = int(height * 0.030)
    y = int(height * 0.60)
    # gradient del hero: #0f2818 → #16a34a
    src = (
        f"gradients=s={width}x{height}:c0=0x0f2818:c1=0x16a34a"
        f":x0=0:y0={height}:x1={width}:y1=0:duration=2:speed=0.0001"
    )
    vf = (
        f"drawtext=font='{font}':text='{url}':fontcolor=0xffffff@0.92:"
        f"fontsize={fontsize}:x=(w-text_w)/2:y={y}:"
        f"borderw=0"
    )
    return src, vf
