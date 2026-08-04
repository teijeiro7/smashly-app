# Playbook de retención short-form para Smashly

TikTok / Reels / Shorts. El objetivo no es "hacer un vídeo bonito", es **que no hagan scroll en
el segundo 1 y que lleguen al final**. Todo lo demás es secundario.

---

## 1. Las tres métricas que mandan

El algoritmo de las tres plataformas optimiza esencialmente lo mismo:

| Métrica | Qué te dice | Umbral de "va bien" |
|---|---|---|
| **Retención a 3 s** | ¿El hook funciona? | >70% |
| **Completion rate** | ¿El vídeo cumple lo que prometió el hook? | >50% en 15–20 s |
| **Shares + saves** | ¿Merece la pena difundirlo? | shares > likes es señal de viral |

Los comentarios son más valiosos que los likes. Los saves indican que el contenido es lo bastante
útil para volver — y para un comparador de palas, **el save es la conversión emocional previa a
la visita**.

---

## 2. La regla de los 3 segundos

Tienes 3 segundos para detener el scroll. Cada vídeo necesita **tres hooks simultáneos**:

```
[HOOK VISUAL] + [HOOK VERBAL] + [TEXTO EN PANTALLA]
```

Los tres tienen que impactar en el **primer segundo**, no repartidos en los tres.

Para Smashly, en concreto:
- **Hook visual**: la pared de palas, la etiqueta de 300 €, la pala abandonada en el garaje, la
  pala rota, el codo vendado. Nunca empieces con el logo ni con la UI.
- **Hook verbal**: una frase de ≤7 palabras. Afirmación fuerte o pregunta incómoda.
- **Texto en pantalla**: 3–6 palabras, y **no idénticas al hook verbal** — decir lo mismo dos
  veces desperdicia uno de los tres canales. Que el texto añada la cifra o la contradicción.

**Ejemplo bien hecho:**
- Visual: mano cogiendo una pala de 300 € en la tienda
- Verbal: "Esta pala no es para ti."
- Texto: `300€ · nivel equivocado`

**Ejemplo mal hecho:** logo de Smashly + voz "Hola, somos Smashly, el comparador de palas" +
texto "Smashly". Cero de tres.

---

## 3. Estructuras por duración

**Problema-Solución (15–20 s) — el caballo de batalla para Smashly**
```
[0-3s]   Hook: el problema, con cifra
[3-8s]   Agitar: por qué te va a doler
[8-16s]  Solución: qué hace Smashly, mostrado no contado
[16-20s] CTA
```

**Lista (25–35 s) — el mejor formato para saves**
```
[0-3s]   Hook: "3 cosas que miras mal al comprar una pala"
[3-28s]  Ítems: uno cada 6-8 s, cada uno con su visual
[28-35s] CTA
```

**Tutorial / demo (20–30 s) — el mejor para conversión**
```
[0-3s]   Hook: muestra el RESULTADO primero (la pala recomendada, el precio más bajo)
[3-8s]   "Así lo hice en 40 segundos"
[8-25s]  Pasos rápidos y claros
[25-30s] Resultado + CTA
```

**POV / skit (15–25 s) — el mejor para shares en el nicho de pádel**
```
[0-3s]   Setup: texto en pantalla monta la escena ("POV: llevas 2 años con la pala equivocada")
[3-20s]  Actuación de la situación reconocible
[20-25s] Punchline o giro
```

**Arco narrativo (40–55 s) — solo cuando tengas testimonios reales**
```
[0-3s]   Hook: adelanta el resultado
[3-15s]  Setup y lo que estaba en juego
[15-40s] Qué pasó
[40-50s] Resultado
[50-55s] Lección / CTA
```

### Traducción a clips de Flow
Los clips de Flow son de 8 s (10 s en Omni Flash). Un vídeo de 20 s = **3 beats**. Uno de 30 s =
**4 beats**. Los beats de la estructura tienen que caer en fronteras de clip — por eso los
guiones de `scripts-shortform.md` están escritos ya en beats de 8 s.

---

## 3.5. El contrato de continuidad

Esto es lo que más se falla y lo que más caro sale. Como ningún clip pasa de 8-10 segundos,
**cualquier vídeo de más de 8 s es un montaje**, y el montaje es el producto. Si cada beat
cambia de persona, de sitio y de luz, el espectador no ve un vídeo: ve tres anuncios pegados,
y se va justo en la costura.

Un vídeo multi-beat tiene que cumplir **las cuatro**:

| | Regla |
|---|---|
| **Personaje** | El mismo `@Character` en todos los beats donde aparezca alguien. Nunca cambies de actor a media pieza |
| **Escenario** | La misma localización. Si es un banco al atardecer, es ese banco los 24 segundos |
| **Ambiente** | La misma luz, la misma hora, la misma paleta, el mismo grado de grano |
| **Objeto** | Un objeto físico que viaje entre beats: la pala, la pelota, el móvil. Es el hilo que cose el montaje |

### Y encima, encadena los frames
Flow tiene la herramienta exacta para esto y hay que usarla siempre:

```
beat 1 → Save frame del último fotograma → beat 2 en Frames to Video: First con ese frame
       → Save frame → beat 3 …
```

Así el beat 2 **empieza literalmente donde acabó el 1**. No hay corte, hay continuación. Y el
prompt del beat 2 pasa a ser **solo de movimiento** ("la cámara baja del rostro a la pala"),
que además es lo que Google recomienda para image-to-video.

### El grade unifica lo que la generación no
Aunque encadenes, los beats vienen de generaciones distintas y la luz baila un poco. Un grade
común aplicado a todo iguala el resultado: `--grade brand` en `scripts/video-post/`.

### Cómo enseñar la UI sin romper el mundo
Cortar de una escena real a un pantallazo a toda pantalla es la rotura más habitual. Dos
salidas, en orden de preferencia:

1. **La UI dentro de la escena.** Que el personaje levante el móvil en plano, sujeto y
   paralelo al encuadre, con la pantalla apagada; la captura real se pega encima en post con
   `--screen-insert`. Nunca sales de la escena y la UI sigue siendo real.
2. **Corte motivado.** Si tiene que ser pantalla completa, que el beat anterior acabe con el
   personaje mirando el móvil. Un corte a lo que el personaje mira es gramática de cine
   normal y no se siente como un salto — pero grada la UI igual que el resto.

### El test de los 3 fotogramas
Saca un frame de cada beat y ponlos en fila. Si un desconocido no diría que son de la misma
pieza, el montaje no funciona. Da igual lo bueno que sea cada clip por separado.

---

## 4. Librería de hooks para pádel (español, listos para locutar)

Todos ≤9 palabras. Los marcados con ⚡ son los que apostaría primero.

### Pérdida / miedo (mejor retención a 3 s)
- ⚡ "Llevas dos años jugando con la pala equivocada."
- ⚡ "Esa pala te está destrozando el codo."
- "Trescientos euros. Y no era tu pala."
- "El 80% compra la pala por la marca. Error."
- "Si tienes codo de tenista, la culpa es de tu pala."
- "Tu pala pesa 15 gramos más de lo que deberías."

### Curiosidad
- ⚡ "Hay un dato en tu pala que nadie mira."
- "Nadie te cuenta esto antes de comprar una pala."
- "Probé 800 palas. Solo 6 valen para ti."
- "¿Por qué la pala del pro no te sirve?"
- "La misma pala, 60 euros de diferencia según la tienda."

### Contrarian (mejor para comentarios)
- ⚡ "Opinión impopular: la pala de Coello no es para ti."
- "Las palas de carbono 18K están sobrevaloradas."
- "Deja de comprar por marca. Compra por balance."
- "Gastar más no te hace jugar mejor. Los datos lo dicen."

### Valor / promesa (mejor para saves)
- ⚡ "Cómo elegir pala en 3 minutos sin saber de palas."
- "Tres datos que decides antes de mirar precio."
- "Todo lo que necesitas saber de balance en 30 segundos."
- "Cómo saber si una pala es de control o de potencia."

### Prueba / demostración (mejor para conversión)
- ⚡ "Mira lo que pasa cuando comparo 800 palas."
- "Le pedí a una IA que eligiera mi pala. Esto salió."
- "Encontré la misma pala 60 euros más barata. Así."

### Regla de test
No pruebes vídeos, **prueba hooks**. Mismo cuerpo, tres aperturas distintas. Si cinco vídeos
seguidos bajan del 1% de completion, el problema son los hooks, no el contenido.

---

## 5. Subtítulos: obligatorios

Suben el watch time entre un **25% y un 40%**. La mayoría del consumo es sin sonido.
Flow **no genera subtítulos**, así que se hacen en CapCut.

Reglas:
- **Máximo 2 líneas** en pantalla a la vez
- **3–5 palabras por línea**
- Sans-serif bold con contorno negro. En la marca: blanco con contorno, y la palabra clave en
  **ámbar #d97706**
- **Resalta la palabra clave** de cada frase en otro color
- Timing exacto al habla, palabra a palabra
- **Mantén los subtítulos lejos de la zona del watermark de Flow** y de la UI de la plataforma
  (los primeros y últimos ~15% de alto)

---

## 6. Audio

- **Sonido original** para todo lo educativo, demos y testimonios. Es lo que construye voz de marca.
- **Sonido en tendencia** solo cuando encaje de verdad con el mensaje y esté en subida, no en
  declive. En el nicho de pádel el audio de tendencia rinde bien en formato POV/skit.
- Veo genera **audio nativo**: SFX y ambiente de pista salen muy bien (impactos de bola, chirrido
  de zapatillas, reverb de pista indoor). Aprovéchalo — es diferencial frente al competidor que
  monta con stock.
- Habla ligeramente **más rápido** que en conversación normal. Varía el tono. Pausa en lo importante.
- Baja la música bajo la voz (ducking).

---

## 7. Errores que matan la retención

1. **Hook lento.** Nada de construir hacia el punto. El punto va primero.
2. **Empezar por el logo o la marca.** Cero interés. La marca va al final, o en el subtítulo.
3. **Sin texto en pantalla.** Pierdes a todo el que ve sin sonido.
4. **Audio malo.** Mata la retención al instante, más que un visual mediocre.
5. **Demasiado largo.** Si se puede contar más corto, córtalo.
6. **Sin CTA.** Di exactamente qué hacer.
7. **Ignorar comentarios.** El engagement de la primera hora condiciona la distribución.
8. **Mostrar la UI demasiado pronto.** El interfaz no es un hook — es la prueba. Va en el tercio central.

---

## 8. Cadencia y calendario

| Objetivo | Mínimo | Óptimo |
|---|---|---|
| Crecer | 1/día | 2–4/día |
| Mantener | 3/semana | 1/día |
| Testear | 2/semana | 5/semana |

**Realidad de Smashly**: con plan Pro de Flow tienes para ~6–12 vídeos al mes si todo se genera
con IA (ver la matemática de créditos en `flow-playbook.md` §5c). Eso no da para 1/día.

Estrategia recomendada: **mezcla**. 2–3 vídeos IA al mes como piezas ancla (los b-roll cinemáticos
y los POV, que es donde Flow gana), y el resto en screen recording de la app + voz en off, que es
gratis, ilimitado y además convierte mejor porque es prueba real del producto. Los vídeos de Flow
te dan la identidad visual; los screen recordings te dan el volumen.

Horarios de publicación de partida (luego mide con tus datos):
TikTok 7–9h, 12–15h, 19–23h · Reels 9h, 12h, 19–21h · Shorts 12–15h, 19–21h.

**Nota de nicho**: el pádel tiene un patrón de consumo propio — los picos reales están **antes y
después de las horas de pista**, es decir a primera hora y de 21h a medianoche. Empieza por
19–23h y valida.

---

## 9. Pilares de contenido para Smashly

| Pilar | % | Qué es | Formato |
|---|---|---|---|
| Educativo técnico | 35% | Balance, forma, núcleo, peso explicados en 20 s | Lista, tutorial |
| Prueba de producto | 25% | Demo del comparador y del recomendador | Tutorial, demo |
| Relatable / nicho | 20% | POV de jugador de pádel, situaciones reconocibles | POV/skit |
| Datos y contrarian | 15% | "Los datos dicen que…", mitos derribados | Contrarian |
| Marca | 5% | B-roll cinemático, brand film | B-roll |

Los tres primeros son los que tiran del crecimiento. El pilar de marca es el que justifica gastar
créditos de Veo 3.1 Quality.

---

## 10. Qué testear, en este orden

1. **Hooks** — mismo cuerpo, aperturas distintas. Es el 80% del resultado.
2. **Duración** — 15 s vs 25 s vs 35 s
3. **Formato** — POV vs tutorial vs lista
4. **CTA** — "link en bio" vs "busca Smashly" vs "guárdalo para cuando compres"
5. **Horario**

### Cuándo pivotar
- 5+ vídeos con completion <1% → cambia los hooks
- Muchas views, pocos follows → el CTA o el encaje contenido-audiencia falla
- Muchos saves, pocos shares → el contenido es útil pero no social: añade opinión o conflicto
- Muchos comentarios negativos → o doblas la apuesta en la controversia, o ajustas el tono

---

## 11. CTAs, de menor a mayor fricción

Usa el de menor fricción que aún sirva al objetivo.

1. "Guárdalo para cuando vayas a comprar." — el mejor para saves, y para Smashly el más honesto:
   el usuario compra pala una vez al año
2. "Comenta tu nivel y te digo qué forma te toca." — máximo engagement, y genera research gratis
3. "Busca Smashly en Google." — sin link, funciona en TikTok donde los links penalizan
4. "Link en bio, es gratis y sin registro." — el más directo. Apóyalo en "sin registro", que es
   el desbloqueo de objeción real

Nunca acumules dos CTAs. Uno por vídeo.
