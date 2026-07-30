"""Subtítulos word-level en estilo short-form, quemados con ffmpeg.

Genera un .ass con resaltado palabra a palabra: se muestra el grupo completo
(2 líneas, 3-5 palabras por línea) y la palabra que suena se pinta en ámbar.
Es el patrón que sube el watch time; hacerlo a mano en CapCut es lo tedioso
que este módulo elimina.

Transcripción: faster-whisper (opcional). Si no está instalado, se puede pasar
un JSON de palabras ya cronometradas con --words-json.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

# Paleta de marca Smashly
BRAND_AMBER = "&H000677D9"  # #d97706 en formato ASS (&HAABBGGRR)
WHITE = "&H00FFFFFF"
OUTLINE = "&H00000000"


@dataclass
class Word:
    text: str
    start: float
    end: float


def transcribe(audio: Path, language: str = "es", model: str = "small") -> list[Word]:
    """Devuelve palabras con timestamps usando faster-whisper."""
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "Falta faster-whisper. Instala con:\n"
            "  pip install faster-whisper\n"
            "O pasa los tiempos ya hechos con --words-json."
        ) from exc

    wm = WhisperModel(model, device="cpu", compute_type="int8")
    segments, _ = wm.transcribe(str(audio), language=language, word_timestamps=True)
    words: list[Word] = []
    for seg in segments:
        for w in seg.words or []:
            txt = w.word.strip()
            if txt:
                words.append(Word(txt, float(w.start), float(w.end)))
    return words


def load_words(path: Path) -> list[Word]:
    """Carga [{"text","start","end"}, ...] o el formato de faster-whisper."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("words", [])
    return [
        Word(str(d["text"]).strip(), float(d["start"]), float(d["end"]))
        for d in data
        if str(d.get("text", "")).strip()
    ]


PUNCT = ".,;:!?¡¿"


def apply_corrections(words: list[Word], corrections: dict[str, str]) -> list[Word]:
    """Corrige errores típicos de ASR. El pádel tiene vocabulario que Whisper falla.

    La comparación ignora mayúsculas y la puntuación final, que se conserva:
    "smashli." con {"smashli": "Smashly"} devuelve "Smashly.".
    """
    if not corrections:
        return words
    lut = {k.lower(): v for k, v in corrections.items()}
    out: list[Word] = []
    for w in words:
        core = w.text.rstrip(PUNCT)
        tail = w.text[len(core) :]
        repl = lut.get(core.lower())
        out.append(Word(repl + tail, w.start, w.end) if repl else w)
    return out


DEFAULT_CORRECTIONS = {
    "smashli": "Smashly",
    "smashly": "Smashly",
    "esmashly": "Smashly",
    "padel": "pádel",
    "bandera": "bandeja",
    "vibora": "víbora",
}


# Ancho medio de carácter como fracción del cuerpo, para una sans bold.
# Se usa para calcular el tamaño de fuente que cabe sin recortar.
CHAR_W_RATIO = 0.60


def _split_lines(
    words: list[Word], max_chars: int, max_words: int
) -> list[list[Word]]:
    """Parte la secuencia en líneas respetando un presupuesto de caracteres.

    Agrupar solo por número de palabras desborda con palabras largas
    ("trescientos", "equivocada"), que en pádel abundan. El presupuesto de
    caracteres es lo que evita que el subtítulo se salga del cuadro.
    """
    lines: list[list[Word]] = []
    cur: list[Word] = []
    cur_len = 0
    for w in words:
        add = len(w.text) + (1 if cur else 0)
        too_long = cur and (cur_len + add > max_chars or len(cur) >= max_words)
        if too_long:
            lines.append(cur)
            cur, cur_len = [w], len(w.text)
        else:
            cur.append(w)
            cur_len += add
    if cur:
        lines.append(cur)
    return lines


def _group_cues(
    lines: list[list[Word]], lines_per_cue: int
) -> list[list[list[Word]]]:
    return [
        lines[i : i + lines_per_cue] for i in range(0, len(lines), lines_per_cue)
    ]


def _fit_fontsize(
    lines: list[list[Word]], avail_px: int, base: int, floor_px: int
) -> int:
    """Reduce el cuerpo hasta que la línea más ancha quepa en avail_px."""
    widest = max((len(" ".join(w.text for w in ln)) for ln in lines), default=1)
    fits = int(avail_px / (CHAR_W_RATIO * max(widest, 1)))
    return max(min(base, fits), floor_px)


def _ts(t: float) -> str:
    t = max(t, 0.0)
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t % 60
    return f"{h:d}:{m:02d}:{s:05.2f}"


def _layout(cue: list[list[Word]], active: int) -> str:
    """Monta el texto ASS del cue con la palabra nº `active` (índice plano) en ámbar."""
    out: list[str] = []
    idx = 0
    for li, line in enumerate(cue):
        if li:
            out.append("\\N")
        for wi, w in enumerate(line):
            if wi:
                out.append(" ")
            token = w.text.replace("{", "").replace("}", "")
            if idx == active:
                out.append(f"{{\\c{BRAND_AMBER}}}{token}{{\\c{WHITE}}}")
            else:
                out.append(token)
            idx += 1
    return "".join(out)


def build_ass(
    words: list[Word],
    width: int,
    height: int,
    *,
    words_per_line: int = 4,
    max_chars_per_line: int = 18,
    lines: int = 2,
    font: str = "DejaVu Sans",
    font_scale: float = 0.048,
    margin_frac: float = 0.20,
    margin_h_frac: float = 0.055,
    min_dur: float = 0.14,
) -> str:
    """Devuelve el contenido de un fichero .ass.

    font_scale y los márgenes son fracciones de la dimensión correspondiente,
    así el mismo layout funciona en 1080x1920 y en 1080x1350.

    El cuerpo de letra se **reduce automáticamente** si la línea más larga no
    cabe: más vale un subtítulo algo más pequeño que uno recortado por el borde.

    margin_frac=0.20 mantiene los subtítulos fuera del 20% inferior, donde
    viven la UI de la plataforma y el watermark de Flow.
    """
    margin_h = int(width * margin_h_frac)
    margin_v = int(height * margin_frac)
    avail = width - 2 * margin_h

    split = _split_lines(words, max_chars_per_line, words_per_line)
    fontsize = _fit_fontsize(
        split,
        avail_px=avail,
        base=max(int(height * font_scale), 18),
        floor_px=max(int(height * 0.026), 14),
    )
    outline = max(int(fontsize * 0.11), 2)
    shadow = 0

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: sm,{font},{fontsize},{WHITE},{WHITE},{OUTLINE},{OUTLINE},-1,0,0,0,100,100,0,0,1,{outline},{shadow},2,{margin_h},{margin_h},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events: list[str] = []
    for cue in _group_cues(split, lines):
        flat = [w for line in cue for w in line]
        for i, w in enumerate(flat):
            start = w.start
            # el cue dura hasta el inicio de la siguiente palabra: sin huecos
            end = flat[i + 1].start if i + 1 < len(flat) else w.end
            if end - start < min_dur:
                end = start + min_dur
            events.append(
                f"Dialogue: 0,{_ts(start)},{_ts(end)},sm,,0,0,0,,"
                f"{_layout(cue, i)}"
            )
    return head + "\n".join(events) + "\n"


def write_ass(path: Path, **kwargs) -> Path:
    path.write_text(build_ass(**kwargs), encoding="utf-8")
    return path
