# Biblioteca de prompts — Ads verticales 9:16 para Smashly (Veo 3.1)

> **¿Produces en Google Flow?** Ve a `scripts-shortform.md` — ahí están los guiones completos
> beat a beat, ya adaptados a la UI de Flow y optimizados para retención. Este fichero es la
> biblioteca de **planos individuales** y sirve como banco de piezas para cualquier ruta.
>
> **Qué NO existe en Flow** y por tanto hay que ignorar aquí si trabajas en la UI:
> `negativePrompt` (no hay campo — mete las exclusiones en positivo al final del prompt),
> `seed` (usa la biblioteca **Characters** con `@Nombre`), `resolution` (se hace upscale después)
> y `personGeneration`. Detalles en `flow-playbook.md`.

**Config por defecto para todos los prompts de este fichero (ruta API):**

```json
{
  "aspectRatio": "9:16",
  "durationSeconds": "8",
  "resolution": "1080p",
  "personGeneration": "allow_adult",
  "numberOfVideos": 1
}
```

## Convenciones

- **El prompt se escribe en inglés**, el **diálogo en español**. Veo entiende mejor la dirección
  escénica en inglés, y el diálogo se genera en el idioma en que está escrito. Añade siempre
  `speaking in Spanish (Spain)` antes del diálogo para fijar el acento.
- **Sin comillas en el diálogo** — dos puntos, según best practices de Google.
- El audio va en **frases separadas** al final del prompt.
- Una sola escena por clip. Si el guion tiene más, divídelo en clips y encadénalos en montaje.
- Para series con el mismo actor: copia el bloque `CHARACTER` literalmente en cada clip y reutiliza el mismo `seed`.

## Bloques de personaje reutilizables

Pégalos sin modificar en cualquier prompt que los use.

**MARCOS** (jugador amateur, 30s, el "yo antes de Smashly")
```
Marcos, a 34-year-old Spanish man with an athletic build, short dark brown wavy hair, a trimmed beard, warm brown almond-shaped eyes, and a small scar above his left eyebrow. His voice is warm, slightly gravelly, mid-range, with a natural conversational pace.
```

**LUCÍA** (jugadora de nivel medio-alto, la "voz de autoridad amistosa")
```
Lucía, a 29-year-old Spanish woman with a lean athletic build, long dark hair tied in a high ponytail, sharp defined cheekbones, bright hazel eyes, and a small mole on her right cheek. Her voice is clear, bright, energetic, with crisp articulation.
```

**Paleta de marca para inyectar en cualquier prompt**
```
Color grade: deep forest green shadows shifting to vibrant emerald green highlights, near-white surfaces with a subtle green tint, warm amber accents. Soft film grain.
```

---

## A · Hooks de dolor (ansiedad de compra)

### A1 — La pared de palas
```
Eye-level medium shot of a 34-year-old Spanish man standing frozen in front of a padel pro-shop wall covered floor to ceiling with dozens of identical-looking rackets. He slowly reaches for one, hesitates, pulls his hand back, and exhales in defeat. Slow dolly in on his face as the wall of rackets blurs behind him. Telephoto lens, shallow depth of field with heavy bokeh on the rackets. Harsh fluorescent retail lighting, muted desaturated tones, tense and overwhelmed mood. Photorealistic cinematic film look.
The quiet hum of fluorescent lights and a distant squeak of shoes on court.
He murmurs, speaking in Spanish (Spain): Y esta cuál es. Trescientos euros y no tengo ni idea.
```
Negative prompt: `text overlays, logos, watermarks, cartoon, distorted hands`

### A2 — El error de 300 euros
```
Extreme close-up of a brand-new padel racket lying abandoned in the corner of a dark garage, a thin layer of dust on its black carbon surface. A single beam of afternoon sunlight crosses the frame, floating dust motes visible. Very slow pedestal up revealing the price tag still attached, reading 299 EUR. Macro lens, shallow depth of field. Low-key lighting, cool blue shadows with one warm amber shaft of light, melancholic regret. Photorealistic, shot on 35mm film.
Faint garage silence, a distant dog barking outside, the soft creak of the door.
```
Negative prompt: `people, hands, bright cheerful atmosphere, clutter`

### A3 — El consejo contradictorio
```
Medium shot, dutch angle, of three padel players on a sunlit outdoor court arguing while gesturing at a racket one of them is holding, each pointing in a different direction. Fast handheld camera with a slight whip pan between their faces. Wide-angle lens, deep depth of field. Bright midday sun, saturated green court tones, chaotic and frustrating mood. Photorealistic documentary look.
Overlapping voices, the pop of a padel ball hitting glass in the background.
The first man says, speaking in Spanish (Spain): Esta es de control. The second says: Que no, que es de potencia. The third says: Yo qué sé.
```

---

## B · Hooks de producto (autoridad de datos)

### B1 — De 800 a 1 · interpolación
Técnica: **first frame + lastFrame**. `image` = render de una pared de palas · `lastFrame` = screenshot `07-best-racket-mobile.png`.
```
The wall of hundreds of padel rackets collapses inward and reorganises itself into a single glowing racket card on a phone screen. Smooth continuous transformation, no cuts. Slow dolly in. Color grade: deep forest green shadows shifting to vibrant emerald green highlights, near-white surfaces with a subtle green tint, warm amber accents. Soft film grain. Satisfying, clarifying mood.
A rising synth swell resolving into a single soft chime.
```

### B2 — El radar
```
Extreme close-up, top-down shot, of a translucent glowing pentagon radar chart drawing itself line by line above a black carbon padel racket resting on a near-white surface. Five labelled axes illuminate one by one in vibrant emerald green. Very slow arc shot rotating around the racket. Macro lens, shallow depth of field, lens flare from a soft overhead light. Volumetric light rays, deep forest green shadows with warm amber accents, precise and technical mood. Photorealistic product cinematography with a blueprint schematic overlay aesthetic.
A crisp digital tick for each axis that lights up, then a low resonant hum.
```

### B3 — Precio mínimo
```
Extreme close-up of three price tags hanging side by side against a dark green background, each showing a different number. The two higher tags fade out and the lowest one, 149 EUR, brightens and scales up slightly. Static shot with a subtle rack focus from the highest tag to the lowest. Telephoto lens, shallow depth of field. Low-key lighting with a warm amber rim light on the winning tag, satisfying reveal mood. Photorealistic macro cinematography.
Three soft descending tones, then a single bright confirming chime.
```
Negative prompt: `store logos, brand names, cluttered background`

### B4 — La pelota que rueda por los datos
```
Worm's-eye view of a yellow-lime padel ball rolling slowly across a near-white surface printed with technical specifications in crisp dark type: weight, balance, shape, core, face. The ball stops precisely on one line. Truck right following the ball, then static as it stops. Wide-angle lens, deep depth of field. Soft morning sunlight from the left creating a long shadow, near-white surface with a subtle green tint, calm and precise mood. Photorealistic, ultra-realistic rendering.
The soft hollow roll of a padel ball on a hard surface, then silence.
```

---

## C · Demo de producto (image-to-video)

Regla clave: **prompt solo de movimiento**. No re-describas la interfaz, los colores ni la
iluminación — ya están en la imagen. Usa términos genéricos.

### C1 — Home
`image`: `screenshots/02-homepage-mobile.png`
```
Slow dolly in on the screen. The interface glows softly. Subtle parallax as the background gradient drifts upward.
A soft ambient synth pad and a single UI tap sound.
```

### C2 — Catálogo scrolleando
`image`: `screenshots/04-catalog-mobile.png`
```
The list scrolls upward smoothly and continuously. Cards settle into place one after another. The camera holds static.
Rapid soft scroll ticks, then a confirming tap.
```

### C3 — Comparador
`image`: `screenshots/06-compare-mobile.png`
```
Slow truck right across the comparison columns, then a rack focus onto the centre column. The chart lines animate as if drawing themselves.
A rising sequence of three soft data tones.
```

### C4 — Recomendador
`image`: `screenshots/08-best-racket-mobile.png`
```
Static shot. The loading state resolves and the result card scales up gently into place. A soft glow pulses once around it.
A short processing whir resolving into a bright confirming chime.
```

### C5 — Detalle con radar
`image`: `screenshots/12-racket-detail-mobile.png`
```
Slow pedestal down the page. The radar chart draws itself axis by axis. Slight parallax between the image and the specs below.
A crisp tick for each axis, then a low resonant hum.
```

---

## D · UGC sintético / testimonio

### D1 — Testimonio de Marcos
```
Eye-level medium shot of Marcos, a 34-year-old Spanish man with an athletic build, short dark brown wavy hair, a trimmed beard, warm brown almond-shaped eyes, and a small scar above his left eyebrow. His voice is warm, slightly gravelly, mid-range, with a natural conversational pace. He sits on a bench beside an outdoor padel court, holding his phone, talking directly to camera with a relaxed half-smile. Handheld camera with subtle natural movement. Telephoto lens, shallow depth of field, the court blurred behind him. Golden hour glow, warm amber light on his face against cool green court tones, honest and unpolished mood. Photorealistic vertical smartphone video look.
Distant padel ball impacts, a light breeze, faint birds.
He says, speaking in Spanish (Spain): En cinco minutos supe qué pala comprar y dónde más barata. Cinco minutos.
```
Config: `seed` fijo para reutilizar a Marcos en toda la serie.

### D2 — Testimonio de Lucía
```
Eye-level medium shot of Lucía, a 29-year-old Spanish woman with a lean athletic build, long dark hair tied in a high ponytail, sharp defined cheekbones, bright hazel eyes, and a small mole on her right cheek. Her voice is clear, bright, energetic, with crisp articulation. She stands at the glass wall of an indoor padel court, racket under her arm, speaking directly to camera with easy confidence. Slow dolly in. Wide-angle lens, moderate depth of field. Bright even indoor court lighting with a green colour cast from the court surface, confident and friendly mood. Photorealistic vertical smartphone video look.
The ambient reverb of an indoor court, occasional distant ball impacts.
She says, speaking in Spanish (Spain): Ochocientas palas comparadas con datos reales. Ni opiniones ni marketing. Datos.
```

### D3 — Objeción resuelta
```
Eye-level close-up of Marcos, a 34-year-old Spanish man with an athletic build, short dark brown wavy hair, a trimmed beard, warm brown almond-shaped eyes, and a small scar above his left eyebrow. His voice is warm, slightly gravelly, mid-range, with a natural conversational pace. He raises an eyebrow sceptically at camera, then breaks into a genuine grin and shrugs. Static shot. Telephoto lens, shallow depth of field, neutral indoor background. Soft window light from the left, near-white surfaces with a subtle green tint, disarming and candid mood. Photorealistic vertical smartphone video look.
Quiet room tone.
He says, speaking in Spanish (Spain): Pensaba que había truco. Ni registro ni pagar nada. Gratis.
```

---

## E · B-roll de marca (sin UI)

### E1 — El golpe
```
Extreme close-up, slow-motion, of a yellow-lime padel ball compressing against the black carbon face of a racket at the exact moment of impact, individual fibres of the surface visible. Static shot with a very slight arc. Macro lens, extremely shallow depth of field. Dramatic side lighting with a warm amber rim, deep forest green background falling into shadow, powerful and precise mood. Photorealistic, ultra-realistic rendering, shot on 8K camera.
A deep, heavy thud of impact, stretched and resonant.
```

### E2 — La pista al amanecer
```
Wide establishing shot, low-angle, of an empty outdoor padel court at pre-dawn, glass walls catching the first light, a single racket and ball resting on the ground in the foreground. Very slow pedestal up. Wide-angle lens, deep depth of field, gentle lens flare as the sun crests the wall. Golden hour glow against cool blue shadows, thin mist hanging over the court surface, peaceful and anticipatory mood. Photorealistic cinematic film look, anamorphic feel.
A faint morning breeze, distant birds, complete court silence.
```

### E3 — Grip
```
Extreme close-up of a hand wrapping fresh grip tape around the handle of a padel racket, fingers pressing each overlap tight. Slow truck right following the wrapping motion. Macro lens, shallow depth of field. Soft morning sunlight streaming from the right, near-white surface with a subtle green tint, focused and ritualistic mood. Photorealistic, shot on 35mm film.
The crisp stretch and tack of grip tape being pulled and pressed.
```
Negative prompt: `distorted fingers, extra fingers, text, logos`

### E4 — Sombras en la pista
```
Bird's-eye view, top-down shot, of two padel players moving across a green court, their long shadows sweeping across the surface as they rally. Very slow static hold, then a subtle zoom out. Telephoto lens, deep depth of field. Late afternoon sun creating long dramatic shadows, saturated court green with warm amber highlights, rhythmic and hypnotic mood. Photorealistic aerial cinematography.
The steady rhythm of ball impacts and shoe squeaks, no music.
```

---

## F · Cierres / CTA

### F1 — Wordmark con pala
Técnica: `referenceImages` con `public/images/icons/smashly-large-icon.png`, `referenceType: "asset"`.
```
The Smashly wordmark assembles itself on a deep forest green background, the racket letterform sliding into place last and a yellow-lime padel ball dropping in to settle above it with a small bounce. Static shot, slight camera breathing. Deep forest green shadows shifting to vibrant emerald green highlights, warm amber accents, soft film grain. Confident, clean, satisfying mood. Photorealistic 3D product render.
A soft mechanical click as the racket locks in, then a light ball bounce and a warm chime.
```

### F2 — Cierre hablado
```
Eye-level medium shot of Lucía, a 29-year-old Spanish woman with a lean athletic build, long dark hair tied in a high ponytail, sharp defined cheekbones, bright hazel eyes, and a small mole on her right cheek. Her voice is clear, bright, energetic, with crisp articulation. She tosses a padel ball up, catches it, and looks straight into the lens. Static shot. Telephoto lens, shallow depth of field, blurred green court behind. Bright natural daylight with warm amber rim light, confident and inviting mood. Photorealistic vertical smartphone video look.
A single ball catch in the palm, ambient court sounds.
She says, speaking in Spanish (Spain): Encuentra tu pala ideal. Smashly punto es.
```

---

## Montajes sugeridos (8 s por clip)

| Ad | Clips | Ángulo |
|---|---|---|
| "Trescientos euros" | A1 → B1 → C4 → F2 | Ansiedad de compra |
| "Cinco minutos" | A3 → C2 → B3 → D1 | Ahorro y velocidad |
| "Datos, no opiniones" | B2 → C3 → D2 → F1 | Autoridad de datos |
| "Sin registro" | D3 → C1 → F1 | Fricción cero |
| Brand film | E2 → E3 → E1 → E4 → F1 | Marca pura, sin UI |

## Checklist antes de lanzar

- [ ] `aspectRatio: "9:16"`
- [ ] `durationSeconds: "8"` (obligatorio con 1080p)
- [ ] `personGeneration: "allow_adult"` (España / UE)
- [ ] Una sola escena en el prompt
- [ ] Cero comillas en el diálogo
- [ ] Audio en frases separadas
- [ ] `speaking in Spanish (Spain)` antes de cada línea
- [ ] Negative prompt descriptivo, sin "no" ni "don't"
- [ ] Mismo `seed` si el clip pertenece a una serie con personaje
- [ ] Descargar el .mp4 antes de 48 h
