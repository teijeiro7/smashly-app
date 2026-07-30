# Vídeo con IA para Smashly

Documentación para producir vídeos de marketing de Smashly con los modelos de vídeo de Google.

## Por dónde empezar

**Empieza aquí (producción en Google Flow):**

0. `avatar-y-voz-setup.md` — **setup de una sola vez**: el Character `@Cris` con tu parecido y la voz clonada. Ojo: Flow no clona voz desde audio, eso va por ElevenLabs. Incluye por qué el avatar debe ser tu firma y no tu presentador.
1. `video-01-me-gaste-300.md` — **el primer vídeo, listo para producir.** Guion beat a beat, prompts, subtítulos, copy y hashtags por plataforma, variantes de hook y qué medir.
2. `flow-playbook.md` — cómo funciona Flow, qué tiene y qué no, la matemática de créditos y las tres restricciones que condicionan todo (watermark, EEA, cuota).
3. `retention-playbook.md` — la regla de los 3 segundos, estructuras por duración, librería de hooks en español para pádel, subtítulos, cadencia y qué testear.
4. `scripts-shortform.md` — los 8 guiones siguientes, con el plan de producción del primer mes.

**Post-producción (sustituye el trabajo manual de CapCut):**

- `../../scripts/video-post/` — coge los clips de Flow y en un comando hace concat, recorte del watermark, mezcla del VO con el audio nativo, normalización EBU R128 a -16 LUFS, subtítulos word-level con resaltado en ámbar de marca, y export a cada perfil de plataforma sin deformar.

**Si vas por la API de Veo:**

- `veo-reference.md` — taxonomía completa, parámetros exactos, límites por modelo, 20 errores comunes.
- `prompts-ads-9-16.md` — biblioteca de ~20 planos individuales.
- `generate_video.py` — script CLI para generar y descargar.

**Contexto transversal:**

- `smashly-brand-video.md` — paleta hex, tipografía, tono de voz, copy literal, ángulos narrativos, screenshots disponibles.

## Los cuatro modelos en juego

| Modelo | Dónde | Para qué |
|---|---|---|
| **Veo 3.1** (Lite / Fast / Quality) | Flow y API | El caballo de batalla. Audio nativo. |
| **Gemini Omni Flash** | **Solo Flow** | Clips de 10 s, referencias de voz, avatares, edición conversacional. |
| **Nano Banana Pro / 2** | Flow y API | Imágenes de partida para Frames to Video. |
| **Gemini** | gemini.google.com | Reescribir prompts y revisar el output contra brand guidelines. |

## La regla que resume todo

Itera en **Veo 3.1 Lite** (10 créditos), sube a **Fast** (20) solo cuando el prompt ya funciona,
y reserva **Quality** (100) para el brand film. Con 1.000 créditos al mes eso son ~7 vídeos;
todo en Quality serían 2.

## Sobre OpenMontage

Se evaluó [OpenMontage](https://github.com/calesthio/OpenMontage) como framework de
producción y se descartó como dependencia, por tres razones:

1. **Cero soporte de Google Flow.** Todo su acceso a Veo es por API de pago. Un vídeo de 3
   beats con 2 iteraciones cuesta ~19 $ por la Gemini API a 0,40 $/s, frente a 120 créditos
   (~2,40 €) de la suscripción de Flow que ya se paga. Unas 8 veces más caro por el mismo modelo.
2. **Inmadurez**: todas las herramientas están marcadas `EXPERIMENTAL` por sus autores, sin
   releases ni versionado, 96 PRs en cola con un solo mantenedor, y el resultado depende del
   LLM que lo ejecute (no es reproducible).
3. **No exporta varios aspect ratios en un solo run**, que es justo lo que hace falta aquí.

La licencia **AGPL-3.0** no era el bloqueante: usarlo como herramienta local de producción no
obliga a nada, la cláusula de red solo aplicaría si se integrase dentro de smashly-app como
funcionalidad servida.

Lo que sí se aprovechó, reimplementado de cero en `scripts/video-post/`: los presets de
`loudnorm` EBU R128, la tabla de perfiles de plataforma con sus límites reales, y el patrón de
subtítulos word-level con resaltado. Un punto a favor de la ruta API que sigue siendo válido:
**los vídeos generados por API no llevan watermark visible**, solo SynthID invisible. Si algún
día hay inversión en ads pagados, esa ruta vuelve a la mesa.

## Skill asociada

Existe una skill guardada, **`smashly-video-ads`**, que carga estas reglas automáticamente.
Pídele directamente un ad y saldrá con el flujo de Flow y la capa de retención aplicados.
