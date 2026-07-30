# Guiones short-form para Smashly · beat a beat en Google Flow

8 guiones listos para producir. Cada beat = **1 clip de 8 s en Flow**.
Lee antes `flow-playbook.md` (cómo generar) y `retention-playbook.md` (por qué está así escrito).

---

## Cómo usar este documento

Cada beat trae cuatro cosas:

- **PROMPT** — se pega tal cual en Flow. Está en inglés; el diálogo en español.
- **TEXTO** — el overlay en pantalla. Se añade en CapCut, no en Flow.
- **VO** — lo que se oye.
- **Modo** — Text to Video / Frames to Video / Ingredients.

### Dos formas de hacer la voz

| | Cómo | Cuándo |
|---|---|---|
| **A · Diálogo nativo de Veo** | El diálogo va dentro del prompt, con el Character y su voz | POV, testimonios, cualquier cosa donde el personaje habla en cámara. Más rápido, menos control de timing |
| **B · Clips mudos + VO en CapCut** | Genera sin diálogo (solo SFX/ambiente) y locuta encima | Tutoriales, listas, demos de UI. **Mejor retención**: controlas el ritmo al milisegundo y puedes hablar más rápido de lo que Veo permite |

Los guiones indican qué opción usar. Regla: si el personaje **no** aparece hablando en plano, usa B.

### Continuidad entre beats — obligatorio, no opcional
Al final de cada beat, `Save frame` del último fotograma → úsalo como `+ Add start frame` del beat
siguiente. Convierte el corte en una continuación y sube el completion rate.

**Ningún clip pasa de 8-10 s, así que todo vídeo es un montaje y el montaje es el producto.**
Todo guion multi-beat debe mantener el mismo personaje, el mismo escenario, el mismo ambiente y
un objeto que viaje entre beats. El contrato completo está en
`retention-playbook.md` §3.5. Y aplica un grade común con `--grade brand`.

### ⚠ Auditoría de continuidad de esta biblioteca

Estos guiones se escribieron beat a beat **antes** de fijar el contrato de continuidad, y varios
lo incumplen: saltan de una escena real a un bodegón de estudio y de ahí a un pantallazo. Antes
de producir cualquiera de ellos, aplica la corrección indicada.

| Guion | Estado | Qué corregir |
|---|---|---|
| **#1** Dos años con la pala equivocada | ⚠ | Beats 1-2 ya encadenan bien. El beat 3 salta a un móvil sobre superficie blanca: cámbialo a que @Marcos levante el móvil en el mismo banco y mete la UI con `--screen-insert`. **Ya está rehecho así en `produccion/video-01/`** |
| **#2** El codo no es tu culpa | ⚠⚠ | Tres mundos distintos (codo / bodegón / UI). Llévalo todo a la pista: el codo vendado del jugador, la pala en sus manos, y el móvil en su mano. Un solo `@Character`, una sola luz |
| **#3** Tres datos antes del precio | ⚠ | Los beats 1-3 son bodegón de producto pero con fondos distintos (verde / blanco / oscuro). Unifica: **la misma mesa, la misma luz** los tres. El beat 4 (UI) mejor como insert en un móvil sobre esa misma mesa |
| **#4** La pala de Coello no es para ti | ⚠⚠ | @Lucia en pista → bodegón → UI. Quédate en la pista: ella habla, ella sostiene las dos palas, ella enseña el móvil |
| **#5** 60 euros de diferencia | ✓ | Coherente: mundo gráfico + UI encadenada. Aplica grade `cool` |
| **#6** Le pedí a una IA que eligiera mi pala | ✓ | Coherente: producto + UI encadenada desde el mismo frame |
| **#7** El dato que nadie mira | ✓ | Los dos beats son macro sobre la misma pala. El más limpio de la biblioteca |
| **#8** Amanecer (brand film) | ✓ | Misma pista, misma hora, mismo material. Correcto |

Los tres marcados ✓ se pueden producir tal cual. Los ⚠ hay que reescribirlos primero.

### Cierre estándar de prompt
Pega esto al final de **todos** los prompts (Flow no tiene negative prompt):
```
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```

### Paleta de marca (pega en el prompt cuando quieras dirigir el color)
```
Color grade: deep forest green shadows shifting to vibrant emerald green highlights, near-white surfaces with a subtle green tint, warm amber accents. Soft film grain.
```

---

# 1 · "Dos años con la pala equivocada"
**Formato**: POV/skit · **Duración**: 24 s (3 beats) · **Voz**: A · **Pilar**: relatable
**Hook**: ⚡ pérdida · **CTA**: comentario

### Beat 1 (0–8 s) — Text to Video
**PROMPT**
```
Eye-level medium shot of @Marcos sitting alone on a bench beside an outdoor padel court at dusk, a racket resting across his knees. He stares at the racket, turns it over slowly, and exhales. Static shot, no camera motion. Telephoto lens, shallow depth of field, the court blurred behind him. Low-key light with a warm amber rim from a court floodlight, deep forest green shadows, resigned mood. Photorealistic vertical smartphone video look.
Distant ball impacts from another court, a light evening breeze.
@Marcos says, speaking in Spanish (Spain): Dos años con esta pala. Dos años.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `POV: 2 años con la pala equivocada`
**VO** diálogo nativo

### Beat 2 (8–16 s) — Frames to Video: First
Start frame: `Save frame` del beat 1.
**PROMPT**
```
The subject looks up from the racket directly into the lens. Slow dolly in on his face. Everything else holds still.
Court ambience fades slightly.
He says, speaking in Spanish (Spain): Peso mal, balance mal. Y el codo pagándolo.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `peso mal · balance mal · codo destrozado`

### Beat 3 (16–24 s) — Text to Video
**PROMPT**
```
Extreme close-up, top-down shot, of a phone lying on a near-white surface with a subtle green tint, showing a racket recommendation card. A yellow-lime padel ball rolls into frame and stops beside it. Static shot. Macro lens, shallow depth of field. Soft morning sunlight from the left, warm amber accents, relieved and clarifying mood. Photorealistic macro cinematography.
A soft confirming chime, then quiet.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `Comenta tu nivel y te digo qué forma te toca`
**VO** (CapCut) "Comenta tu nivel. Te digo qué forma te toca."

**Coste**: 3 beats × 2 intentos × 10 (Lite) + 3 × 20 (Fast final) = **120 créditos**

---

# 2 · "El codo no es tu culpa"
**Formato**: Problema-Solución · **Duración**: 24 s (3 beats) · **Voz**: B · **Pilar**: educativo
**Hook**: ⚡ pérdida/miedo · **CTA**: save

### Beat 1 — Text to Video
**PROMPT**
```
Extreme close-up of a man's elbow wrapped in a black compression sleeve, his forearm tense, a padel racket held loosely in the hand below. Slow tilt up along the forearm. Telephoto lens, very shallow depth of field. Dramatic side lighting, deep forest green background falling into shadow, clinical and uneasy mood. Photorealistic, shot on 35mm film.
A quiet room tone, one distant ball impact.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `Esa pala te está destrozando el codo`
**VO** "Si te duele el codo, no es que juegues mal."

### Beat 2 — Text to Video
**PROMPT**
```
Extreme close-up, top-down shot, of two padel rackets side by side on a near-white surface with a subtle green tint. A translucent glowing marker slides along each handle toward the head, stopping at a different point on each racket. Static shot. Macro lens, deep depth of field, volumetric light rays from above. Warm amber accents on emerald green, precise and technical mood. Photorealistic product cinematography with a blueprint schematic overlay aesthetic.
A crisp digital tick as each marker settles, then a low resonant hum.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `balance alto = más vibración al brazo`
**VO** "Es el balance. Alto manda la vibración directa al brazo. Y el peso: quince gramos de más y lo notas en cada bandeja."

### Beat 3 — Frames to Video: First
Start frame: screenshot `screenshots/08-best-racket-mobile.png`.
**PROMPT**
```
Slow dolly in on the screen. The result card scales up gently into place and a soft glow pulses once around it. Slight parallax on the background gradient.
A short processing whir resolving into a bright confirming chime.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `filtra por lesión · gratis`
**VO** "En Smashly filtras por lesión. Guárdalo para cuando vayas a comprar."

**Coste**: **120 créditos**

---

# 3 · "Tres datos antes del precio"
**Formato**: Lista · **Duración**: 32 s (4 beats) · **Voz**: B · **Pilar**: educativo
**Hook**: ⚡ valor · **CTA**: save · **El mejor para saves de los ocho**

### Beat 1 — Text to Video
**PROMPT**
```
Worm's-eye view of three padel rackets standing upright in a row against a deep forest green background, lit from behind so their silhouettes read clearly. Slow pedestal up. Wide-angle lens, deep depth of field, gentle lens flare. Backlighting creating rim light, warm amber accents, confident and instructional mood. Photorealistic studio product cinematography.
A single low resonant tone.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `3 datos que decides ANTES del precio`
**VO** "Tres datos que decides antes de mirar el precio."

### Beat 2 — Text to Video · dato 1: forma
**PROMPT**
```
Extreme close-up, top-down shot, of a padel racket on a near-white surface with a subtle green tint. A thin glowing emerald outline traces the racket's silhouette, then morphs from a round shape to a teardrop to a diamond, holding a beat on each. Static shot. Macro lens, deep depth of field. Soft even overhead light, warm amber accents, clean and technical mood. Photorealistic with a blueprint schematic overlay aesthetic.
A crisp tick as each shape locks in.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `1. FORMA — redonda, lágrima o diamante`
**VO** "Uno: la forma. Redonda perdona los fallos. Diamante castiga y pega. Lágrima está en medio."

### Beat 3 — Text to Video · dato 2: balance
**PROMPT**
```
Extreme close-up, eye-level, of a padel racket balancing on a single finger at its pivot point, tilting slowly one way and then the other. Static shot, subtle arc. Telephoto lens, shallow depth of field. Dramatic side lighting, deep forest green shadows with a warm amber rim, precise and physical mood. Photorealistic, shot on 35mm film.
The soft creak of the grip and a low hum.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `2. BALANCE — bajo controla, alto pega`
**VO** "Dos: el balance. Bajo controla y protege el brazo. Alto pega más y te lo cobra."

### Beat 4 — Frames to Video: First · dato 3 + CTA
Start frame: screenshot `screenshots/04-catalog-mobile.png`.
**PROMPT**
```
The list scrolls upward smoothly and continuously, cards settling into place one after another, then stops. The camera holds static.
Rapid soft scroll ticks, then a confirming tap.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `3. PESO — y luego el precio`
**VO** "Tres: el peso, según tu físico. El precio va al final, no al principio. Guárdalo."

**Coste**: 4 × 2 × 10 + 4 × 20 = **160 créditos**

---

# 4 · "La pala de Coello no es para ti"
**Formato**: Contrarian · **Duración**: 24 s (3 beats) · **Voz**: A + B · **Pilar**: datos/contrarian
**Hook**: ⚡ contrarian · **CTA**: comentario · **El mejor para comentarios**

> Nota de compliance: **no menciones el nombre real del jugador en el prompt de Flow** (los modelos
> bloquean figuras públicas reales). Genera un jugador genérico y pon el nombre solo en el **texto
> en pantalla y la voz en off**, que los haces tú en CapCut. En pantalla di "la pala del número 1"
> o "la pala del pro" en lugar de nombrar a nadie: evita problemas de derechos de imagen.

### Beat 1 — Ingredients to Video (@Lucia)
**PROMPT**
```
Eye-level medium shot of @Lucia standing at the glass wall of an indoor padel court, racket under her arm, speaking directly to camera with easy confidence. Static shot. Wide-angle lens, moderate depth of field. Bright even indoor court lighting with a green colour cast from the court surface, confident and slightly provocative mood. Photorealistic vertical smartphone video look.
The ambient reverb of an indoor court, occasional distant ball impacts.
@Lucia says, speaking in Spanish (Spain): La pala del número uno no es para ti.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `Opinión impopular 🔥`
**VO** diálogo nativo

### Beat 2 — Text to Video
**PROMPT**
```
Extreme close-up, top-down shot, of two padel rackets side by side on a near-white surface with a subtle green tint. Above each, a translucent glowing pentagon radar chart draws itself line by line; the two shapes end up clearly different. Very slow arc shot. Macro lens, shallow depth of field, volumetric light rays. Warm amber accents on emerald green, analytical mood. Photorealistic product cinematography with a blueprint schematic overlay aesthetic.
A crisp digital tick for each axis, then a low resonant hum.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `misma pala ≠ mismo brazo`
**VO** "Él genera la potencia con la técnica. Tú la necesitas de la pala. Misma pala, resultado opuesto."

### Beat 3 — Frames to Video: First
Start frame: screenshot `screenshots/06-compare-mobile.png`.
**PROMPT**
```
Slow truck right across the comparison columns, then a rack focus onto the centre column. The chart lines animate as if drawing themselves.
A rising sequence of three soft data tones.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `¿de acuerdo o no? 👇`
**VO** "Busca su pala en Smashly y mira el equivalente para tu nivel. ¿De acuerdo o no?"

**Coste**: **120 créditos** (beat 1 exige Lite o Fast — Ingredients no funciona en Quality)

---

# 5 · "60 euros de diferencia"
**Formato**: Demo · **Duración**: 24 s (3 beats) · **Voz**: B · **Pilar**: prueba de producto
**Hook**: ⚡ prueba · **CTA**: link en bio · **El mejor para conversión**

### Beat 1 — Text to Video
**PROMPT**
```
Extreme close-up of three price tags hanging side by side against a deep forest green background, each showing a different number, the highest closest to camera. Slow rack focus from the nearest tag to the farthest. Telephoto lens, very shallow depth of field. Low-key lighting with a warm amber rim light, curious and slightly indignant mood. Photorealistic macro cinematography.
Three soft descending tones.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `la misma pala · 3 precios`
**VO** "La misma pala. Tres tiendas. Sesenta euros de diferencia."

### Beat 2 — Frames to Video: First
Start frame: screenshot `screenshots/12-racket-detail-mobile.png`.
**PROMPT**
```
Slow pedestal down the page. The price rows appear one after another and the lowest row highlights with a soft pulse. Slight parallax between the image and the specs below.
A tick for each row, then a bright confirming chime on the last one.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `precio mínimo, en tiempo real`
**VO** "Smashly rastrea las tiendas y te enseña el mínimo. No hace falta abrir cinco pestañas."

### Beat 3 — Frames to Video: First
Start frame: `Save frame` del beat 2, con el histórico de precios visible.
**PROMPT**
```
The price history line draws itself from left to right across the chart and settles. A marker drops onto the lowest point. The camera holds static.
A soft rising tone as the line draws, then a single chime on the marker.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `y si sube, espera. Link en bio`
**VO** "Y si está por encima de su mínimo histórico, espera. Link en bio. Gratis, sin registro."

**Coste**: **120 créditos**

---

# 6 · "Le pedí a una IA que eligiera mi pala"
**Formato**: Tutorial · **Duración**: 32 s (4 beats) · **Voz**: B · **Pilar**: prueba de producto
**Hook**: ⚡ curiosidad · **CTA**: link en bio

### Beat 1 — Text to Video (muestra el resultado primero)
**PROMPT**
```
Extreme close-up, top-down shot, of a black carbon padel racket resting on a near-white surface with a subtle green tint, a translucent glowing pentagon radar chart already complete above it. Slow zoom out revealing the full racket. Macro lens, shallow depth of field, lens flare from a soft overhead light. Volumetric light rays, warm amber accents on emerald green, resolved and satisfying mood. Photorealistic product cinematography.
A single bright confirming chime, then a low hum.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `Esta. En 40 segundos`
**VO** "Esta es la pala que salió. Cuarenta segundos. Así lo hice."

### Beat 2 — Frames to Video: First
Start frame: screenshot `screenshots/08-best-racket-mobile.png` (el wizard).
**PROMPT**
```
The form fields fill in one after another from top to bottom, each field highlighting briefly as it completes. The camera holds static.
A soft tap for each field.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `nivel · estilo · altura · peso`
**VO** "Nivel, estilo de juego, altura, peso y presupuesto. Cinco preguntas."

### Beat 3 — Frames to Video: First
Start frame: `Save frame` del beat 2 en el estado de carga.
**PROMPT**
```
A soft pulse ripples outward from the centre of the screen, repeating slowly. Slight parallax on the background gradient. The camera holds static.
A processing whir with a rhythmic pulse underneath.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `analizando 800 palas`
**VO** "Cruza tu perfil con más de ochocientas palas y sus datos técnicos."

### Beat 4 — Frames to Video: First
Start frame: `Save frame` del beat 3, resultado.
**PROMPT**
```
The result cards scale up gently into place one after another and a soft glow pulses once around the first one. Slow dolly in.
A bright confirming chime, then a warm resolving tone.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `con el porqué de cada una · link en bio`
**VO** "Y te explica por qué cada una. Link en bio. Gratis y sin registro."

**Coste**: **160 créditos**

---

# 7 · "El dato que nadie mira"
**Formato**: Problema-Solución · **Duración**: 16 s (2 beats) · **Voz**: B · **Pilar**: educativo
**Hook**: ⚡ curiosidad · **CTA**: save · **El más barato de producir**

### Beat 1 — Text to Video
**PROMPT**
```
Extreme close-up, macro, of the black carbon face of a padel racket, the woven fibre pattern filling the frame. A thin emerald green line of light sweeps slowly across the surface, revealing the texture as it passes. Static shot with a very slight arc. Macro lens, extremely shallow depth of field. Dramatic side lighting, deep forest green shadows with a warm amber rim, secretive and technical mood. Photorealistic, ultra-realistic rendering, shot on 8K camera.
A low resonant hum with a soft sweep as the light passes.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `Hay un dato que nadie mira`
**VO** "Todo el mundo mira el peso. Casi nadie mira la dureza del núcleo."

### Beat 2 — Text to Video
**PROMPT**
```
Extreme close-up, eye-level, of a yellow-lime padel ball pressing slowly into the black face of a racket and rebounding, the surface visibly deforming and recovering. Slow-motion. Static shot. Macro lens, extremely shallow depth of field. Dramatic side lighting with a warm amber rim, deep forest green background, revealing and satisfying mood. Photorealistic, ultra-realistic rendering, shot on 8K camera.
A deep stretched thud of impact, resonant.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `blando = salida · duro = control`
**VO** "Blando da salida de bola y perdona. Duro da control y pide brazo. Está en la ficha de cada pala en Smashly. Guárdalo."

**Coste**: 2 × 2 × 10 + 2 × 20 = **80 créditos**

---

# 8 · "Amanecer" (brand film)
**Formato**: B-roll · **Duración**: 24 s (3 beats) · **Voz**: B, mínima · **Pilar**: marca
**Sin hook de dolor.** Este es el único donde vale gastar Veo 3.1 Quality. No busca retención
máxima: busca que la cuenta tenga una pieza de identidad que puedas fijar en el perfil.

### Beat 1 — Text to Video · **Veo 3.1 Quality**
**PROMPT**
```
Wide establishing shot, low-angle, of an empty outdoor padel court at pre-dawn, glass walls catching the first light, a single racket and ball resting on the ground in the foreground. Very slow pedestal up. Wide-angle lens, deep depth of field, gentle lens flare as the sun crests the wall. Golden hour glow against cool blue shadows, thin mist hanging over the court surface, peaceful and anticipatory mood. Photorealistic cinematic film look, anamorphic feel.
A faint morning breeze, distant birds, complete court silence.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** —

### Beat 2 — Text to Video · **Veo 3.1 Quality**
**PROMPT**
```
Extreme close-up of a hand wrapping fresh grip tape around the handle of a padel racket, fingers pressing each overlap tight. Slow truck right following the wrapping motion. Macro lens, shallow depth of field. Soft morning sunlight streaming from the right, near-white surface with a subtle green tint, warm amber accents, focused and ritualistic mood. Photorealistic, shot on 35mm film.
The crisp stretch and tack of grip tape being pulled and pressed.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `tu juego`
**VO** "Tu juego."

### Beat 3 — Text to Video · **Veo 3.1 Quality**
**PROMPT**
```
Extreme close-up, slow-motion, of a yellow-lime padel ball compressing against the black carbon face of a racket at the exact moment of impact, individual fibres visible. Static shot with a very slight arc. Macro lens, extremely shallow depth of field. Dramatic side lighting with a warm amber rim, deep forest green background falling into shadow, powerful and precise mood. Photorealistic, ultra-realistic rendering, shot on 8K camera.
A deep, heavy thud of impact, stretched and resonant.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```
**TEXTO** `tu pala`
**VO** "Tu pala."
Cierre en CapCut: logo Smashly + `smashly-app.es`

**Coste**: 3 × 100 (Quality, sin margen de iteración) = **300 créditos**. Genera los borradores en
Lite primero (3 × 2 × 10 = 60) y solo pasa a Quality lo que ya funciona → **360 créditos** total.
Es un tercio de tu cuota mensual: hazlo una vez y reutilízalo todo el año.

---

## Plan de producción del primer mes (plan Pro, 1.000 créditos)

| Semana | Vídeo | Coste | Por qué |
|---|---|---|---|
| 1 | #7 "El dato que nadie mira" | 80 | El más barato: valida si el formato educativo tira |
| 1 | #1 "Dos años con la pala equivocada" | 120 | Valida el POV y a @Marcos |
| 2 | #3 "Tres datos antes del precio" | 160 | Apuesta de saves |
| 2 | #5 "60 euros de diferencia" | 120 | Apuesta de conversión |
| 3 | #4 "La pala de Coello no es para ti" | 120 | Apuesta de comentarios |
| 3 | #2 "El codo no es tu culpa" | 120 | Ángulo de lesión, el de mayor carga emocional |
| 4 | #6 "Le pedí a una IA…" | 160 | Tutorial completo, ya con datos de qué hook funciona |
| **Total** | 7 vídeos | **880** | quedan 120 de margen para regenerar el que falle |

El brand film (#8, 360 créditos) va el mes 2, cuando ya sepas qué estética responde mejor.

Rellena el hueco entre publicaciones con **screen recordings de la app + voz en off** (`pnpm
record:demo`): coste cero, ilimitados, y convierten mejor porque son prueba real. Los vídeos de
Flow dan identidad; los screen recordings dan volumen.

## Variantes de hook para A/B
Cada guion tiene un cuerpo reutilizable. Para testear, cambia **solo el beat 1** y deja los demás:

| Guion | Hook A (el del guion) | Hook B a probar |
|---|---|---|
| #1 | "Dos años con esta pala. Dos años." | "Trescientos euros. Y no era mi pala." |
| #2 | "Si te duele el codo, no es que juegues mal." | "Tu pala te está destrozando el codo." |
| #3 | "Tres datos que decides antes del precio." | "El 80% compra pala mirando la marca. Error." |
| #5 | "La misma pala. Tres tiendas. Sesenta euros." | "Encontré mi pala 60 euros más barata. Así." |
| #6 | "Esta es la pala que salió. Cuarenta segundos." | "Le pedí a una IA que eligiera mi pala." |

Regenerar solo el beat 1 en Lite cuesta 10–20 créditos por variante. Es la inversión de mejor
retorno de todo el proceso.
