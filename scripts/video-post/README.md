# video-post · post-producción de shorts de Smashly

Coge los clips que salen de **Google Flow** y hace en un comando todo lo que si no
habría que hacer a mano en CapCut.

```
clips de Flow  →  concat  →  crop watermark  →  mezcla VO + audio nativo
               →  loudnorm EBU R128  →  subtítulos word-level  →  export por plataforma
```

## Por qué existe

Flow genera los clips, pero no hace subtítulos, no normaliza audio y no exporta por
plataforma. Eso son ~30 minutos de CapCut por vídeo, y es la parte mecánica. Esto lo
reduce a un comando.

Los patrones de audio y de perfiles de plataforma están inspirados en
[OpenMontage](https://github.com/calesthio/OpenMontage) (AGPL-3.0), pero esto es una
implementación propia e independiente: ~450 líneas, sin dependencias experimentales y sin
las implicaciones de licencia de vendorizar el framework. Ver el análisis de por qué no
adoptamos OpenMontage entero en `docs/video-ai/README.md`.

## Requisitos

```bash
# obligatorio
ffmpeg -version   # y ffprobe

# opcional: subtítulos automáticos
pip install faster-whisper
```

Sin `faster-whisper` funciona todo menos la transcripción automática: pasa los tiempos
con `--words-json` o usa `--no-subs`.

## Uso

Para un vídeo concreto hay un `build.sh` que ya lleva todos los parámetros:
`docs/video-ai/produccion/video-01/build.sh`. Lo de abajo es la interfaz cruda.

```bash
cd scripts/video-post

# Vídeo completo: beats de Flow + VO + overlays + tarjeta de cierre
python make_outro.py --profiles social            # una sola vez
python postprod.py \
  --clips beat1.mp4 beat2.mp4 beat3.mp4 \
  --vo vo.mp3 \
  --overlays overlays.json \
  --outro-dir ../../out/outro \
  --crop-watermark 40 --crop-bias 0.35 \
  --profiles vertical ig_4x5 \
  --out ../../out/video-01

# Un montaje ya hecho en Scenebuilder, y también la variante 4:5 del feed
python postprod.py --clips escena.mp4 --vo vo.mp3 --profiles vertical ig_4x5 --out ../../out/v1

# Revisar el corte antes de locutar: sin VO ni subtítulos
python postprod.py --clips beat*.mp4 --no-subs --profiles reels --out /tmp/rough
```

### Perfiles y bundles

| Perfil | Resolución | AR | Límites |
|---|---|---|---|
| `tiktok` | 1080×1920 | 9:16 | 600 s · 287 MB |
| `reels` | 1080×1920 | 9:16 | 90 s · 250 MB |
| `shorts` | 1080×1920 | 9:16 | 180 s |
| `ig_4x5` | 1080×1350 | 4:5 | 60 s · 250 MB |
| `ig_feed` | 1080×1080 | 1:1 | 60 s · 250 MB |
| `youtube` | 1920×1080 | 16:9 | — |
| `linkedin` | 1920×1080 | 16:9 | 600 s · 5120 MB |
| `x` | 1920×1080 | 16:9 | 140 s · 512 MB |

Bundles: `vertical` (tiktok+reels+shorts) · `social` (+ig_4x5+ig_feed) · `all`.
Si el render supera un límite, avisa por consola en vez de dejarte descubrirlo al subir.

### Flags que importan

| Flag | Para qué |
|---|---|
| `--crop-watermark PX` | Recorta N px por abajo antes de todo. Para el watermark "made with Veo" del plan Pro. Empieza por 40 y ajusta mirando un frame |
| `--fit crop\|pad` | `crop` cubre y recorta (por defecto, sin deformar) · `pad` cabe y rellena con negro |
| `--crop-bias 0..1` | Sesgo del recorte. **Usa 0.35 cuando hay caras** — 0.5 les corta la frente al pasar 9:16 a 4:5 |
| `--bed 0..1` | Volumen del audio nativo de Veo bajo el VO. 0.20 por defecto |
| `--no-duck` | Fondo a volumen fijo en vez de ducking dinámico |
| `--chars-per-line` | Máximo de caracteres por línea (18). Es lo que evita que el subtítulo desborde |
| `--crop-bias`, `--sub-margin` | `--sub-margin 0.20` deja libre el 20% inferior: UI de plataforma y watermark |
| `--font` | Instala Satoshi en el sistema y pasa `--font Satoshi` para la tipografía de marca |
| `--words-json` | Tiempos ya hechos: `[{"text","start","end"}, ...]`. Salta Whisper |
| `--keep-temp` | Deja los intermedios para depurar |

## Detalles de implementación

**Audio nativo, no silenciado.** El audio que genera Veo (impactos de bola, chirrido de
zapatillas, reverb de pista) es lo que hace que el vídeo suene a pádel real. Se baja al
20% bajo tu voz, no se elimina. Con ducking dinámico (`sidechaincompress`) el fondo solo
baja cuando hablas.

**Loudness en dos pasadas.** Primero mide con `loudnorm ... print_format=json`, luego
aplica con los valores medidos y `linear=true`. Objetivo **-16 LUFS / TP -1.5 dBTP /
LRA 11**, que es el estándar de web y social. Una sola pasada da resultados peores; el
script cae a ese modo solo si la medición falla.

**Subtítulos que no desbordan.** El agrupado es por **presupuesto de caracteres**, no
por número de palabras — en español las palabras largas ("trescientos", "equivocada")
revientan un layout de 4 palabras por línea. Además el cuerpo de letra se **reduce
automáticamente** si la línea más ancha no cabe. Palabra activa en ámbar `#d97706`, resto
en blanco con contorno negro, máximo 2 líneas.

**Escalado sin deformar.** `scale=...:force_original_aspect_ratio=increase` seguido de
`crop`, no un `scale=W:H` a pelo. El `.ass` se genera con el `PlayRes` de cada perfil y se
quema **después** del escalado, así el tamaño de letra es correcto en 9:16 y en 4:5.

**Clips mudos.** Si un beat viene sin pista de audio, se le inyecta silencio de su misma
duración para que el concat no se desincronice.

## Verificar el resultado

El script deja `transcripcion.txt` en el directorio de salida. **Léelo contra tu guion
antes de publicar**: el ASR confunde sonidos parecidos y el vocabulario de pádel no es
fácil. Hay correcciones automáticas en `captions.DEFAULT_CORRECTIONS` (Smashly, pádel,
bandeja, víbora); añade las que te encuentres.

Extraer un frame para comprobar encuadre y subtítulos:

```bash
ffmpeg -ss 1.5 -i out/reels_1080x1920.mp4 -frames:v 1 check.png
```

## Ficheros

- `postprod.py` — CLI y orquestación
- `captions.py` — transcripción word-level y generación del `.ass`
- `profiles.py` — perfiles de plataforma, bundles y filtros de escalado
