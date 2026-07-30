#!/usr/bin/env bash
# Monta el vídeo 1 completo a partir de los clips de Flow.
#
# Antes de ejecutar, deja en este directorio:
#   beat1.mp4  beat2.mp4  beat3.mp4   ← descargados de Flow
#   vo.mp3                            ← locución de ElevenLabs (texto en vo.txt)
#
# Uso:
#   ./build.sh grid     # frames con rejilla, para medir el rectángulo del móvil
#   ./build.sh rough    # rápido, un solo formato, para revisar
#   ./build.sh          # los 4 formatos, calidad final

set -euo pipefail
cd "$(dirname "$0")"

REPO="$(cd ../../../.. && pwd)"
POST="$REPO/scripts/video-post"
OUTRO="$REPO/out/outro"
OUT="$REPO/out/video-01"

MODE="${1:-final}"

for f in beat1.mp4 beat2.mp4 beat3.mp4; do
  [ -f "$f" ] || { echo "Falta $f en $(pwd)"; exit 1; }
done

# Paso previo: medir dónde está la pantalla del móvil en el beat 3
if [ "$MODE" = "grid" ]; then
  python3 "$POST/postprod.py" \
    --clips beat1.mp4 beat2.mp4 beat3.mp4 \
    --profiles reels --out /tmp/ignore \
    --dump-grid "$OUT/grid"
  echo
  echo "Abre $OUT/grid/grid_clip3.png, mide el rectángulo de la pantalla"
  echo "del móvil y escribe x/y/w/h en screen.json."
  exit 0
fi

[ -f vo.mp3 ] || { echo "Falta vo.mp3 (locuta el texto de vo.txt)"; exit 1; }

if [ "$MODE" = "rough" ]; then
  PRESET=veryfast
  PROFILES=(reels)
else
  PRESET=slow
  PROFILES=(vertical ig_4x5)
fi

# La tarjeta de cierre se genera una vez y se reutiliza
if [ ! -f "$OUTRO/outro_1080x1920.mp4" ]; then
  echo "Generando la tarjeta de cierre…"
  python3 "$POST/make_outro.py" --out "$OUTRO" --profiles social
fi

python3 "$POST/postprod.py" \
  --clips beat1.mp4 beat2.mp4 beat3.mp4 \
  --vo vo.mp3 \
  --overlays overlays.json \
  --screen-insert screen.json \
  --outro-dir "$OUTRO" \
  --grade brand \
  --crop-watermark 40 \
  --crop-bias 0.35 \
  --preset "$PRESET" \
  --profiles "${PROFILES[@]}" \
  --out "$OUT"

echo
echo "Revisa antes de publicar:"
echo "  1. $OUT/transcripcion.txt contra vo.txt"
echo "  2. que la UI encaje en la pantalla del móvil:"
echo "     ffmpeg -ss 19 -i $OUT/reels_1080x1920.mp4 -frames:v 1 /tmp/check.png"
echo "  3. que el recorte de watermark (40px) sea el correcto"
