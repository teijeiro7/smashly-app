# Playbook de Google Flow para Smashly

Cómo producir los vídeos **en la UI de Flow**, no por API. Todo verificado contra el Centro de
Ayuda oficial de Flow (`support.google.com/flow`) en julio de 2026.

> Ojo: la FAQ antigua de `labs.google/fx/tools/flow/faq` está obsoleta (habla de Veo 3/Veo 2,
> "exclusivo Pro y Ultra", 70 países). No la uses como referencia.

---

## 0. Corrección: Gemini Omni Flash sí existe

**Gemini Omni Flash es un modelo de vídeo real y es exclusivo de la UI de Flow** — no está en la
API pública de Veo. Es la razón por la que en Flow tienes cosas que la API no te da: edición
conversacional de vídeo, clips de 10 s, referencias de voz y avatares.

Modelos de vídeo disponibles en Flow:

| Modelo | Duraciones | Créditos/generación (plan Pro) |
|---|---|---|
| **Veo 3.1 Lite** | 4s, 6s, 8s + Extend | **10** |
| **Veo 3.1 Fast** | 4s, 6s, 8s + Extend | **20** |
| **Veo 3.1 Quality** | solo 8s + Extend | **100** |
| **Gemini Omni Flash** | 4s / 6s / 8s / 10s | **15 / 20 / 25 / 30** |
| Omni Flash — editar vídeo | cualquier duración | 40 |

Modelos de imagen (para stills y frames de partida): Nano Banana Pro, Nano Banana 2, Nano Banana 2 Lite.

---

## 1. Modos de generación (nombres literales de la UI)

En la caja de prompt haces clic en el **nombre del modelo** y eliges el modo:

| Modo | Qué hace | Disponible en |
|---|---|---|
| **Text to Video** | Vídeo desde prompt de texto | Veo 3.1 Lite/Fast/Quality, Omni Flash |
| **Frames to Video: First** | Anima desde un frame inicial | Veo 3.1, Omni Flash |
| **Frames to Video: First + last** | Genera la transición entre dos imágenes | Veo 3.1 (Omni Flash: coming soon) |
| **Ingredients/References to Video** | Referencias visuales de personaje, objeto, estilo o ubicación | Veo 3.1 **Lite y Fast solo, y solo 8s**. **Quality NO.** Omni Flash sí, y es el único con referencias de voz |
| **Video to Video editing** | Edita un vídeo con prompt | **Solo Omni Flash. NO disponible en España** (ver §6) |
| **Extend** | Continúa la acción al final de un clip | Solo vídeos de Veo 3.1, y **hay que usar Veo 3.1 Lite para extender** |

Frames se añaden arrastrando a **`+ Add start frame`** y **`+ Add end frame`**.

**Modos de edición post-generación**: `Insert`, `Remove`, `Camera`, `Extend`.
Limitación literal: *"You can't apply other edit modes such as insert, remove, and camera to
extended video clips."* Es decir, **si extiendes un clip pierdes la capacidad de editarlo** —
extiende al final del proceso, nunca al principio.

---

## 2. Lo que Flow NO tiene (y sí tiene la API)

Esto cambia cómo hay que escribir los prompts respecto a la guía de `veo-reference.md`:

| Falta en Flow | Consecuencia práctica |
|---|---|
| **No hay `seed`** | La consistencia de personaje **no se resuelve con seed**. Se resuelve con la biblioteca **Characters** (§3). Es la diferencia más importante. |
| **No hay `negativePrompt`** | Todo lo que no quieres tiene que estar **dentro del prompt en positivo**: en vez de un campo negativo, cierra el prompt con `No text overlays, no logos, no watermarks.` Funciona peor que el campo real, así que compensa siendo más específico en lo que **sí** quieres. |
| **No hay resolución como parámetro** | Generas y luego haces **upscale** (1080p gratis en Pro; 4K solo Ultra, 50 créditos). |
| **Duración es un desplegable** | 4/6/8 s (10 s en Omni Flash). No hay valores libres. |
| **No hay `personGeneration`** | No lo controlas. Google filtra por su cuenta. |

Lo que Flow tiene y la API no: proyectos, **Characters**, **Voices**, Scenebuilder, Collections,
History/Stacks, agente de generación por lotes, Tools, publicación directa a YouTube y controles
de cámara post-generación.

**Controles de cámara**: existen como edición posterior (`Camera Adjustment` / "reshoot") —
ajustar posición, órbita y dolly. Advertencia oficial: *"works best for clips that don't currently
include camera motion"*. Solo en desktop. Implicación: si piensas retocar la cámara después,
**genera el clip con cámara estática**.

---

## 3. Characters y Voices: la clave de la consistencia

Sin `seed`, esto es tu único mecanismo real de consistencia. Configúralo **antes** de generar nada.

### Crear los personajes de Smashly
Barra izquierda → **Characters** → **New Character**. Necesitas: descripción, **1 o 2 imágenes**
(mínimo 1), nombre y voz.

Definición oficial: *"bundle specific visual and audio references into a single, reusable
character. Your character's face, clothing, and voice remain strictly consistent across multiple
generations."*

Crea dos y reutilízalos en toda la cuenta:

**`@Marcos`** — el jugador amateur indeciso, "el yo antes de Smashly"
> A 34-year-old Spanish man with an athletic build, short dark brown wavy hair, a trimmed beard, warm brown almond-shaped eyes, and a small scar above his left eyebrow. Wears a plain dark green technical padel t-shirt.

Voz: base masculina media, Voice Performance → `Warm, slightly gravelly, mid-range, natural conversational pace, Spanish from Spain accent.`

**`@Lucia`** — la jugadora de nivel medio-alto, voz de autoridad amistosa
> A 29-year-old Spanish woman with a lean athletic build, long dark hair tied in a high ponytail, sharp defined cheekbones, bright hazel eyes, and a small mole on her right cheek. Wears a white technical padel top.

Voz: base femenina clara, Voice Performance → `Clear, bright, energetic, crisp articulation, Spanish from Spain accent.`

Se invocan en cualquier prompt con **`@Marcos`** / **`@Lucia`**. Ejemplo:
`@Marcos standing frozen in front of a wall of padel rackets, slow dolly in.`

También existe **`@me`** (avatar desde tu foto de perfil, se crea escaneando un QR con el móvil) —
útil si quieres poner tu cara como fundador en los vídeos de marca.

### Voices
`Add → Voices`. **Solo funciona con Omni Flash + Ingredients.** Limitación literal:
*"You can add voice references only to video generations that use ingredients. For all other kinds
of generations, you'll get an error."* Se referencian como `@Voice: Andrew`.
Puedes crear voces custom describiendo el Voice Performance.

### Ingredients por generación
Arrastra ficheros, o escribe **`@`** para buscar cualquier asset del proyecto por nombre.
La doc actual **no documenta un máximo** de ingredients (el viejo límite de 3 venía de la FAQ obsoleta).

Consejos oficiales de Flow para ingredients:
1. **Prepare clean ingredients** — referencias de sujeto o producto sobre fondo plano o segmentado.
   Las referencias de ubicación y estilo no deben contener sujetos extra.
2. **Avoid conflicting guidance** — el prompt de texto debe **complementar, no contradecir** los
   inputs visuales, y **debe referenciar explícitamente** los frames o ingredients aportados.
3. Look & feel consistente entre las imágenes de ingredients ayuda al modelo a mezclarlas.

---

## 4. Workflow de producción de un Reel

Un Reel de 20–30 s son **3–4 clips** de Flow encadenados. Ningún clip individual llega.

```
1. Guion beat a beat        →  docs/video-ai/scripts-shortform.md
2. Setup una sola vez       →  Characters @Marcos y @Lucia, Collection del proyecto
3. Borrador de cada beat    →  Veo 3.1 LITE, 8s, 10 créditos. Iterar aquí, no en Fast.
4. Aprobar la dirección     →  regenerar los beats buenos en Veo 3.1 FAST (20 créditos)
5. Save frame               →  guardar el último fotograma de un beat como imagen
                               y usarlo como "Add start frame" del siguiente → continuidad real
6. Scenebuilder             →  hover clip → More → Add to Scene
                               ordenar por drag & drop, recortar con los handles, preview
7. Upscale 1080p            →  gratis en plan Pro
8. Download la escena       →  Scenebuilder NO se puede publicar directo a YouTube
9. Subtítulos + CTA final   →  en CapCut, fuera de Flow (ver §5)
```

**Atajos que ahorran horas** (macOS): `Espacio` preview · `→`/`←` asset siguiente/anterior ·
`↓`/`↑` versión anterior/siguiente del History · `Shift+→`/`Shift+←` avanzar frame a frame
(imprescindible para el QC de los últimos 2 s) · `Cmd+D` descargar · `Cmd+G` agrupar en Collection ·
`@` menú de referencias · `Shift+V` filtrar solo vídeos.

**QC obligatorio**: revisa siempre **los últimos 2 segundos de cada clip** frame a frame. Es donde
aparece la deriva de estilo y los objetos intrusos. Recorta antes o regenera; nunca publiques un
frame "realificado".

---

## 5. Tres restricciones que condicionan la estrategia

### a) Watermark visible en plan Pro
Los tiers **Free, Plus y Pro llevan watermark visible "made with Veo"**. Solo **Ultra** lo quita
(y aun así *"if required by local regulations"* — en la UE puede aparecer igual). SynthID
invisible va siempre en todos los tiers.

Implicación real: **para orgánico (TikTok/Reels/Shorts) el watermark no es un problema** — el
contenido IA está normalizado y las plataformas ya lo etiquetan solo. **Para ads pagados sí
molesta.** Opciones: (1) recortar el watermark en CapCut y aceptar la pérdida de encuadre —
planifica composiciones con aire en la zona del watermark; (2) subir a Ultra si vas a invertir
en paid; (3) usar Flow solo para b-roll y montar el ad con overlays propios encima.

### b) Video-to-video no está disponible en España
La restricción de features (`answer/16353544`) excluye **EEA, Suiza, Reino Unido** y algunos
estados de EE.UU. de la edición de vídeo y de video-to-video. Es decir: **desde España no puedes
subir un screen recording de la app y editarlo con Omni Flash.** Consecuencia: las demos de UI
tienen que hacerse con **Frames to Video** partiendo de un screenshot, o grabarse aparte
(`pnpm record:demo`) y montarse en CapCut.

### c) Los créditos son el cuello de botella real
Plan Pro = **1.000 créditos/mes**, no acumulables. Coste de un Reel de 4 beats:

| Estrategia | Cálculo | Reels/mes con 1.000 créditos |
|---|---|---|
| Todo en Lite | 4 beats × 2 intentos × 10 = **80** | ~12 |
| Borrador Lite + final Fast | (4×2×10) + (4×20) = **160** | ~6 |
| Todo en Fast | 4 × 2,5 × 20 = **200** | ~5 |
| Todo en Quality | 4 × 2 × 100 = **800** | ~1 |

**Regla operativa: itera SIEMPRE en Lite.** Cada iteración en Fast cuesta el doble y en Quality
diez veces más. Sube a Fast solo cuando el prompt ya funciona, y reserva Quality para el hero
shot de marca — uno por mes como máximo.

Extras: sin suscripción hay **50 créditos diarios** gratis (solo Veo 3.1 Lite/Fast/Quality) — sirve
para probar prompts sin gastar tu cuota mensual. Las queries al **Agente no cuestan créditos**
(pero tienen cuota diaria). Si falla la generación de audio, **se reembolsan** los créditos.
Hay rate limit por minuto que se endurece tras muchas generaciones en un día.

---

## 6. Prompting específico de Flow

Diferencias frente a la guía de API en `veo-reference.md`:

1. **Prompts en inglés.** Flow soporta 37 idiomas pero Google recomienda explícitamente inglés:
   *"quality of the generated output may vary depending on the language"*. El **diálogo sí en
   español**, precedido de `speaking in Spanish (Spain)`.
2. **Sin campo negativo** → cierra el prompt con las exclusiones en texto:
   `Everything visible now is the only thing that ever appears. No text overlays, no logos, no watermarks, no extra people.`
3. **Cuidado con las negaciones-trampa.** Los modelos de vídeo tienden a añadir "manos de
   operario" entrando en plano en movimientos de manipulación, y mencionar "no hands" lo empeora.
   Nunca menciones manos: describe el movimiento como perteneciente a los objetos.
4. **El habla falla si el diálogo no cabe en el clip.** Google lo documenta: el habla es menos
   probable si el diálogo no encaja en los 8 s. Máximo ~12–14 palabras por clip de 8 s.
5. **Un movimiento dominante por clip.** Dos movimientos se leen como caos a velocidad de feed.
6. **Iterar con Gemini**: Google recomienda llevar el prompt a gemini.google.com para reescribirlo.
   Aviso oficial importante: *"you'll need to explicitly tell Gemini to repeat all essential
   details from prior prompts"* — si no, pierde la consistencia entre beats.
7. **Doodle prompting**: en vez de buscar el prompt perfecto, dibuja o anota sobre la imagen.
   Flow interpreta los garabatos. Útil para marcar dónde quieres el movimiento.

### Tools útiles de Flow
Mini-apps dentro de Flow. Crear requiere suscripción (tú la tienes); usar es gratis.
Relevantes para short-form:
- **Type Overlays** — texto animado sobre el vídeo. Sirve para el text overlay del hook, aunque
  para subtítulos palabra a palabra CapCut sigue siendo mejor.
- **Video Resizer** — *"Resize your videos into any aspect ratio"*. Para sacar 4:5 y 1:1 del mismo 9:16.
- **Storyboard Studio** — planificar la secuencia de beats.
- **Image Editor**, **Shader Effects**, **Mockup**, **Grid Architect**, **Scout360**.

### Lo que Flow no tiene y hay que resolver fuera
- **Subtítulos nativos: no existen.** No hay captions ni export SRT. Y los subtítulos suben el
  watch time un 25–40%, así que son obligatorios. → CapCut.
- Timeline de edición fino, ducking de música, transiciones. → CapCut.

---

## 7. Aspect ratio y orientación

Flow expone **Aspect ratio** en las preferencias de vídeo (en móvil y en el agente se llama
**Orientation**). La documentación solo dice "Both aspect ratios" sin nombrar los valores, pero
soporta vertical. **Genera nativo en vertical, no recortes 16:9** — recortar te come el encuadre y
el watermark queda en el centro.

Para las variantes 4:5 (feed de Instagram) y 1:1, usa el Tool **Video Resizer** o regenera con el
aspect ratio correspondiente. Regenerar da mejor composición que recortar.

---

## 8. Checklist antes de generar

- [ ] `@Marcos` y `@Lucia` creados como Characters, con voz
- [ ] Modo correcto: Text to Video / Frames to Video / Ingredients
- [ ] Modelo **Lite** si es borrador
- [ ] Duración 8 s (o 10 s si es Omni Flash y necesitas más diálogo)
- [ ] Aspect ratio vertical
- [ ] Diálogo ≤14 palabras, con `speaking in Spanish (Spain)`
- [ ] Un solo movimiento dominante
- [ ] Exclusiones escritas en positivo al final del prompt
- [ ] Composición con aire en la zona del watermark
- [ ] Si vas a retocar la cámara después: genera con cámara estática

## Checklist después de generar

- [ ] QC frame a frame de los últimos 2 s (`Shift+→`)
- [ ] `Save frame` del último fotograma para el start frame del beat siguiente
- [ ] Añadir a Scene y recortar con los handles
- [ ] Upscale 1080p
- [ ] Download (Scenebuilder no publica directo a YouTube)
- [ ] Subtítulos y CTA en CapCut
