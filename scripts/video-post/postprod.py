#!/usr/bin/env python3
"""Post-producción de vídeos short-form de Smashly.

Coge los clips que salen de Google Flow y hace todo lo que si no habría que
hacer a mano en CapCut:

  1. concatena los beats normalizando resolución y fps
  2. recorta el watermark si se pide
  3. mezcla tu VO clonada con el audio nativo de Veo (ducking, no silenciado)
  4. normaliza a EBU R128 en dos pasadas: -16 LUFS / TP -1.5 / LRA 11
  5. genera subtítulos word-level con resaltado en ámbar de marca y los quema
  6. exporta a cada perfil de plataforma con cover+crop, sin deformar

Requisitos: ffmpeg y ffprobe en el PATH. Para subtítulos automáticos,
`pip install faster-whisper` (o pasa --words-json).

Ejemplos
--------
# Vídeo 1: 3 beats de Flow + VO clonada, export vertical completo
python postprod.py \
    --clips beat1.mp4 beat2.mp4 beat3.mp4 \
    --vo vo.mp3 \
    --profiles vertical \
    --out ../../out/video-01

# Solo un montaje ya hecho, subtítulos y 4:5 para el feed
python postprod.py --clips escena.mp4 --vo vo.mp3 --profiles ig_4x5 --out ../../out/v1

# Sin subtítulos, para revisar el corte antes de locutar
python postprod.py --clips beat*.mp4 --no-subs --profiles reels --out /tmp/rough
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import captions  # noqa: E402
import overlays as ov  # noqa: E402
import profiles as prof  # noqa: E402

# EBU R128 para web y social. -24/-2 sería broadcast.
LUFS_TARGET = -16.0
TRUE_PEAK = -1.5
LRA = 11.0

# Resolución de trabajo: vertical nativo. Todo se monta aquí y luego se derivan
# los perfiles, así el crop parte siempre del máximo de información.
WORK_W, WORK_H, WORK_FPS = 1080, 1920, 30

# Grades unificados. Se aplican por igual a todos los beats: es la herramienta
# más barata para que clips generados por separado parezcan la misma película.
GRADES: dict[str, str] = {
    "none": "",
    # Atardecer cálido: sombras al verde, altas al ámbar, viñeta suave
    "brand": (
        "colorbalance=rs=-0.03:gs=0.05:bs=-0.02:rm=0.02:gm=0.00:bm=-0.02"
        ":rh=0.05:gh=0.01:bh=-0.05,"
        "eq=saturation=1.06:contrast=1.04,"
        "vignette=PI/5"
    ),
    # Solo temperatura, sin viñeta: para material que ya viene contrastado
    "warm": "colorbalance=rm=0.03:bm=-0.03:rh=0.04:bh=-0.04,eq=saturation=1.04",
    # Frío y técnico: para los vídeos de datos y comparativas
    "cool": "colorbalance=rs=-0.02:bs=0.04:rh=-0.03:bh=0.05,eq=saturation=1.02",
}


def run(cmd: list[str], capture: bool = False) -> str:
    res = subprocess.run(
        cmd,
        check=False,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE,
        text=True,
    )
    if res.returncode != 0:
        sys.exit(
            f"\nFalló: {' '.join(cmd[:6])} …\n"
            f"{(res.stderr or '')[-2500:]}"
        )
    return (res.stdout or "") + (res.stderr or "")


def need(binary: str) -> None:
    if not shutil.which(binary):
        sys.exit(f"Falta '{binary}' en el PATH. Instálalo antes de seguir.")


def probe(path: Path) -> dict:
    out = run(
        [
            "ffprobe", "-v", "error", "-print_format", "json",
            "-show_format", "-show_streams", str(path),
        ],
        capture=True,
    )
    return json.loads(out[out.index("{") :]) if "{" in out else {}


def duration_of(path: Path) -> float:
    info = probe(path)
    try:
        return float(info["format"]["duration"])
    except (KeyError, ValueError):
        return 0.0


def has_audio(path: Path) -> bool:
    return any(s.get("codec_type") == "audio" for s in probe(path).get("streams", []))


# --------------------------------------------------------------------------- #
# 1-2. concat + crop de watermark
# --------------------------------------------------------------------------- #

def concat(
    clips: list[Path],
    dst: Path,
    crop_bottom: int = 0,
    inserts: list[dict] | None = None,
) -> Path:
    """Concatena normalizando a la resolución de trabajo.

    Se usa filter_complex en vez del demuxer concat porque los clips de Flow
    pueden venir de modelos distintos (Lite/Fast/Omni) y no siempre comparten
    parámetros exactos. Es más lento pero no falla.

    `inserts` pega una captura real de la app dentro de la pantalla de un móvil
    que aparece en un clip, en vez de cortar a un pantallazo a toda pantalla.
    Es lo que permite enseñar la UI sin salir de la escena.
    """
    pre = f"crop=iw:ih-{crop_bottom}:0:0," if crop_bottom else ""
    inserts = inserts or []
    parts, cmd = [], ["ffmpeg", "-y"]
    for c in clips:
        cmd += ["-i", str(c)]

    # Las imágenes de insert van después de los clips en la lista de entradas.
    # El -t es obligatorio: un `-loop 1` sin duración no llega nunca a EOF y
    # deja el concat colgado indefinidamente.
    ins_input: dict[int, int] = {}
    for n, ins in enumerate(inserts):
        idx = ins["clip"] - 1
        if not 0 <= idx < len(clips):
            sys.exit(f"screen-insert: clip {ins['clip']} fuera de rango (1..{len(clips)})")
        span = duration_of(clips[idx]) + 1.0
        cmd += ["-loop", "1", "-t", f"{span:.3f}", "-i", str(ins["image"])]
        ins_input[n] = len(clips) + n

    for i, c in enumerate(clips):
        base = (
            f"[{i}:v]{pre}scale={WORK_W}:{WORK_H}:force_original_aspect_ratio=increase,"
            f"crop={WORK_W}:{WORK_H},setsar=1,fps={WORK_FPS}"
        )
        mine = [n for n, ins in enumerate(inserts) if ins["clip"] == i + 1]
        if not mine:
            parts.append(f"{base}[v{i}]")
        else:
            parts.append(f"{base}[base{i}]")
            cur = f"base{i}"
            for n in mine:
                ins = inserts[n]
                src = ins_input[n]
                lbl = f"ins{i}_{n}"
                parts.append(
                    f"[{src}:v]scale={ins['w']}:{ins['h']},"
                    f"format=rgba,colorchannelmixer=aa={ins['opacity']}[{lbl}]"
                )
                nxt = f"ov{i}_{n}"
                en = f":enable='between(t,{ins['start']},{ins['end']})'"
                parts.append(
                    f"[{cur}][{lbl}]overlay=x={ins['x']}:y={ins['y']}{en}[{nxt}]"
                )
                cur = nxt
            parts.append(f"[{cur}]null[v{i}]")
        if has_audio(c):
            parts.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo[a{i}]")
        else:
            # clip mudo: silencio del mismo largo para que el concat no se desincronice
            parts.append(
                f"anullsrc=r=48000:cl=stereo,atrim=duration={duration_of(c):.3f}[a{i}]"
            )

    streams = "".join(f"[v{i}][a{i}]" for i in range(len(clips)))
    parts.append(f"{streams}concat=n={len(clips)}:v=1:a=1[v][a]")

    cmd += [
        "-filter_complex", ";".join(parts),
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "16",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k",
        str(dst),
    ]
    run(cmd)
    return dst


# --------------------------------------------------------------------------- #
# 3. mezcla VO + audio nativo
# --------------------------------------------------------------------------- #

def mix_vo(video: Path, vo: Path, dst: Path, bed: float = 0.20, duck: bool = True) -> Path:
    """Pone el VO al frente y el audio de Veo de fondo.

    No se silencia el audio nativo a propósito: los impactos de bola, el
    chirrido de zapatillas y el reverb de pista que genera Veo son lo que hace
    que el vídeo suene a pádel de verdad.

    duck=True usa sidechaincompress, que baja el fondo solo cuando hablas.
    duck=False deja el fondo a volumen fijo `bed`.
    """
    if duck:
        fc = (
            f"[0:a]volume={bed * 2.2:.3f}[bed];"
            "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,"
            "asplit=2[vo][key];"
            "[bed][key]sidechaincompress=threshold=0.05:ratio=12:attack=8:release=350[ducked];"
            "[ducked][vo]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[a]"
        )
    else:
        fc = (
            f"[0:a]volume={bed:.3f}[bed];"
            "[1:a]aformat=sample_rates=48000:channel_layouts=stereo[vo];"
            "[bed][vo]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[a]"
        )

    run([
        "ffmpeg", "-y", "-i", str(video), "-i", str(vo),
        "-filter_complex", fc,
        "-map", "0:v", "-map", "[a]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
        str(dst),
    ])
    return dst


# --------------------------------------------------------------------------- #
# 4. loudness EBU R128 en dos pasadas
# --------------------------------------------------------------------------- #

_LOUDNORM_KEYS = (
    "input_i", "input_tp", "input_lra", "input_thresh", "target_offset",
)


def measure_loudness(path: Path) -> dict[str, str]:
    log = run([
        "ffmpeg", "-i", str(path), "-hide_banner",
        "-af", f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK}:LRA={LRA}:print_format=json",
        "-f", "null", "-",
    ], capture=True)
    blocks = re.findall(r"\{[^{}]*\}", log, re.S)
    for block in reversed(blocks):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if "input_i" in data:
            return {k: str(data[k]) for k in _LOUDNORM_KEYS if k in data}
    return {}


def normalize_loudness(src: Path, dst: Path) -> Path:
    m = measure_loudness(src)
    if m and all(k in m for k in _LOUDNORM_KEYS):
        af = (
            f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK}:LRA={LRA}:linear=true"
            f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
            f":offset={m['target_offset']}"
        )
        print(f"   medido: I={m['input_i']} LUFS, TP={m['input_tp']} dBTP")
    else:
        af = f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK}:LRA={LRA}"
        print("   aviso: no se pudo medir, se aplica loudnorm de una pasada")

    run([
        "ffmpeg", "-y", "-i", str(src),
        "-af", af, "-map", "0:v", "-map", "0:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
        str(dst),
    ])
    return dst


# --------------------------------------------------------------------------- #
# 6. export por perfil
# --------------------------------------------------------------------------- #

def load_inserts(path: Path, repo_root: Path) -> list[dict]:
    """Lee el JSON de inserts de pantalla y rellena los valores por defecto.

    Formato:
      [{"clip": 3, "image": "screenshots/08-best-racket-mobile.png",
        "x": 392, "y": 720, "w": 296, "h": 640,
        "start": 1.0, "end": 8.0, "opacity": 0.97}]

    `clip` es 1-indexado, en el mismo orden que --clips. `image` puede ser
    relativa a la raíz del repo.
    """
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("inserts", [])
    out: list[dict] = []
    for i, d in enumerate(data):
        for req in ("clip", "image", "x", "y", "w", "h"):
            if req not in d:
                sys.exit(f"screen-insert[{i}]: falta '{req}'")
        img = Path(d["image"])
        if not img.is_absolute() and not img.exists():
            img = repo_root / img
        if not img.exists():
            sys.exit(f"screen-insert[{i}]: no existe la imagen {d['image']}")
        out.append({
            "clip": int(d["clip"]),
            "image": img,
            "x": int(d["x"]), "y": int(d["y"]),
            "w": int(d["w"]), "h": int(d["h"]),
            "start": float(d.get("start", 0.0)),
            "end": float(d.get("end", 9999.0)),
            "opacity": float(d.get("opacity", 0.97)),
        })
    return out


def dump_grid(clips: list[Path], out_dir: Path, at: float = 4.0) -> None:
    """Saca un frame de cada clip con una rejilla de 100 px etiquetada.

    Sirve para leer a ojo las coordenadas de la pantalla del móvil y
    escribirlas en el JSON de --screen-insert.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    grid = (
        f"scale={WORK_W}:{WORK_H}:force_original_aspect_ratio=increase,"
        f"crop={WORK_W}:{WORK_H},"
        "drawgrid=w=100:h=100:t=1:c=white@0.35,"
        "drawgrid=w=500:h=500:t=2:c=red@0.6"
    )
    for i, c in enumerate(clips, start=1):
        t = min(at, max(duration_of(c) - 0.2, 0.1))
        dst = out_dir / f"grid_clip{i}.png"
        run([
            "ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", str(c),
            "-vf", grid, "-frames:v", "1", str(dst),
        ])
        print(f"   → {dst}  (t={t:.1f}s)")
    print(
        "\nLa rejilla fina es de 100 px y la gruesa de 500 px, desde arriba a la\n"
        "izquierda. Mide el rectángulo de la pantalla del móvil y escríbelo como\n"
        '{"clip": N, "image": "...", "x":…, "y":…, "w":…, "h":…}'
    )


def _ass_arg(path: Path) -> str:
    esc = str(path).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")
    return f"ass='{esc}'"


def export(
    src: Path,
    profile: prof.Profile,
    dst: Path,
    subs_ass: Path | None,
    over_ass: Path | None,
    fit: str,
    bias: float,
    outro: Path | None = None,
    preset: str = "medium",
    grade: str = "none",
) -> Path:
    """Renderiza el perfil en **una sola pasada de codificación**.

    Los .ass se queman después del escalado, así el tamaño de fuente es
    correcto en cada aspect ratio. Si hay outro se concatena ya a la resolución
    del perfil, para que el logo no se recorte al pasar de 9:16 a 4:5.
    """
    chain = [profile.video_filter(fit=fit, bias=bias)]
    # el grade va antes de los textos: los subtítulos no deben teñirse
    if GRADES.get(grade):
        chain.append(GRADES[grade])
    for a in (subs_ass, over_ass):
        if a:
            chain.append(_ass_arg(a))
    body_vf = ",".join(chain)

    enc = [
        "-c:v", "libx264", "-preset", preset, "-crf", str(profile.crf),
        "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
        "-c:a", "aac", "-b:a", profile.audio_bitrate, "-ar", "48000",
        "-movflags", "+faststart",
    ]

    if not outro:
        run(["ffmpeg", "-y", "-i", str(src), "-vf", body_vf, *enc, str(dst)])
        return dst

    fc = (
        f"[0:v]{body_vf},setsar=1[v0];"
        f"[1:v]{profile.video_filter(fit='crop')},setsar=1[v1];"
        "[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];"
        "[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a1];"
        "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]"
    )
    run([
        "ffmpeg", "-y", "-i", str(src), "-i", str(outro),
        "-filter_complex", fc, "-map", "[v]", "-map", "[a]", *enc, str(dst),
    ])
    return dst


# --------------------------------------------------------------------------- #

def main() -> None:
    need("ffmpeg")
    need("ffprobe")

    p = argparse.ArgumentParser(
        description="Post-producción de shorts de Smashly a partir de clips de Google Flow.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--clips", nargs="+", required=True, type=Path,
                   help="Clips en orden, o el MP4 de la escena de Scenebuilder")
    p.add_argument("--out", required=True, type=Path,
                   help="Directorio de salida (se crea)")
    p.add_argument("--vo", type=Path, help="Locución (mp3/wav). Sin esto se usa el audio nativo")
    p.add_argument("--profiles", nargs="+", default=["vertical"],
                   help="Perfiles o bundles. Por defecto: vertical")

    p.add_argument("--crop-watermark", type=int, default=0, metavar="PX",
                   help="Píxeles a recortar por abajo antes de todo (watermark de Flow)")
    p.add_argument("--fit", choices=["crop", "pad"], default="crop",
                   help="crop = cubre y recorta (por defecto) · pad = cabe y rellena")
    p.add_argument("--crop-bias", type=float, default=0.5, metavar="0..1",
                   help="Sesgo del recorte. 0.35 va mejor cuando hay caras")

    p.add_argument("--bed", type=float, default=0.20, metavar="0..1",
                   help="Volumen del audio nativo de Veo bajo el VO (0.20 por defecto)")
    p.add_argument("--no-duck", action="store_true",
                   help="Fondo a volumen fijo en vez de ducking dinámico")
    p.add_argument("--no-normalize", action="store_true", help="Salta el loudnorm")

    p.add_argument("--no-subs", action="store_true", help="Sin subtítulos")
    p.add_argument("--words-json", type=Path,
                   help="Palabras ya cronometradas: [{text,start,end},...]")
    p.add_argument("--whisper-model", default="small",
                   help="Modelo de faster-whisper: tiny|base|small|medium|large-v3")
    p.add_argument("--lang", default="es")
    p.add_argument("--words-per-line", type=int, default=4,
                   help="Máximo de palabras por línea")
    p.add_argument("--chars-per-line", type=int, default=18,
                   help="Máximo de caracteres por línea. Es lo que evita desbordes")
    p.add_argument("--sub-lines", type=int, default=2,
                   help="Líneas simultáneas en pantalla (2 es lo recomendado)")
    p.add_argument("--font", default="DejaVu Sans",
                   help="Fuente de los subtítulos. Instala Satoshi para usar la de marca")
    p.add_argument("--sub-margin", type=float, default=0.20, metavar="FRAC",
                   help="Fracción inferior del alto que queda libre (UI y watermark)")
    p.add_argument("--grade", default="none", choices=list(GRADES),
                   help="Grade unificado para todos los beats. 'brand' = atardecer cálido")
    p.add_argument("--screen-insert", type=Path, metavar="JSON",
                   help="Pega capturas reales en la pantalla de un móvil que sale en un clip")
    p.add_argument("--dump-grid", type=Path, metavar="DIR",
                   help="Escribe un frame de cada clip con rejilla de coordenadas y sale. "
                        "Sirve para medir el rectángulo de --screen-insert")
    p.add_argument("--overlays", type=Path,
                   help="JSON de textos en pantalla: [{text,start,end,style,pos},...]")
    p.add_argument("--outro-dir", type=Path,
                   help="Directorio con outro_WxH.mp4 por perfil (ver make_outro.py)")
    p.add_argument("--preset", default="medium",
                   help="Preset de x264. 'veryfast' para revisar, 'slow' para el final")
    p.add_argument("--keep-temp", action="store_true")

    a = p.parse_args()

    for c in a.clips:
        if not c.exists():
            sys.exit(f"No existe: {c}")
    if a.vo and not a.vo.exists():
        sys.exit(f"No existe el VO: {a.vo}")

    if a.dump_grid:
        print(f"Frames de referencia con rejilla en {a.dump_grid}…")
        dump_grid(a.clips, a.dump_grid)
        return

    repo_root = Path(__file__).resolve().parents[2]
    inserts = load_inserts(a.screen_insert, repo_root) if a.screen_insert else []

    targets = prof.resolve(a.profiles)
    a.out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="smashly-post-"))

    try:
        print(f"1. Concatenando {len(a.clips)} clip(s) a {WORK_W}x{WORK_H}@{WORK_FPS}…")
        if inserts:
            print(f"   {len(inserts)} insert(s) de pantalla")
        master = concat(a.clips, tmp / "concat.mp4",
                        crop_bottom=a.crop_watermark, inserts=inserts)

        if a.vo:
            mode = "volumen fijo" if a.no_duck else "ducking dinámico"
            print(f"2. Mezclando VO (fondo Veo al {a.bed:.0%}, {mode})…")
            master = mix_vo(master, a.vo, tmp / "mixed.mp4",
                            bed=a.bed, duck=not a.no_duck)
        else:
            print("2. Sin VO: se conserva el audio nativo de Veo")

        if not a.no_normalize:
            print(f"3. Normalizando a {LUFS_TARGET} LUFS / TP {TRUE_PEAK} dBTP…")
            master = normalize_loudness(master, tmp / "loud.mp4")

        words: list[captions.Word] = []
        if not a.no_subs:
            if a.words_json:
                print("4. Cargando timings de palabras…")
                words = captions.load_words(a.words_json)
            else:
                audio_src = a.vo if a.vo else master
                print(f"4. Transcribiendo ({a.whisper_model}, {a.lang})…")
                words = captions.transcribe(audio_src, language=a.lang,
                                            model=a.whisper_model)
            words = captions.apply_corrections(words, captions.DEFAULT_CORRECTIONS)
            print(f"   {len(words)} palabras")
            # revisa esto contra tu guion antes de publicar: el ASR confunde
            # sonidos parecidos y el vocabulario de pádel no es fácil
            (a.out / "transcripcion.txt").write_text(
                " ".join(w.text for w in words), encoding="utf-8"
            )

        over_items: list[dict] = []
        if a.overlays:
            over_items = ov.load(a.overlays)
            print(f"   {len(over_items)} overlay(s) de texto en pantalla")

        dur = duration_of(master)
        print(f"5. Exportando {len(targets)} perfil(es) · {dur:.1f}s")
        results: list[tuple[str, Path, float]] = []
        for t in targets:
            subs_ass = None
            if words:
                subs_ass = captions.write_ass(
                    tmp / f"{t.name}.subs.ass",
                    words=words, width=t.width, height=t.height,
                    words_per_line=a.words_per_line,
                    max_chars_per_line=a.chars_per_line,
                    lines=a.sub_lines,
                    font=a.font, margin_frac=a.sub_margin,
                )
            over_ass = None
            if over_items:
                over_ass = ov.write_ass(
                    tmp / f"{t.name}.over.ass",
                    items=over_items, width=t.width, height=t.height,
                    font=a.font,
                )

            outro = None
            if a.outro_dir:
                cand = a.outro_dir / f"outro_{t.width}x{t.height}.mp4"
                if cand.exists():
                    outro = cand
                else:
                    print(f"   ⚠  sin outro para {t.width}x{t.height}, se omite")

            dst = a.out / f"{t.name}_{t.width}x{t.height}.mp4"
            print(f"   → {dst.name} ({t.aspect})")
            export(master, t, dst, subs_ass, over_ass, a.fit, a.crop_bias,
                   outro, preset=a.preset, grade=a.grade)
            mb = dst.stat().st_size / 1_048_576
            results.append((t.name, dst, mb))
            for warn in t.check(duration_of(dst), mb):
                print(f"   ⚠  {warn}")

        print(f"\nListo en {a.out}")
        for name, path, mb in results:
            print(f"  {name:<10} {mb:6.1f} MB  {path.name}")
        if words:
            print("\nRevisa transcripcion.txt contra tu guion antes de publicar.")
    finally:
        if a.keep_temp:
            print(f"\nTemporales en {tmp}")
        else:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
