# Referencia técnica — Veo 3.1 (generación de vídeo con IA)

Fuentes oficiales:
- `https://ai.google.dev/gemini-api/docs/video` — Gemini API, generación de vídeo con Veo 3.1
- `https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide` — Anatomy of a prompt
- `https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice` — Best practices

---

## 0. Nomenclatura: Veo vs "Gemini Omni"

**El modelo que genera vídeo es Veo 3.1.** No existe un modelo de vídeo llamado "Omni".

"**Gemini Omni**" (y "Gemini Omni Flash") es el modelo multimodal de Google que la propia doc de best
practices recomienda usar **junto a** Veo, en dos roles:

1. **Enriquecer el prompt.** Plantilla literal de la doc:
   > `Act as an expert prompter for a generative AI video generation model. Look at this image, and write a prompt that INSTRUCTION. Ensure your prompt is comprehensive and detailed.`
2. **Revisar el output** como "second pair of eyes" contra las brand guidelines.

Para generar imágenes de partida (image-to-video) la doc usa **Nano Banana 2** =
`gemini-3.1-flash-image-preview`, con `config={"response_modalities": ["IMAGE"]}`.

---

## 1. Modelos, IDs y diferencias

- ID confirmado en todos los ejemplos: **`veo-3.1-generate-preview`**
- Base URL REST: `https://generativelanguage.googleapis.com/v1beta`
- Endpoint: `POST /models/veo-3.1-generate-preview:predictLongRunning`

Descripción oficial de Veo 3.1:
> "Google's state-of-the-art model for generating high-fidelity, 8-second 720p, 1080p or 4k videos featuring stunning realism and natively generated audio."

Novedades de Veo 3.1: vídeo vertical 9:16, extensión de vídeo, generación por primer + último frame,
y hasta 3 imágenes de referencia.

### Tabla de features (verbatim)

| Feature | Veo 3.1 & Fast | Veo 3.1 Lite | Veo 3 & Fast | Veo 2 |
|---|---|---|---|---|
| Audio nativo | ✔️ Always on | ✔️ Always on | ✔️ Always on | ❌ Silent only |
| Modalidades de entrada | Text→Video, Image→Video, Video→Video | Text→Video, Image→Video | Text→Video, Image→Video | Text→Video, Image→Video |
| Resolución | 720p, 1080p (solo 8s), 4k (solo 8s); 720p only al extender | 720p, 1080p (solo 8s) | 720p, 1080p (solo 16:9) | 720p |
| Frame rate | 24fps | 24fps | 24fps | 24fps |
| Duración | 8s, 6s, 4s (8s obligatorio si 1080p/4k o reference images) | 8s, 6s, 4s | 8s | 5–8s |
| Vídeos por request | 1 | 1 | 1 | 1 o 2 |
| Estado | Preview | Preview | Stable | Stable |

Otras notas oficiales:
- Latencia: **mín. 11 s, máx. 6 min** en horas punta. Más resolución = más latencia. 4k es más caro.
- **Retención: 2 días.** Descarga el .mp4 dentro de la ventana. Los vídeos extendidos cuentan como nuevos.
- **Watermark SynthID** en todos los vídeos, verificable en la plataforma de SynthID.
- Si el filtro de seguridad bloquea el vídeo por el audio, **no se cobra**.
- No hay límite de caracteres de prompt documentado en la Gemini API (`prompt: string`).

---

## 2. Anatomía del prompt (elementos oficiales)

Orden documentado: **Subject → Action → Scene/context → Camera angles → Camera movements →
Lens & optical effects → Visual style (Lighting, Tone/mood, Artistic style, Ambiance) →
Temporal elements → Audio → Cinematic terms → Negative prompts.**

> "You don't need to use all elements in every prompt."

La versión corta de ai.google.dev lista 7 campos: **Subject, Action, Style** (obligatorios) +
**Camera positioning and motion, Composition, Focus and lens effects, Ambiance** (opcionales).

Ejemplo anotado por Google:
> `Close up shot (composition) of melting icicles (subject) on a frozen rock wall (context) with cool blue tones (ambiance), zoomed in (camera motion) maintaining close-up detail of water drips (action).`

---

## 3. Taxonomía completa

### Subject
- Personas: descriptores genéricos (`man`, `woman`, `elderly person`); profesiones específicas
  (`a seasoned detective`, `a joyful baker`, `a futuristic astronaut`); figuras históricas;
  seres míticos (`a mischievous fairy`, `a stoic knight`).
- Animales/criaturas: `a playful Golden Retriever puppy`, `a majestic bald eagle`, `a sleek black panther`;
  fantásticos: `a miniature dragon with iridescent scales`, `a wise, ancient talking tree`.
- Objetos: cotidianos (`a vintage typewriter`, `a steaming cup of coffee`, `a worn leather-bound book`);
  vehículos (`a classic 1960s muscle car`, `a futuristic hovercraft`, `a weathered pirate ship`);
  formas abstractas (`glowing orbs`, `crystalline structures`).

### Action
- Movimientos básicos: `walking`, `running`, `jumping`, `flying`, `swimming`, `dancing`, `spinning`, `falling`, `standing still`, `sitting`
- Interacciones: `talking`, `laughing`, `arguing`, `hugging`, `fighting`, `playing a game`, `cooking`, `building`, `writing`, `reading`, `observing`
- Expresiones emocionales: `smiling`, `frowning`, `surprise`, `concentrating deeply`, `appearing thoughtful`, `showing excitement`, `crying`
- Acciones sutiles: `a gentle breeze ruffling hair`, `leaves rustling`, `a subtle nod`, `fingers tapping impatiently`, `eyes blinking slowly`
- Transformaciones: `a flower blooming in fast-motion`, `ice melting`, `a city skyline developing over time`

### Scene / context
- Interior: `a cozy living room with a crackling fireplace`, `a sterile futuristic laboratory`, `a cluttered artist's studio`, `a grand ballroom`, `a dusty attic`
- Exterior: `a sun-drenched tropical beach`, `a misty ancient forest`, `a bustling futuristic cityscape at night`, `a serene mountain peak at dawn`, `a desolate alien planet`
- Hora del día: `golden hour`, `midday sun`, `twilight`, `deep night`, `pre-dawn`
- Clima: `clear blue sky`, `overcast and gloomy`, `light drizzle`, `heavy thunderstorm with visible lightning`, `gentle snowfall`, `swirling fog`
- Periodo: `a medieval castle courtyard`, `a roaring 1920s jazz club`, `a cyberpunk alleyway`, `an enchanted forest glade`
- Detalles atmosféricos: `floating dust motes in a sunbeam`, `shimmering heat haze`, `reflections on wet pavement`, `leaves scattered by the wind`

### Camera angles
> Aviso oficial: "Some advanced camera angles are not officially supported. The results and reliability may vary."

| Ángulo | Efecto | Ejemplo oficial |
|---|---|---|
| `eye-level shot` | perspectiva neutra, altura humana | eye-level shot of a woman sipping tea |
| `low-angle shot` | sujeto poderoso, imponente | low-angle tracking shot of a superhero landing |
| `high-angle shot` | sujeto pequeño, vulnerable | high-angle shot of a child lost in a crowd |
| `bird's-eye view` / `top-down shot` | perspectiva de mapa | bird's-eye view of a bustling city intersection |
| `worm's-eye view` | enfatiza altura y grandeza | worm's-eye view of towering skyscrapers |
| `dutch angle` / `canted angle` | inquietud, desorientación, dinamismo | dutch angle shot of a character running down a hallway |
| `close-up` | emoción o detalle | close-up of a character's determined eyes |
| `extreme close-up` | aísla un detalle mínimo | extreme close-up of a drop of water landing on a leaf |
| `medium shot` | de cintura arriba, diálogo | medium shot of two people conversing |
| `full shot` / `long shot` | cuerpo entero + algo de entorno | full shot of a dancer performing |
| `wide shot` / `establishing shot` | sujeto en su entorno, establece localización | wide shot of a lone cabin in a snowy landscape |
| `over-the-shoulder shot` | desde detrás de un personaje | over-the-shoulder shot during a tense negotiation |
| `point-of-view shot` (POV) | perspectiva visual directa del personaje | POV shot as someone rides a rollercoaster |

### Camera movements

| Movimiento | Descripción | Ejemplo oficial |
|---|---|---|
| `static shot` (fixed) | cámara inmóvil | static shot of a serene landscape |
| `pan left/right` | rota horizontalmente desde posición fija | slow pan left across a city skyline at dusk |
| `tilt up/down` | rota verticalmente desde posición fija | tilt down from the character's shocked face to the revealing letter |
| `dolly in/out` | la cámara se acerca/aleja físicamente | dolly out from the character to emphasize their isolation |
| `truck left/right` | se desplaza lateralmente, paralela al sujeto | truck right, following a character along a busy sidewalk |
| `pedestal up/down` | sube/baja manteniendo perspectiva nivelada | pedestal up to reveal the full height of an ancient tree |
| `zoom in/out` | cambia la focal; la cámara **no** se mueve | slow zoom in on a mysterious artifact on a table |
| `crane shot` | vertical o arcos amplios; revelaciones dramáticas | crane shot revealing a vast medieval battlefield |
| `aerial shot` / `drone shot` | gran altitud, vuelo suave | sweeping aerial drone shot flying over a tropical island chain |
| `handheld` / `shaky cam` | realismo, inmediatez, desasosiego | handheld camera shot during a chaotic marketplace chase |
| `whip pan` | pan ultrarrápido que difumina; transición | whip pan from one arguing character to another |
| `arc shot` | trayectoria circular alrededor del sujeto | arc shot around a couple embracing in the rain |

### Lens & optical effects
> Aviso oficial: "Some advanced camera lenses are not officially supported."

- `wide-angle lens` — campo amplio, exagera perspectiva, escala grandiosa o distorsión en corto
- `telephoto lens` — comprime perspectiva, acerca lo lejano, aísla con poca profundidad de campo
- `shallow depth of field` — plano estrecho enfocado, desenfoque tipo `bokeh`
- `deep depth of field` — todo enfocado de primer plano a fondo
- `lens flare` — destellos, estrellas, círculos por luz directa
- `rack focus` — cambio de foco entre planos en la misma toma
- `fisheye lens effect` — ultra-gran angular con distorsión de barril extrema
- `vertigo effect (dolly zoom)` — dolly y zoom opuestos; el sujeto mantiene tamaño, el fondo se desplaza

### Lighting
- Natural: `soft morning sunlight streaming through a window`, `overcast daylight`, `moonlight`
- Artificial: `warm glow of a fireplace`, `flickering candlelight`, `harsh fluorescent office lighting`, `pulsating neon signs`
- Cinematográfica: `rembrandt lighting on a portrait`, `film noir style with deep shadows and stark highlights`, `high-key lighting for a bright, cheerful scene`, `low-key lighting for a dark, mysterious mood`
- Efectos: `volumetric lighting creating visible light rays`, `backlighting to create a silhouette`, `golden hour glow`, `dramatic side lighting`

### Tone / mood
`happy/joyful` (bright, vibrant, cheerful, uplifting, whimsical) · `sad/melancholy` (somber, muted colors, slow pace, poignant, wistful) · `suspenseful/tense` (dark, shadowy, unease, thrilling) · `peaceful/serene` (calm, tranquil, soft, gentle, meditative) · `epic/grandiose` (sweeping, majestic, dramatic, awe-inspiring) · `futuristic/sci-fi` (sleek, metallic, neon, technological) · `vintage/retro` (sepia tone, grainy film, 1950s Americana, 1980s vaporwave) · `romantic` (soft focus, warm colors, intimate) · `horror` (dark, unsettling, eerie)

### Artistic style
- Fotorrealista: `ultra-realistic rendering`, `shot on 8K camera`
- Cinematográfico: `cinematic film look`, `shot on 35mm film`, `anamorphic widescreen`
- Animación: `Japanese anime style`, `classic Disney animation style`, `Pixar-like 3D animation`, `claymation style`, `stop-motion animation`, `cel-shaded animation`
- Movimientos/artistas: `in the style of Van Gogh`, `surrealist painting`, `Impressionistic`, `Art Deco design`, `Bauhaus aesthetic`
- Looks específicos: `gritty graphic novel illustration`, `watercolor painting coming to life`, `charcoal sketch animation`, `blueprint schematic style`

### Ambiance
- Paletas: `monochromatic black and white`, `vibrant and saturated tropical colors`, `muted earthy tones`, `cool blue and silver futuristic palette`, `warm autumnal oranges and browns`
- Atmosféricos: `thick fog rolling across a moor`, `swirling desert sands`, `gentle falling snow`, `heat haze shimmering above asphalt`, `magical glowing particles in the air`, `subsurface scattering on a translucent object`
- Texturas: `rough-hewn stone walls`, `smooth, polished chrome surfaces`, `soft, velvety fabric`, `dewdrops clinging to a spiderweb`

### Temporal elements
- Ritmo: `slow-motion`, `fast-paced action`, `time-lapse`
- Evolución (sutil en clips cortos): `a flower bud slowly unfurling`, `a candle burning down slightly`, `dawn breaking, the sky gradually lightening`
- Cadencia: `pulsating light`, `rhythmic movement`

### Cinematic terms (edición)
`match cut`, `jump cut`, `establishing shot sequence`, `montage`, `split diopter effect`

---

## 4. Audio: sintaxis exacta

> "Clearly specify if you want audio. We recommend that you use separate sentences in your prompt to describe the audio."

- **Sound effects (SFX)**: descríbelos explícitamente. `tires screeching loudly, engine roaring`,
  `the sound of a phone ringing`, `water splashing in the background`
- **Ambient noise**: describe el paisaje sonoro. `A faint, eerie hum resonates in the background`,
  `the sounds of city traffic and distant sirens`, `the quiet hum of an office`
- **Dialogue**: dos sintaxis documentadas.

**Sintaxis A — recomendada por best practices (sin comillas, con dos puntos):**
```
A woman says: My name is Clara.
```
> Not recommended: `A woman says: "My name is Clara."`
> Recommended: `A woman says: My name is Clara.`

**Sintaxis B — estilo guion, usada en los ejemplos de la Gemini API:**
```
Man: (Hand on his hunting knife) "That's no ordinary bear."
Woman: (Voice tight with fear, scanning the woods) "Then what is it?"
```
Patrón: `Rol: (acotación de tono o acción) línea`.

Las dos aparecen en la documentación de Google. **Para Smashly usa la sintaxis A** (es la que la
página de best practices marca explícitamente como recomendada) y reserva la B si necesitas
acotaciones de tono muy concretas.

Nota: `voice is not able to be effectively extended if it's not present in the last 1 second of video`.

---

## 5. Negative prompts

- **Mal**: lenguaje instructivo o negaciones — `no walls`, `don't show walls`
- **Bien**: describe lo que no quieres ver — `wall, frame`
- Ejemplo oficial de negative prompt: `urban background, man-made structures, dark, stormy, or threatening atmosphere.`

---

## 6. Parámetros de la API

### `instances[0]`

| Campo | Tipo | Notas |
|---|---|---|
| `prompt` | `string` | Descripción textual. Soporta cues de audio. |
| `image` | `Image` | Imagen inicial a animar. |
| `lastFrame` | `Image` | Frame final para interpolación. **Requiere `image`.** |
| `referenceImages` | `VideoGenerationReferenceImage[]` | Hasta **3**. Solo Veo 3.1 / Fast. Único `referenceType` documentado: `"asset"`. |
| `video` | `Video` | Vídeo a extender (de una generación previa). Solo Veo 3.1 / Fast. |

### `parameters` (REST) / `config` (SDK)

| Campo | Valores |
|---|---|
| `aspectRatio` | `"16:9"` (default), `"9:16"` |
| `durationSeconds` | `"4"`, `"6"`, `"8"` — **debe ser `"8"`** con 1080p, 4k, `referenceImages` o extensión |
| `resolution` | `"720p"` (default), `"1080p"` (solo 8s), `"4k"` (solo 8s). Al extender: solo `"720p"` |
| `personGeneration` | Text→video: `"allow_all"`. Image→video / interpolación / referencias: `"allow_adult"`. **UE/UK/CH/MENA: solo `"allow_adult"`** |
| `numberOfVideos` | `1` en Veo 3.x |
| `seed` | Disponible. "It doesn't guarantee determinism, but slightly improves it." |

### Nombres por SDK

| Concepto | Python | JS | REST |
|---|---|---|---|
| aspect ratio | `aspect_ratio` | `aspectRatio` | `parameters.aspectRatio` |
| resolución | `resolution` | `resolution` | `parameters.resolution` |
| duración | `duration_seconds` | `durationSeconds` | `parameters.durationSeconds` |
| último frame | `last_frame` (en `config`) | `lastFrame` | `instances[0].lastFrame` |
| referencias | `reference_images` | `referenceImages` | `instances[0].referenceImages` |
| imagen inicial | `image=` (argumento primario, **no** en `config`) | `image` | `instances[0].image` |
| vídeo a extender | `video=` | `video` | `instances[0].video` |

### Referencias de asset (Python)
```python
racket_reference = types.VideoGenerationReferenceImage(
    image=racket_image,
    reference_type="asset",
)
```

### Interpolación primer + último frame (Python)
```python
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=first_image,                                  # frame inicial: argumento primario
    config=types.GenerateVideosConfig(last_frame=last_image),  # frame final: en config
)
```

### Operación asíncrona
La generación es long-running: la request devuelve un `operation` y hay que pollear `done`.
Los ejemplos oficiales usan intervalos de 10 s.

- REST: `POST …:predictLongRunning` → `GET /v1beta/{operation_name}` → `done` →
  `.response.generateVideoResponse.generatedSamples[0].video.uri` → descarga con header `x-goog-api-key` y `curl -L`
- Python: `client.operations.get(operation)` → `operation.response.generated_videos[0].video` →
  `client.files.download(file=…)` → `.save("out.mp4")`
- JS: `ai.operations.getVideosOperation({operation})` → `operation.response.generatedVideos[0].video`

---

## 7. Extensión de vídeo — límites exactos

> "Use Veo 3.1 to extend videos that you previously generated with Veo by **7 seconds and up to 20 times**."

- Solo vídeos generados por Veo, de una generación previa
- Entrada: aspect ratio 9:16 o 16:9, resolución **720p**, duración ≤ **141 s**
- Salida máxima combinada: **148 s**
- La extensión finaliza el último segundo (24 frames) y continúa la acción
- Referenciar un vídeo para extenderlo **reinicia** su contador de 2 días

---

## 8. Best practices (tabla resumen oficial)

| Tema | Tarea |
|---|---|
| Prompts | Use clear and specific prompts · Avoid quotation marks · Focus short videos on a single scene · Enhance your workflow with Gemini Omni |
| Video generation | Use multiple aspect ratios · Achieve character and voice consistency |
| Image-to-video | Use a high-quality source image · Prompt for motion only · Use general terms for characters in the source image · Direct the camera's movement |

### Image-to-video en detalle
- "Think of your source image as the first frame of your film" — usa una imagen de alta calidad.
- **Prompt solo de movimiento.** No re-describas personaje, fondo ni iluminación: "Redundant prompts confuse the model".
- Términos genéricos para personajes: `the subject`, `the woman`, `he`, `she`, `they`.
- Tres tipos de movimiento que puedes dirigir:
  1. *Camera Motion* — `Slow dolly in on the subject.`
  2. *Subject Animation* — `The character's hair and clothes flutter gently in the wind.`
  3. *Environmental Animation* — `Fog rolls in slowly across the landscape.`

### Aspect ratios
- `16:9` — TVs, monitores, YouTube, presentaciones. Capta más fondo, paisajes.
- `9:16` — **TikTok, Instagram Reels, YouTube Shorts.** Retratos y objetos verticales altos.

---

## 9. Errores comunes (checklist antes de lanzar)

1. Pedir 1080p/4k con duración ≠ 8s
2. Pedir 4k en Veo 3.1 Lite
3. Usar 1080p/4k al extender (solo 720p)
4. `lastFrame` sin `image`
5. Pasar `image` dentro de `config` en Python/JS
6. Intentar extender un vídeo no generado por Veo
7. Extender vídeos de >141 s, o con aspect ratio / resolución no soportados
8. Extender más de 20 veces o esperar salidas >148 s
9. Esperar que la voz se extienda si no está en el último segundo
10. Dejar los vídeos en el servidor más de 2 días
11. Pedir >3 imágenes de referencia, o usarlas en Veo 3 / 3.1 Lite / Veo 2
12. Esperar >1 vídeo por request en Veo 3.x
13. Usar un `personGeneration` no permitido (en España: `"allow_adult"`)
14. Confiar en `seed` para determinismo exacto
15. Hacer polling sincrónico ingenuo (latencia hasta 6 min)
16. Asumir que el audio se puede desactivar en Veo 3.x (siempre activo)
17. Usar comillas en el diálogo
18. Encadenar varias escenas en un solo clip de 8 s
19. Escribir negative prompts con "no" / "don't"
20. En image-to-video, re-describir lo que ya está en la imagen
