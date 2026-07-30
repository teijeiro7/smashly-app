# Sesión de producción · Vídeo 1

"Me gasté 300 euros en la pala equivocada" · 24 s · 3 beats · ~120 créditos de Flow

El guion completo, el razonamiento y el copy del post están en
`../../video-01-me-gaste-300.md`. Este directorio es solo la mesa de trabajo.

---

## Paso 0 · Setup (solo la primera vez)

Sigue `../../avatar-y-voz-setup.md`. Necesitas:

- [ ] Character **`@Cris`** creado en Flow con 2 fotos tuyas y una voz asignada
- [ ] Voz clonada **`Cris — Smashly`** en ElevenLabs, con preset guardado

Sin el Character, el prompt del beat 1 no funciona.

---

## Paso 1 · Generar los 3 clips en Flow, **en cadena**

Los tres beats son el mismo banco, la misma hora y la misma pala. Eso no se consigue
describiéndolo tres veces: se consigue **encadenando frames**. Cada beat arranca en el último
fotograma del anterior, así que el escenario, la luz y la ropa son idénticos por construcción.

Proyecto nuevo, vertical, **Veo 3.1 Lite** para los borradores (10 créditos cada uno).

| Beat | Modo de Flow | Prompt | Entrada |
|---|---|---|---|
| 1 | **Ingredients to Video** | `beat1-prompt.txt` | `@Cris` |
| 2 | **Frames to Video: First** | `beat2-prompt.txt` | `Save frame` del final del beat 1 |
| 3 | **Frames to Video: First** | `beat3-prompt.txt` | `Save frame` del final del beat 2 |

El orden importa: no puedes generar el beat 2 hasta tener aprobado el 1.

Los prompts de los beats 2 y 3 son **solo de movimiento** a propósito. No re-describas la
escena: ya está en el frame inicial, y repetirla confunde al modelo.

**QC antes de aceptar cada clip**, con `Shift+→` frame a frame:

- **Beat 1** — es el crítico. Si la cara se deforma en los últimos 2 s, regenera. Y comprueba
  que **acaba con la mirada bajando hacia la pala**: es el arranque del beat 2.
- **Beat 2** — que el pulgar recorra el puente y se pare. Un solo movimiento, sin deriva.
- **Beat 3** — que el móvil quede **frontal, quieto y paralelo al encuadre, con la pantalla
  apagada**. Si sale girado o tembloroso, regenera: pelearse con la perspectiva en post cuesta
  más que 10 créditos.

Cuando los tres funcionen, regenéralos en **Fast** (20 créditos) reencadenando los frames.

Descarga a este directorio como **`beat1.mp4`**, **`beat2.mp4`**, **`beat3.mp4`**.
No hace falta Scenebuilder: el montaje lo hace el script.

---

## Paso 2 · Locutar el VO

Copia el texto de **`vo.txt`** en ElevenLabs con el preset `Cris — Smashly` y descarga el
resultado aquí como **`vo.mp3`**.

Son ~19 segundos de locución para 16 segundos de imagen (beats 2 y 3). Es intencionado:
la voz monta por encima de los cortes visuales y eso elimina el punto natural de salida.
Habla rápido, como explicándoselo a un amigo, no locutando.

El beat 1 ya lleva su propia voz generada por Flow, así que **el VO empieza en el beat 2**.

---

## Paso 3 · Medir la pantalla del móvil (una vez)

La UI real se pega **dentro** de la pantalla del móvil del beat 3, para no salir de la escena.
Hay que decirle al script dónde está esa pantalla:

```bash
./build.sh grid
```

Abre `out/video-01/grid/grid_clip3.png` — lleva una rejilla de 100 px (fina) y 500 px (gruesa)
desde arriba a la izquierda. Mide el rectángulo de la pantalla y escribe `x`, `y`, `w`, `h` en
**`screen.json`**. Los valores que hay puestos son de ejemplo.

## Paso 4 · Montar

```bash
./build.sh rough    # 1 solo formato, rápido, para revisar
./build.sh          # los 4 formatos, calidad final
```

Salida en `out/video-01/`:

```
tiktok_1080x1920.mp4
reels_1080x1920.mp4
shorts_1080x1920.mp4
ig_4x5_1080x1350.mp4
transcripcion.txt
```

El script hace el concat, recorta el watermark, pega la UI en la pantalla del móvil, mezcla el
VO con el audio nativo de Veo al 20% con ducking, normaliza a -16 LUFS, aplica el grade `brand`
a todos los beats por igual, quema los subtítulos word-level y los textos de `overlays.json`,
añade la tarjeta de cierre y exporta cada formato. **Cero CapCut.**

### Ajustes que quizá tengas que tocar

- **`screen.json`** — las coordenadas de la pantalla del móvil (paso 3).
- **`--crop-watermark 40`** en `build.sh` — está a ojo. Mide en un frame del beat 1 crudo dónde
  acaba el watermark de Flow y ajústalo.
- **Timings de `overlays.json`** — calculados sobre 3 beats de 8 s exactos. Si algún clip sale
  más corto, corre los tiempos.

---

## Paso 5 · Verificar

- [ ] **El test de los 3 fotogramas**: saca un frame de cada beat y ponlos en fila. Si no
      parecen la misma pieza, el montaje no funciona — y eso se arregla en Flow, no en post
- [ ] La UI encaja dentro de la pantalla del móvil, sin sobresalir ni quedar corta
- [ ] `out/video-01/transcripcion.txt` coincide con `vo.txt` (si el ASR falla una palabra,
      añádela a `captions.DEFAULT_CORRECTIONS`)
- [ ] Un frame del segundo 1,5: overlay arriba y subtítulo abajo, ambos legibles
- [ ] El watermark ya no se ve
- [ ] El audio de pista se oye de fondo bajo la voz, no silenciado

---

## Paso 6 · Publicar

El copy por plataforma y los hashtags están en `../../video-01-me-gaste-300.md`.

- [ ] Activar la etiqueta de contenido generado por IA en cada plataforma
- [ ] Comentario fijado explicando el avatar y la voz clonada (está redactado en el guion)
- [ ] Publicar entre 19h y 23h
- [ ] Responder todos los comentarios de la primera hora

## Paso 7 · A las 48 h

| Métrica | Bien | A revisar |
|---|---|---|
| Retención 3 s | >70% | <55% → prueba la variante de hook B o C |
| Completion | >50% | <35% → recorta a 18-20 s |
| Comentarios | >15 | <5 → el CTA no está claro |

Las variantes de hook están en el guion. Regenerar solo el beat 1 en Lite cuesta 10
créditos y es la mejor inversión de todo el proceso.
