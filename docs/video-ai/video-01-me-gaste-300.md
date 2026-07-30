# Vídeo 1 · "Me gasté 300 euros en la pala equivocada"

El primero de la cuenta. Historia de fundador con hook de dolor — el formato que mejor funciona
para un producto construido por una persona, porque el hook funciona en frío (no necesitas que
nadie sepa quién eres) y el cuerpo construye la marca personal.

| | |
|---|---|
| **Formato** | Problema-Solución (fundador) |
| **Duración** | 24 s · 3 beats de 8 s |
| **Plataformas** | TikTok, Reels, Shorts · 9:16 |
| **Pilar** | Marca personal + prueba de producto |
| **Hook** | Pérdida, con cifra |
| **CTA** | Comentario (máximo engagement, y es el objetivo del vídeo 1: activar la cuenta) |
| **Voz** | Beat 1 avatar en cámara (voz de Flow o VO clonada) · Beats 2 y 3 VO clonada sobre faceless |
| **Coste** | ~120 créditos |
| **Aparición del avatar** | Solo beat 1 y 3 últimos segundos. Beat 2 entero faceless |

**Por qué así**: los tres beats ocurren **en el mismo banco, a la misma hora, con la misma pala**,
y cada uno arranca en el último fotograma del anterior. No son tres planos, es un plano de 24
segundos partido en tres generaciones. Ese es el contrato de continuidad de
`retention-playbook.md` §3.5, y con clips de 8 segundos es lo que separa un vídeo de tres
anuncios pegados.

La cara del avatar solo se ve de frente en el beat 1; en el 2 y el 3 la cámara ya está en las
manos y en el móvil, que es donde el valle inquietante no existe. Y la UI real no aparece como
pantallazo a toda pantalla: se pega dentro de la pantalla del móvil que él sostiene, así nunca
sales de la escena.

Requisito previo: `avatar-y-voz-setup.md` hecho.

---

## Beat 1 · 0–8 s — el error

**Modo**: Ingredients to Video (usa `@Cris`) · **Modelo**: Lite para borrador → Fast para el final

> El prompt de este beat y de los siguientes está en ficheros aparte listos para pegar:
> `produccion/video-01/beat{1,2,3}-prompt.txt`. Lo de abajo es la versión comentada.

**PROMPT**
```
Eye-level medium shot of @Cris sitting on a bench at the edge of an empty outdoor padel court at dusk, a padel racket resting across his knees. He turns the racket over once, looks up from it into the lens, and gives a small resigned shrug. Static shot, no camera motion. Telephoto lens, shallow depth of field, the court blurred behind him. Low-key light with a warm amber rim from a single court floodlight, deep forest green shadows, honest and slightly self-deprecating mood. Photorealistic vertical smartphone video look, soft film grain.
Distant ball impacts from another court, a light evening breeze.
@Cris says, speaking in Spanish (Spain): Me gasté trescientos euros en la pala equivocada.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```

- **HOOK VISUAL** · un tío solo en una pista vacía al atardecer con una pala en las rodillas: derrota reconocible al instante
- **HOOK VERBAL** · "Me gasté trescientos euros en la pala equivocada."
- **TEXTO EN PANTALLA** · `300€ · pala equivocada` — *aparece en el frame 1, no en el 0:02*

**Nota de dirección**: la frase son 8 palabras, dentro del límite. Plano medio, cara girándose
hacia el objetivo (no fija desde el inicio), luz lateral. Los tres factores que reducen el valle
inquietante están puestos a propósito.

**QC**: revisa los últimos 2 s frame a frame (`Shift+→`). Si aparece deriva facial, recorta antes
o regenera. Es el clip más crítico del vídeo: si la cara falla aquí, no hay vídeo.

---

## Beat 2 · 8–16 s — por qué pasó (misma escena, tu voz)

**Modo**: **Frames to Video: First** · **Start frame**: `Save frame` del último fotograma del beat 1
**Modelo**: Lite → Fast

Prompt **solo de movimiento**: no se re-describe nada, porque todo está ya en el frame inicial.
Eso garantiza que el banco, la luz, la ropa y la pala son exactamente los mismos.

**PROMPT**
```
The camera tilts down from the subject's face to the racket resting across his knees. His thumb slides slowly along the throat of the racket toward the head and stops partway. He holds it there. Everything else holds still.
The evening breeze continues, one distant ball impact, the soft scuff of a thumb on carbon.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```

**TEXTO EN PANTALLA** · `la marca no te dice nada` → cambia a → `el balance sí`

El gesto del pulgar recorriendo el puente hasta el punto de balance **es** la explicación visual
de lo que dice la voz. No hace falta un gráfico: la mano señala el dato.

**VO (voz clonada, ElevenLabs)**
> "La compré por la marca. Nadie me dijo que el balance decidía si me iba a doler el codo. Ni que había el mismo modelo sesenta euros más barato en otra tienda."

⏱️ ~11 s de locución hablada rápido. **Excede los 8 s del clip** — esto es intencionado: en CapCut
recortas el beat 2 y dejas que el VO se solape sobre el inicio del beat 3. Encadenar voz por encima
del corte visual **sube el completion rate**, porque el espectador no tiene un punto natural de
salida. No cortes la voz en la frontera del clip.

---

## Beat 3 · 16–24 s — qué construí + CTA

**Modo**: **Frames to Video: First** · **Start frame**: `Save frame` del último fotograma del beat 2
**Modelo**: Lite → Fast

La UI real **no** entra como pantallazo a toda pantalla: entra dentro de la pantalla del móvil
que él sostiene, pegada en post con `--screen-insert`. Por eso el prompt pide el móvil
**sujeto, plano y paralelo al encuadre, con la pantalla apagada** — es lo que hace que el
rectángulo de la captura encaje sin deformarse.

**PROMPT**
```
The subject lays the racket down on the bench beside him and raises a phone into the centre of the frame with both hands, holding it steady, flat and parallel to the frame, the screen facing the lens. The phone screen is dark and blank. Slow dolly in on the phone. He holds it completely still.
The evening breeze continues, the soft click of a racket set down on wood.
Everything visible now is the only thing that ever appears; the composition stays as it is. No text overlays, no logos, no watermarks, no extra people.
```

Las coordenadas del rectángulo se miden una vez con `./build.sh grid` y se escriben en
`screen.json`. Si el móvil sale girado o inestable, regenera el clip: es más barato que pelearse
con la perspectiva en post.

**TEXTO EN PANTALLA** · `800 palas · gratis · sin registro` → último segundo: `¿tú también? 👇`

**VO (voz clonada)**
> "Así que me puse a comparar ochocientas palas con sus datos reales. Y salió esto. Cuéntame en comentarios qué pala tienes y te digo si es la tuya."

**Cierre en CapCut** (no en Flow): último 1,5 s, logo Smashly sobre verde `#0f2818` +
`smashly-app.es`. Sin voz. Deja que el chime cierre.

---

## Producción paso a paso

```
1. Flow → nuevo proyecto, Collection "Smashly / vídeos"
2. Beat 1 en LITE, 8s, vertical, Ingredients con @Cris.
   Genera 2-3 versiones hasta que la cara aguante. (20-30 cr)
3. Save frame del último fotograma del beat 1
4. Beat 2 en LITE, Frames to Video: First con ese frame. (20 cr)
5. Save frame del último fotograma del beat 2
6. Beat 3 en LITE, Frames to Video: First con ese frame. (20 cr)
   Comprueba que el móvil queda frontal y quieto; si no, regenera
7. Los tres aprobados → regenera en FAST, reencadenando los frames. (60 cr)
8. Upscale 1080p (gratis en Pro)
9. Descarga los 3 clips como beat1.mp4, beat2.mp4, beat3.mp4
   (no hace falta Scenebuilder: el montaje lo hace el script)
10. ElevenLabs: locuta el VO con el preset "Cris — Smashly"
11. Medir la pantalla del móvil una vez y anotarla en screen.json:

    cd docs/video-ai/produccion/video-01
    ./build.sh grid

12. Montar todo en un comando:

    ./build.sh rough    # un formato, rápido, para revisar
    ./build.sh          # los 4 formatos, calidad final

    Hace el concat, recorta el watermark, pega la UI real en la pantalla del
    móvil, mezcla el VO con el audio nativo de Veo al 20% con ducking, normaliza
    a -16 LUFS / TP -1.5, aplica el grade común, quema los subtítulos word-level
    y los textos en pantalla, añade la tarjeta de cierre y exporta los 4 formatos.

    `--crop-bias 0.35` importa aquí: hay una cara en el beat 1 y con 0.5 el
    recorte a 4:5 le corta la frente.

13. Revisa out/video-01/transcripcion.txt contra vo.txt antes de publicar
```

**Cero CapCut.** Los textos en pantalla van en `overlays.json` y el cierre lo genera
`make_outro.py`.

**Coste total**: ~120 créditos de tu cuota de 1.000.

---

## Copy del post

### TikTok
```
Me gasté 300€ en la pala equivocada y monté esto para que no te pase a ti 🎾

Comparador de +800 palas con datos reales: peso, balance, forma, materiales y precio en tiempo real en las principales tiendas.

Gratis y sin registro. Está en mi bio.

Cuéntame qué pala tienes 👇

#padel #palasdepadel #padelespaña #padeltips #padellovers #comparadorpalas #padelamateur
```

### Instagram Reels
```
Me gasté 300€ en la pala equivocada.

La compré por la marca. Nadie me explicó que el balance decide si te va a doler el codo, ni que el mismo modelo estaba 60€ más barato en otra tienda.

Así que comparé +800 palas con sus datos técnicos y monté Smashly: peso, balance, forma, núcleo y precio en tiempo real de todas.

Gratis. Sin registro. Link en bio.

👉 ¿Qué pala tienes? Dímelo en comentarios y te digo si es la tuya.

#padel #palasdepadel #padelespaña #padeltips #padeladdict #padelamateur #comparadordepalas #padelmadrid
```

### YouTube Shorts
Título (los Shorts se buscan, aprovecha el SEO):
```
Me gasté 300€ en la pala de pádel equivocada | Cómo elegir bien
```
Descripción:
```
Comparador gratuito de +800 palas de pádel con datos reales y precios en tiempo real: https://smashly-app.es

Peso, balance, forma, núcleo, dureza y el precio más bajo entre las principales tiendas. Sin registro.

#padel #palasdepadel #padeltips
```

### Etiqueta de contenido IA
Márcalo en el toggle de contenido generado por IA de cada plataforma. Y considera un comentario
fijado tú mismo:
> "El personaje del vídeo es un avatar y la voz está clonada — no me gusta salir en cámara pero
> quería contarlo yo. Todo lo demás (los datos, las 800 palas) es real."

Esto convierte una posible objeción en tu primer hilo de comentarios.

---

## Variantes de hook para A/B

Regenera **solo el beat 1** (10–20 créditos en Lite) y deja los beats 2 y 3 intactos. Publica en
días distintos, misma hora.

| Var. | Frase del beat 1 | Texto en pantalla | Apuesta |
|---|---|---|---|
| **A** | "Me gasté trescientos euros en la pala equivocada." | `300€ · pala equivocada` | Pérdida + cifra. La del guion |
| **B** | "Esta pala me destrozó el codo durante un año." | `1 año de codo` | Dolor físico. Suele batir al dinero en pádel |
| **C** | "Compré la pala por la marca. Error." | `compré por la marca` | Más corta y más contrarian. Mejor para comentarios |

Si el completion rate del vídeo es bueno pero la retención a 3 s es baja, el problema es el beat 1
y estas variantes lo arreglan. Si la retención a 3 s es buena y el completion malo, el problema es
el beat 2 — recórtalo más.

---

## Qué medir a las 48 h

| Métrica | Bien | A revisar |
|---|---|---|
| Retención 3 s | >70% | <55% → prueba variante B o C |
| Completion | >50% | <35% → recorta a 18-20 s |
| Comentarios | >15 | <5 → el CTA no está claro o falta el comentario fijado |
| Saves | cualquiera | son bonus: este vídeo persigue comentarios, no saves |

No mires los seguidores en las primeras 48 h. Con un vídeo no se concluye nada: el dato útil sale
al tercer o cuarto.

---

## Y luego qué

Una vez publicado este:

1. **Vídeo 2** → `#7 "El dato que nadie mira"` de `scripts-shortform.md`. 80 créditos, 2 beats,
   faceless entero. Valida si el ángulo educativo tira sin depender de tu cara.
2. **Vídeo 3** → `#3 "Tres datos antes del precio"`. La apuesta de saves.
3. Entre medias, screen recordings de la app con tu voz clonada: coste cero e ilimitados.

El avatar no vuelve a salir hasta el vídeo 5 o 6, o hasta que anuncies una feature. Es tu firma,
no tu presentador.
