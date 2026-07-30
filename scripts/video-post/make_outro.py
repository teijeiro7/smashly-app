#!/usr/bin/env python3
"""Genera la tarjeta de cierre de marca, una vez y para todos los vídeos.

Gradiente del hero de Smashly (#0f2818 → #16a34a) + logo + URL, con el logo
entrando con un pequeño asentamiento y un chime opcional.

    python make_outro.py --profiles vertical --out ../../assets/video/outro

Luego se pasa a postprod.py con --outro assets/video/outro/outro_1080x1920.mp4
(o se deja que postprod lo busque por nombre de perfil en --outro-dir).
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import profiles as prof  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
DEFAULT_LOGO = REPO / "public/images/icons/smashly-large-icon.png"

# Gradiente del hero, literal de frontend/src/pages/HomePage.tsx:
#   linear-gradient(145deg, #0f2818 0%, #0f6e38 30%, #16a34a 60%, #15803d 100%)
HERO_ANGLE_DEG = 145
HERO_STOPS: list[tuple[float, tuple[int, int, int]]] = [
    (0.00, (0x0F, 0x28, 0x18)),
    (0.30, (0x0F, 0x6E, 0x38)),
    (0.60, (0x16, 0xA3, 0x4A)),
    (1.00, (0x15, 0x80, 0x3D)),
]


def hero_background(width: int, height: int, dst: Path, grain: float = 0.03) -> Path:
    """Renderiza el gradiente del hero como PNG estático.

    El filtro `gradients` de ffmpeg solo hace dos paradas y además rota con el
    tiempo, así que no reproduce el gradiente de la marca. Con Pillow sale
    exacto: 4 paradas a 145 grados, más el grano al 3% que lleva toda la app.
    """
    import math
    import random

    from PIL import Image

    # Vector de dirección de un linear-gradient CSS: 0deg apunta hacia arriba
    # y el ángulo crece en sentido horario.
    rad = math.radians(HERO_ANGLE_DEG)
    dx, dy = math.sin(rad), -math.cos(rad)
    # Longitud de proyección para que las paradas 0 y 1 caigan en las esquinas
    proj = abs(width * dx) + abs(height * dy)
    ox = (width - width * dx) / 2 if dx >= 0 else (width + width * dx) / 2
    _ = ox  # el offset se resuelve normalizando abajo

    img = Image.new("RGB", (width, height))
    px = img.load()

    # Precalcula una LUT de 1024 pasos: evita interpolar por píxel
    lut: list[tuple[int, int, int]] = []
    for i in range(1024):
        t = i / 1023
        for j in range(len(HERO_STOPS) - 1):
            p0, c0 = HERO_STOPS[j]
            p1, c1 = HERO_STOPS[j + 1]
            if p0 <= t <= p1:
                k = 0.0 if p1 == p0 else (t - p0) / (p1 - p0)
                lut.append(
                    tuple(round(c0[n] + (c1[n] - c0[n]) * k) for n in range(3))
                )
                break
        else:
            lut.append(HERO_STOPS[-1][1])

    cx, cy = width / 2, height / 2
    for y in range(height):
        for x in range(width):
            # proyección centrada y normalizada a 0..1
            d = ((x - cx) * dx + (y - cy) * dy) / proj + 0.5
            px[x, y] = lut[min(1023, max(0, int(d * 1023)))]

    if grain > 0:
        rnd = random.Random(7)  # fijo: el grano no debe cambiar entre renders
        amp = int(255 * grain)
        for y in range(height):
            for x in range(width):
                n = rnd.randint(-amp, amp)
                r, g, b = px[x, y]
                px[x, y] = (
                    min(255, max(0, r + n)),
                    min(255, max(0, g + n)),
                    min(255, max(0, b + n)),
                )

    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst)
    return dst

ASS_TPL = """[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: url,{font},{fs},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,{sp},0,1,0,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.35,0:00:09.00,url,,0,0,0,,{{\\fad(250,150)\\pos({cx},{uy})}}{url}
"""


def run(cmd: list[str]) -> None:
    res = subprocess.run(cmd, check=False, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        sys.exit(f"\nFalló: {' '.join(cmd[:6])} …\n{(res.stderr or '')[-2000:]}")


def build(
    profile: prof.Profile,
    logo: Path,
    dst: Path,
    *,
    seconds: float,
    url: str,
    font: str,
    chime: Path | None,
) -> Path:
    w, h = profile.width, profile.height
    logo_w = int(w * 0.62)
    # el logo va algo por encima del centro; la URL debajo
    logo_y = f"(H-h)/2-{int(h * 0.045)}"
    url_y = int(h / 2 + h * 0.075)
    fontsize = max(int(h * 0.028), 14)
    spacing = max(int(fontsize * 0.06), 1)

    ass = dst.with_suffix(".ass")
    ass.write_text(
        ASS_TPL.format(
            w=w, h=h, font=font, fs=fontsize, sp=spacing,
            cx=w // 2, uy=url_y, url=url,
        ),
        encoding="utf-8",
    )
    ass_path = str(ass).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")

    bg = hero_background(w, h, dst.with_name(dst.stem + "_bg.png"))

    # el logo hace un asentamiento sutil: entra al 94% y llega al 100% en 0.5s
    fc = (
        f"[1:v]format=rgba,"
        f"scale='if(lt(t,0.5),{logo_w}*(0.94+0.06*t/0.5),{logo_w})':-1:eval=frame,"
        f"format=rgba[lg];"
        f"[0:v][lg]overlay=x=(W-w)/2:y={logo_y}:eval=frame:format=auto[withlogo];"
        f"[withlogo]ass='{ass_path}',fps={profile.fps},format=yuv420p[v]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-t", str(seconds), "-i", str(bg),
        "-loop", "1", "-t", str(seconds), "-i", str(logo),
    ]
    maps = ["-map", "[v]"]
    if chime and chime.exists():
        cmd += ["-i", str(chime)]
        maps += ["-map", "2:a", "-c:a", "aac", "-b:a", profile.audio_bitrate]
    else:
        cmd += ["-f", "lavfi", "-t", str(seconds),
                "-i", "anullsrc=r=48000:cl=stereo"]
        maps += ["-map", "2:a", "-c:a", "aac", "-b:a", "128k"]

    cmd += [
        "-filter_complex", fc, *maps,
        "-t", str(seconds),
        "-c:v", "libx264", "-preset", "slow", "-crf", str(profile.crf),
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(dst),
    ]
    run(cmd)
    ass.unlink(missing_ok=True)
    bg.unlink(missing_ok=True)
    return dst


def main() -> None:
    if not shutil.which("ffmpeg"):
        sys.exit("Falta ffmpeg en el PATH.")

    p = argparse.ArgumentParser(description="Tarjeta de cierre de marca Smashly.")
    p.add_argument("--out", type=Path, default=REPO / "out/outro")
    p.add_argument("--logo", type=Path, default=DEFAULT_LOGO)
    p.add_argument("--profiles", nargs="+", default=["social"])
    p.add_argument("--seconds", type=float, default=1.6)
    p.add_argument("--url", default="smashly-app.es")
    p.add_argument("--font", default="DejaVu Sans",
                   help="En macOS prueba 'Helvetica Neue' o instala Satoshi")
    p.add_argument("--chime", type=Path, help="Audio corto de cierre (opcional)")
    a = p.parse_args()

    if not a.logo.exists():
        sys.exit(f"No existe el logo: {a.logo}")
    a.out.mkdir(parents=True, exist_ok=True)

    for t in prof.resolve(a.profiles):
        dst = a.out / f"outro_{t.width}x{t.height}.mp4"
        print(f"→ {dst.name} ({t.aspect})")
        build(t, a.logo, dst, seconds=a.seconds, url=a.url,
              font=a.font, chime=a.chime)

    print(f"\nListo en {a.out}")


if __name__ == "__main__":
    main()
