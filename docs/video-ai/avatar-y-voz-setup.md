# Setup del avatar y la voz de marca personal

Se hace **una sola vez** y sirve para todos los vídeos. Reserva 60–90 minutos.

---

## 1. Una corrección importante antes de empezar

**Flow no clona tu voz desde una muestra de audio.** Lo que Flow ofrece son *Custom Voices*:
eliges una **Base Voice** del catálogo y describes cómo debe sonar en un campo de texto
("Voice Performance"). Es dirección de voz, no clonación. Además las referencias de voz **solo
funcionan con Gemini Omni Flash + Ingredients** — en cualquier otra generación da error.

Si quieres **tu voz de verdad**, hay que clonarla fuera de Flow (ElevenLabs u equivalente) y
aplicarla en CapCut sobre los clips. Que resulta ser, además, la opción técnicamente mejor:
controlas el timing al milisegundo y puedes hablar más rápido de lo que Veo permite. Es la
"opción B" de `scripts-shortform.md`.

Lo que Flow **sí** te da de ti mismo es la **imagen**: el avatar `@me` (se crea desde tu foto de
perfil escaneando un QR con el móvil) o un Character construido a partir de 1–2 fotos tuyas.

---

## 2. Mi recomendación: invierte el énfasis

Tu plan es razonable, pero yo cambiaría el peso de las dos piezas.

**La voz es el activo de marca personal duradero. La cara es la pieza arriesgada.**

Por qué:

- **El valle inquietante te cuesta exactamente los 3 segundos que más necesitas.** Un plano
  medio-corto de una cara casi-real hablando es donde el espectador nota que algo va raro. No sabe
  qué, pero desconfía — y desconfiar en el segundo 1 es scroll. Un avatar en un plano de acción o
  ambiental pasa desapercibido; en talking-head frontal de 8 segundos, no.
- **El watermark "made with Veo" sobre tu propia cara** lee peor que sobre un plano de producto.
  Está literalmente etiquetando tu identidad como generada.
- **La audiencia perdona al creador sin cara con voz reconocible; castiga a la cara casi-real.**
  Todo el nicho faceless de pádel en TikTok funciona con manos, pista y voz en off.
- **La voz escala a todos los formatos.** Tu voz clonada funciona igual sobre b-roll de Flow, sobre
  un screen recording de la app o sobre un carrusel. El avatar solo funciona en clips generados.

**Reparto que propongo:**

| Formato | % del contenido | Marca personal presente vía |
|---|---|---|
| Faceless: manos, pala, pista, UI | ~80% | **Tu voz clonada** |
| Avatar `@Cris` en cámara | ~20% | Voz + cara, en piezas de fundador |

Es decir: **el avatar no es tu presentador habitual, es tu firma.** Sale en el vídeo de origen,
en algún anuncio de feature y en el vídeo fijado del perfil. El resto del tiempo eres una voz.

### Y una cosa más: cuéntalo
"No me gusta salir en cámara, así que me he hecho un avatar y he clonado mi voz" **es contenido**.
En una cuenta de un producto con IA, esa transparencia genera comentarios y te posiciona como el
tipo técnico que construyó la herramienta. Ocultarlo, además de ser peor estrategia, es
innecesario: Meta y TikTok etiquetan la media generada por IA de todos modos. Dilo tú primero.

---

## 3. Crear el Character `@Cris` en Flow

Flow construye el parecido a partir de **fotos reales**, así que la calidad de las fotos manda
mucho más que la descripción de texto.

### Fotos a preparar (2 es el máximo que acepta, y conviene usar las 2)
1. **Frontal, plano medio corto**, cara neutra sin sonreír, fondo liso, luz suave y frontal (una
   ventana de frente es perfecto). Sin gafas de sol, sin gorra, sin nada que tape la cara.
2. **Tres cuartos o perfil suave**, misma ropa, misma luz. Le da al modelo volumen facial.

Ponte en las dos fotos la **ropa que quieras que sea tu uniforme de marca**: camiseta técnica
verde oscuro o blanca lisa. Sin logos de otras marcas. Esa ropa quedará fijada en el Character.

### Pasos
1. Barra izquierda → **Characters** → **New Character**
2. Sube las 2 fotos
3. **Nombre**: `Cris` (así lo invocas con `@Cris`)
4. **Descripción** — rellena los huecos con tus rasgos reales. Los rasgos deben ser
   **inmutables**: no describas expresión ni pose, solo lo que no cambia.

```
A [EDAD]-year-old Spanish man with a [complexión: lean / athletic / regular] build, [color y largo de pelo] hair worn [peinado], [con o sin barba y cómo], [color y forma de ojos] eyes, [rasgo distintivo: lunar, cicatriz, gafas, mandíbula marcada…]. He wears a plain dark green technical padel t-shirt.
```

5. **Voz**: elige una Base Voice masculina de rango medio y en Voice Performance escribe:
```
Warm, mid-range, calm and measured, natural conversational pace, Spanish from Spain accent, slightly understated — sounds like someone explaining something to a friend, not presenting.
```
Esta voz de Flow es tu **plan B** para los clips donde el avatar habla en cámara. La voz buena
(la clonada) va por CapCut.

6. **Sync** → **Save New Voice** → guarda el Character.

### Alternativa: `@me`
Flow permite crear un avatar directamente desde tu foto de perfil: **Create avatar → Get started →
escanear el QR con el móvil**. Es más rápido pero te da menos control sobre la ropa y el encuadre.
Si vas a usar el avatar en el 20% del contenido, merece la pena hacer el Character bien con fotos
preparadas.

### Regla de uso del avatar
Para minimizar el valle inquietante:
- **Plano medio, nunca primer plano frontal cerrado.** Que se vea torso y entorno.
- **Cara parcialmente girada** o en tres cuartos, no mirando fijamente al objetivo los 8 segundos.
- **Luz lateral o contraluz suave**, no luz plana frontal. Las sombras esconden los artefactos.
- **Frases cortas**: ≤10 palabras por clip. Menos lip-sync, menos superficie de fallo.
- **Entorno real**: pista de pádel, banco, pared de cristal. Nunca fondo neutro de estudio — el
  fondo vacío concentra toda la atención en la cara.
- **Movimiento**: que el avatar esté haciendo algo (girar una pala, levantar la vista) en lugar de
  solo hablar.

---

## 4. Clonar tu voz (ElevenLabs)

Esto es lo que de verdad construye tu marca personal.

1. **Graba la muestra**: 2–3 minutos leyendo en voz alta, en tu tono natural de explicar algo, no
   de locutar. Móvil pegado a la boca en una habitación con cosas blandas (armario abierto,
   cortinas, sofá). Sin música, sin eco, sin ruido de fondo. Un solo take continuo es mejor que
   varios cortes.
   - Truco: lee en voz alta el copy de tu propia home (`docs/video-ai/smashly-brand-video.md` §3).
     Así la muestra ya tiene el vocabulario del producto: pala, balance, núcleo, dureza.
2. **Instant Voice Clone** en ElevenLabs con esa muestra. Nómbrala `Cris — Smashly`.
3. **Ajustes de partida** para short-form: Stability media-baja (más expresiva), Similarity alta,
   Style ligero. Speed ligeramente por encima de 1.0 — en short-form se habla más rápido de lo
   normal.
4. **Guarda un preset** y no lo toques más. La consistencia de voz entre vídeos es parte de la marca.

### Flujo de VO
```
Escribes el VO del beat  →  ElevenLabs con el preset  →  descargas el mp3
→  CapCut: lo pones sobre el clip de Flow  →  subtítulos automáticos ajustados a mano
→  bajas el audio nativo de Veo a ~20% (para conservar los SFX de pista) y el VO al 100%
```

Ese último paso importa: **no silencies el audio de Veo.** Los impactos de bola, el chirrido de
zapatillas y el reverb de pista indoor que genera Veo son lo que hace que el vídeo suene a pádel
real. Déjalos de fondo bajo tu voz.

---

## 5. Checklist de setup (una vez)

- [ ] 2 fotos preparadas: frontal + tres cuartos, misma ropa, luz de ventana, fondo liso
- [ ] Character `@Cris` creado en Flow con descripción de rasgos inmutables
- [ ] Voz de Flow asignada al Character (plan B para diálogo en cámara)
- [ ] Muestra de audio de 2–3 min grabada leyendo el copy de la home
- [ ] Voz `Cris — Smashly` clonada en ElevenLabs, preset guardado
- [ ] Character `@Marcos` creado también (el jugador amateur genérico, para los POV donde no
      quieres que salgas tú) — descripción en la skill o en `flow-playbook.md`
- [ ] Collection creada en Flow: `Smashly / vídeos`
- [ ] CapCut instalado, plantilla de subtítulos guardada: sans bold, blanco con contorno negro,
      palabra clave en ámbar `#d97706`, máx. 2 líneas de 3–5 palabras
- [ ] Decidido dónde va la etiqueta de contenido IA en cada plataforma

Con esto hecho, cada vídeo nuevo son ~40 minutos: generar 3 beats, montar, locutar, subtitular.
