# QA de usuario — Sistema de error reporting — 2026-08-16

**Rama:** feature/error-reporting-notion **Persona:** Carlos — jugador de pádel (primary) **Alcance:** captura de errores cliente (`errorReporter.ts`, handlers globales en `main.tsx`, `ErrorBoundary.tsx`) y la página `/error`

## Resumen

Probado en navegador real contra `http://localhost:5174` (solo frontend, sin `vercel dev` — el proxy `/api` apunta a `localhost:4001`, que no está levantado). Esto significa que ningún report de esta sesión llegó a producción; se pudo verificar el comportamiento del cliente (qué se envía, qué se filtra, qué se redacta) pero no la ingesta real en Supabase/Notion. 9 escenarios ejecutados, 9 PASS. Dos hallazgos del review de PR-Agent quedaron refutados en vivo con evidencia de comportamiento real (ver hallazgos de esa sesión).

## Escenarios

| # | Escenario | Estado | Sev |
|---|-----------|--------|-----|
| 1 | `window.onerror` captura un throw síncrono no capturado | PASS | — |
| 2 | `unhandledrejection` captura una promesa rechazada sin catch | PASS | — |
| 3 | Denylist: `AbortError` y ruido de `ResizeObserver` no se reportan | PASS | — |
| 4 | Throttle: mismo error 5 veces seguidas → exactamente 3 envíos | PASS | — |
| 5 | Scrubbing: JWT / Bearer / email / API key redactados en el payload | PASS | — |
| 6 | Scrubbing de URL: query params fuera, solo pathname | PASS | — |
| 7 | Failure path: backend de reporting caído → app no se rompe visualmente | PASS | — |
| 8 | Navegación con IDs corruptos en `/comparar` → 404 gestionado, no crash | PASS | — |
| 9 | `/error?type=500` (destino de "Ver Detalles") renderiza correctamente | PASS | — (era P3, corregido) |

## Hallazgos

### P3 — 1 (corregido)

#### Parpadeo de carga en `/error` antes de mostrar contenido
**Qué hacía el usuario:** Llega a `/error?type=500&message=...` (el destino del botón "Ver Detalles" del `ErrorBoundary`).
**Qué pasó:** Durante ~1-1.5s se ve "Cargando página..." en vez del contenido de error, antes de que aparezca "ERROR DEL SERVIDOR / 500 / ...".
**Repro:**
1. Navegar directo a `http://localhost:5174/error?type=500&message=test`
2. Observar el `<main>` durante el primer segundo
**Causa raíz:** `ErrorPage` se cargaba con el mismo patrón `lazy(() => import(...))` que las otras ~26 páginas del router — convención consistente y deliberada del repo, pero mala idea concretamente para la pantalla de fallback tras un error, ya que la deja dependiendo de un chunk-fetch que puede fallar justo cuando algo ya ha ido mal.
**Evidencia:** snapshot inicial mostraba "Cargando página...", 1.5s después mostraba el contenido real.
**Por qué importa para Carlos:** si ya está frustrado por un error de la app, un segundo de pantalla en blanco/loading antes de ver el mensaje de error añade fricción, aunque menor.
**Fix aplicado:** `frontend/src/router.tsx` — `ErrorPage` pasa de `lazy(() => import('./pages/ErrorPage'))` a import estático eager, como única excepción al patrón de lazy-loading del router (documentado inline con el motivo). `NotFoundPage` y el resto de páginas siguen lazy sin cambios.
**Verificación:** `npx tsc --noEmit` OK, `pnpm test:unit` 487/487 OK, re-ejecutado el escenario 9 en el navegador — el contenido de error aparece en el primer snapshot, sin "Cargando página...".

## No cubierto

- **Fallback visual del `ErrorBoundary` ante un crash real de React** (el "¡Ups! Algo salió mal", botones "Reintentar"/"Ver Detalles") — no conseguí reproducir un crash de render genuino sin modificar código de la app; navegar con parámetros corruptos se resolvió con un 404 gestionado, no con un crash. El código que dispara (`componentDidCatch` → `reportError()`) es idéntico al ya validado en los escenarios 1-2, así que el riesgo residual de la llamada en sí es bajo, pero el layout visual y los botones no se verificaron en vivo.
- **Ingesta real en Supabase/Notion** — no aplica en este entorno (sin `vercel dev` local, y no se debía apuntar a producción sin más). Solo verificado el payload que el cliente intenta enviar.
- **Concurrencia (dos pestañas)** — no aplica de forma significativa; es telemetría sin estado compartido de usuario.
- **Roles/permisos** — no aplica; el reporting es idéntico para todos los roles.
- **Overflow visual de mensajes/stacks muy largos en el fallback del `ErrorBoundary`** — depende del punto no cubierto anterior.

## Lo que funciona bien

- El throttle corta exactamente en `THROTTLE_MAX_PER_WINDOW` (3), sin off-by-one — contradice uno de los hallazgos de PR-Agent en la revisión de código, confirmado aquí con comportamiento real.
- El scrubbing de secretos (JWT, Bearer, email, API keys tipo `sk-`) funciona correctamente antes de que el payload salga del navegador.
- El scrubbing de URL descarta query params no permitidos, solo se queda con el pathname.
- El denylist filtra correctamente ruido conocido (`AbortError`, `ResizeObserver loop`) sin generar tráfico de red.
- Un fallo total del backend de reporting (proxy caído) no rompe ni bloquea visualmente la app para el usuario — el diseño "nunca lanza" de `reportError()`/`send()` se sostiene en la práctica.

## Smoke test (pegar en el PR)

- [x] Escenario 1 — `window.onerror` captura y reporta un error no manejado
- [x] Escenario 2 — Promesa rechazada sin catch se reporta correctamente
- [x] Escenario 3 — Ruido conocido (AbortError, ResizeObserver) no genera tráfico
- [x] Escenario 4 — Throttle limita a 3 envíos por ventana ante ráfagas del mismo error
- [x] Escenario 5 — Secretos (tokens, emails, API keys) se redactan antes de salir del navegador
- [x] Escenario 6 — Query params se descartan del `url_path` reportado
- [x] Escenario 7 — Fallo del backend de reporting no rompe la experiencia visual
- [x] Escenario 8 — Navegación con parámetros corruptos se gestiona sin crash
- [x] Escenario 9 — `/error?type=500` renderiza el mensaje correctamente, sin parpadeo de carga (P3 corregido)
