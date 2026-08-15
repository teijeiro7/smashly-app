# QA de usuario — Recomendaciones y Comparador de palas — 2026-08-13 / 2026-08-14

**Rama:** fix/qa-auth-login-findings (sesión ejecutada aquí; alcance no relacionado con login)
**Persona:** Carlos — jugador amateur/semi-profesional (primaria)
**Alcance:** `/best-racket` (wizard básico de recomendación → `RecommendationResult`), `/compare-rackets` (comparador de hasta 3 palas → `ComparisonTable`)

## Resumen

Auditoría inicial (2026-08-13) + sesión de `/implement` (2026-08-13/14) que arregló todos los hallazgos accionables.

**El hallazgo original más grave — el motor de IA estaba caído en producción (500 en `smashly-app.es`) — ya está arreglado y desplegado.** Causa raíz: `free-ai-api` (el gateway de IA propio, repo separado) añadió autenticación obligatoria y `smashly-app` nunca se migró. Se rotó el secret, se añadió la cabecera `Authorization`, y se confirmó en vivo con contenido real de IA: personalizado, coherente, con buena calidad de redacción.

**Corrección importante sobre el propio proceso de QA:** los hallazgos originales #3 y #4 ("los toasts de error nunca se ven") eran un **falso positivo** — se retractan. Verificado con un `MutationObserver` cronometrado: el toast sí aparece, se queda visible ~4s y se retira correctamente; los chequeos anteriores del DOM se hicieron en momentos mal calculados (antes de que la petición fallara, o después de que el toast ya hubiera desaparecido). Ver detalle en la sección "Hallazgos retractados".

**Todos los demás hallazgos reales (#2, #4b, #5, #6, #7, #8) están arreglados y re-verificados en vivo en el navegador.**

**Estado final: 6 de 6 hallazgos reales arreglados y verificados · 2 hallazgos retractados (falso positivo) · 0 pendientes de código** (solo quedan dos verificaciones externas: confirmar el deploy en `smashly-app.es`, y actualizar `LLM_API_KEY` en `durit-prospector`, otro consumidor del mismo gateway rotado).

## Escenarios

| # | Escenario | Estado | Sev |
|---|-----------|--------|-----|
| 1 | Completar wizard básico de recomendación (8 preguntas) hasta el resultado | **PASS** | — |
| 2 | El wizard conserva pregunta y respuestas si el envío falla | **PASS** (arreglado) | P0 → resuelto |
| 3 | Buscar y añadir 2 palas al comparador, lanzar "Comparar con IA" | **PASS** | — |
| 4b | Precio en "Comparativa Detallada" coincide con el precio real del catálogo | **PASS** (arreglado) | P1 → resuelto |
| 5 | Copy de portada no promete "reseñas" que el producto no entrega | **PASS** (arreglado) | P2 → resuelto |
| 6 | Emparejamiento de columnas en `ComparisonTable` resiste variación de nombres de la IA | **PASS** (arreglado) | P2 → resuelto |
| 7 | Banner de instalación PWA no tapa CTAs al entrar en móvil (390×844) | **PASS** (arreglado) | P2 → resuelto |
| 8 | Pregunta de género ofrece opción neutra | **PASS** (arreglado) | P3 → resuelto |
| — | ~~#3/#4 toasts de error invisibles~~ | **RETRACTADO** — falso positivo | — |

## Hallazgos retractados

### ~~Los toasts de error nunca se pintan visiblemente~~ — falso positivo, no es un bug

**Lo que se pensaba:** que `sileo.error()`/`sileo.success()` nunca se veían en ningún flujo (login, recomendación, comparación), por un `content-visibility: hidden` permanente.

**Lo que realmente pasa:** el toast SÍ se pinta. Se verificó con un `MutationObserver` que cronometra el ciclo de vida real del DOM (`[data-sileo-viewport]`):

```
t=1031ms  → toast añadido al DOM
t=1047ms  → data-ready=true (visible)
t=5034ms  → data-exiting=true (empieza a salir, ~4000ms después — coincide con duration:4000)
t=5633ms  → retirado del DOM
```

El retraso inicial (~1s en este caso, ~4.3s en el flujo de recomendación) es simplemente **cuánto tarda la petición de red en fallar** antes de llegar al `catch` que dispara el toast — no un bug del toast. Los chequeos anteriores de esta auditoría comprobaban el DOM con `querySelector` en un único instante, calculado mal respecto a esa ventana real (demasiado pronto o demasiado tarde). El log de consola `"Rendering was performed in a subtree hidden by content-visibility"` es ruido esperado de la librería `sileo` (usa `content-visibility` para su animación de expandir/colapsar), no una señal de fallo.

**Lección para futuras QAs:** al comprobar si un toast aparece, usar un `MutationObserver` con timestamps relativos en vez de un `querySelector` puntual — un fallo de red real puede tardar varios segundos en resolverse, y un solo chequeo casi siempre cae fuera de la ventana visible.

## Hallazgos arreglados

### 1. ✅ El motor de recomendaciones y comparación estaba caído en producción
**Causa raíz:** `api/_lib/ai.ts` (`generateContent`) llamaba al gateway `free-ai-api` sin cabecera `Authorization`. El gateway (repo separado, `/Users/teijeiro7/Documents/Projects/free-ai-api`) añadió auth obligatoria en su commit `3aac2ea`; `smashly-app` nunca se migró — su propio README lo dejaba pendiente en "Known consumers".
**Fix:** rotado `GATEWAY_API_KEY`, añadida la cabecera `Authorization: Bearer` en `api/_lib/ai.ts` (commit `f0b3f9a`), propagada la key a `.env` local y a Vercel producción (`vercel env add FREE_AI_API_KEY production`).
**Verificado:** en vivo, en el navegador, con 2 perfiles de recomendación distintos y 1 comparación — contenido de IA real, personalizado, sin errores. Ejemplo: para un perfil con lesión de codo, la IA explicó explícitamente "reduce la carga en el codo... epicondilitis" en cada pala recomendada.
**Pendiente fuera de este repo:** confirmar que `smashly-app.es` ya sirve el commit `f0b3f9a`; actualizar `LLM_API_KEY` en `durit-prospector` (mismo secret rotado, otro consumidor).

### 2. ✅ El wizard de recomendación perdía las respuestas al fallar el envío
**Causa raíz real (más específica de lo que parecía en la auditoría original):** `<WizardForm initialData={buildInitialData(user)}>` en `BestRacketPage.tsx` construía los datos iniciales **solo a partir del perfil del usuario**, ignorando por completo `basicData`/`advancedData` (lo que el usuario acababa de responder en el wizard). Al fallar el envío, `WizardForm` se remonta con `initialData` desde cero — perdiendo las respuestas de verdad, no solo el progreso visual.
**Fix:**
- `initialData` ahora es `{ ...buildInitialData(user), ...basicData }` (memoizado con `useMemo` para no perder el punto siguiente).
- Se añadió `initialStep`/`onStepChange` a `WizardForm` para que la pregunta en la que estaba el usuario (`wizardStep`, guardado en `BestRacketPage`) sobreviva al remount del componente en vez de resetear a 0.
- `wizardStep` se resetea a 0 explícitamente en los sitios donde sí debe reiniciar: "Nueva Búsqueda" (`handleReset`), reutilizar datos (`handleReuseData`), y al cambiar entre modo Básico/Avanzado (evita reanudar en una pregunta de un formulario distinto al que se estaba rellenando).
**Verificado en vivo:** wizard avanzado completo (8 respuestas, incluida "Duro" en tacto), backend forzado a fallar → tras el error, la pantalla se queda en "Pregunta 8 de 8, 100%" (no vuelve a la 1), y al pulsar "Anterior" la respuesta "Duro" sigue marcada visualmente.
**Puntero de código:** `frontend/src/pages/BestRacketPage.tsx`, `frontend/src/components/recommendation/WizardForm.tsx`.

### 4b. ✅ El precio en "Comparativa Detallada" era inventado por la IA, no el real del catálogo
**Causa raíz:** `ComparisonTable.tsx` (`getRacketPrice`) buscaba `rackets.find(r => r.id === metric.racketId)`, pero `metric.racketId` (definido en `api/comparison.ts`) es la **posición** de la pala en la petición (0/1/2), no su id de base de datos — nunca coincidían, así que siempre caía al precio que la IA escribía libremente en su JSON.
**Fix:** `getRacketPrice` ahora indexa `rackets[metric.racketId]` directamente (por posición), en vez de buscar por id.
**Verificado en vivo:** comparación Nox AT10 Genius 12K 2025 (149.95 € real) vs Bullpadel Vertex 04 2025 (149.95 € real) → la tabla ahora muestra **"149.95 €" para ambas**, coincidiendo exacto con el precio real consultado directamente en la base de datos. Antes mostraba "≈ 380 €" / "≈ 420 €".
**Test de regresión añadido:** `frontend/src/__tests__/unit/components/ComparisonTable.test.tsx`.
**Puntero de código:** `frontend/src/components/features/ComparisonTable.tsx`.

### 5. ✅ El copy de portada prometía "reseñas" que el producto no puede entregar
**Causa raíz:** `valoracion_usuarios` está fijado a `undefined` de forma permanente en `api/_lib/racket-mapper.ts` (columna inexistente en la BD), así que la sección "Valoración de la Comunidad" de `RecommendationResult` estructuralmente nunca puede aparecer — pero la portada y el schema SEO del catálogo prometían "reseñas" como parte de la decisión de compra.
**Fix:** cambiado el copy en `HomePage.tsx` ("Compara y elige") y `seoSchemas.ts` (descripción del catálogo) de "precios y reseñas" a "precios y análisis técnico" — lo que el producto sí entrega hoy (datos certificados Testea Pádel, seguridad biomecánica, análisis de IA).
**Nota:** no se tocó `RacketDetailPage.tsx` ni `TermsAndConditionsPage.tsx` (mismo texto "reseñas" en otro contexto) — fuera del alcance de esta auditoría, que era específicamente sobre recomendaciones/comparador.
**Puntero de código:** `frontend/src/pages/HomePage.tsx`, `frontend/src/utils/seoSchemas.ts`.

### 6. ✅ El emparejamiento de columnas de la tabla comparativa era frágil ante variación de nombres de la IA
**Fix:** `findMatchingValue` ahora tiene un fallback por posición de columna (mismo orden que `metrics`) cuando el fuzzy-match por nombre no encuentra nada — en vez de mostrar un guión "sin datos" falso cuando la IA sí generó el dato pero con un nombre ligeramente distinto.
**Verificado:** test unitario que fuerza nombres de columna que no coinciden en absoluto con los nombres reales de las palas, y confirma que el valor se recupera igualmente por posición.
**Puntero de código:** `frontend/src/components/features/ComparisonTable.tsx`.

### 7. ✅ El banner de instalación PWA tapaba las opciones/CTA en móvil nada más entrar
**Causa raíz:** el listener de `beforeinstallprompt` (Android/Chrome) mostraba el banner de inmediato, sin ningún retraso — a diferencia de la rama de iOS, que ya esperaba 10s.
**Fix:** se captura el evento de inmediato (necesario, el navegador lo exige), pero mostrar el banner (`setIsVisible(true)`) se retrasa 10s igual que en iOS.
**Verificado en vivo:** en 390×844, a los ~300ms de cargar `/best-racket` las 4 opciones de la Pregunta 1 son completamente visibles, sin ningún banner encima.
**Puntero de código:** `frontend/src/components/pwa/PWAInstallPrompt.tsx`.

### 8. ✅ La pregunta de género no ofrecía opción neutra
**Fix:** añadida una tercera opción "Prefiero no decirlo" (`no_especifica`) en ambas listas de preguntas (básica y avanzada). El filtro biomecánico server-side (`racket-filter.ts`) ya trata cualquier valor que no sea `'femenino'` como el baseline por defecto (365g), así que la nueva opción no rompe ni distorsiona el filtrado — simplemente no aplica el ajuste más restrictivo pensado para "femenino".
**Verificado en vivo:** las 3 opciones se renderizan correctamente en la Pregunta 4 de 8, en móvil y desktop.
**Puntero de código:** `frontend/src/components/recommendation/WizardForm.tsx`, `frontend/src/types/recommendation.ts`.

## No cubierto

- Formulario "Avanzado" completo end-to-end con cuenta autenticada real — no probado con login.
- Guardar recomendación / comparación (requiere sesión autenticada).
- Comparación con 3 palas (solo se probó con 2).
- Compartir comparación (`SharedComparisonPage`) y comparaciones guardadas (`MyComparisonsPage`).
- Doble envío / concurrencia en ambos flujos.
- Caso límite residual conocido y aceptado: si el usuario refresca la página justo después de un fallo (antes de reintentar), `wizardStep` no persiste en `sessionStorage` (a diferencia de `basicData`) — volvería a la pregunta 1, aunque con las respuestas ya rellenadas gracias al fix de `initialData`. Escenario poco probable, no reportado en la auditoría original; se documenta pero no se corrigió para no ampliar el alcance de este pase de fixes.
- Re-verificación en vivo de `smashly-app.es` (producción) tras el deploy del commit `f0b3f9a`.
- `durit-prospector` (otro consumidor de `free-ai-api`) — su `LLM_API_KEY` quedó roto por la misma rotación de secret; pendiente de que el usuario lo actualice ahí.

## Lo que funciona bien

- El wizard básico tiene una UX de progreso clara (barra + "Pregunta N de 8" + %) y navegación Anterior/Siguiente coherente.
- El comparador conserva la selección de palas tras un fallo (a diferencia del wizard, antes del fix) — buen comportamiento defensivo que ya existía.
- Los mensajes de error para el comparador ya estaban bien redactados y diferenciados por causa (503/429/genérico).
- `comparison.ts` registra el error real en servidor (`console.error`) en su catch; a diferencia de `recommendations/generate.ts`, que lo traga en silencio — vale la pena igualar ese patrón en una futura pasada (no corregido aquí, no estaba en el alcance de los hallazgos originales).
- El contenido de IA es de buena calidad — específico, coherente, y genuinamente personalizado. Cada pala recomendada explica su relación con el nivel, lesión, preferencia de tacto y presupuesto exactos indicados.
- El diseño de `RecommendationResult` y `ComparisonTable` (tarjetas, badges de match %, radar chart, análisis técnico por métrica) se sostiene bien con datos reales.
- Detalle menor observado, no confirmado como bug recurrente: en una respuesta, el texto narrativo mencionó IDs internos de pala entre paréntesis (p. ej. "usa la pala de control (19402)..."). Si se repite en más respuestas, vale la pena ajustar el prompt de `generate.ts`/`comparison.ts` para que la IA no exponga ids internos en texto narrativo — no corregido en este pase (no forma parte de los 8 hallazgos originales).

## Smoke test (pegar en el PR)

- [x] Completar wizard básico de recomendación → llega a resultado sin error 500
- [x] Provocar un fallo de backend en recomendación → el wizard conserva la pregunta y las respuestas al reintentar
- [x] Añadir 2 palas y comparar con IA → llega a resultado sin error 500
- [x] El precio en "Comparativa Detallada" coincide con el precio real del catálogo
- [x] Wizard en móvil (390×844): las 4 opciones de la Pregunta 1 son visibles sin descartar el banner de instalación
- [x] La pregunta de género ofrece una opción neutra
- [x] El copy de portada no promete "reseñas" que el producto no entrega
- [ ] Confirmar en `smashly-app.es` que recomendación y comparación funcionan tras el deploy del commit `f0b3f9a`
- [ ] Actualizar `LLM_API_KEY` en `durit-prospector` (mismo secret rotado, otro consumidor afectado)
