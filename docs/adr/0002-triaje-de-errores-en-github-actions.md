# 0002 — El triaje de errores corre en GitHub Actions, no en un cron de Vercel

**Estado:** Aceptada — 2026-08-16

## Contexto

El sistema de reporte de errores (`api/_v1/errors.ts`, `error_incidents`/`error_occurrences`)
necesita un proceso periódico que agrupe ocurrencias nuevas, las enriquezca con IA y cree el
ticket correspondiente en la base de Notion "To-do List". Ese proceso necesita dos cosas: una
API key de Mistral y, para que el ticket sea útil (que señale la línea culpable, no solo
repita el mensaje del stack), el código fuente real del commit que estaba desplegado cuando
ocurrió el error.

`vercel.json` ya define un cron (`/api/cron/check-price-drops`), pero el plan Hobby de Vercel
limita los crons a **una ejecución diaria** — un bug de la mañana no generaría ticket hasta el
día siguiente, lo que rompe el objetivo de "avisarme cuando pasa algo que no debería pasar".

Además, `MISTRAL_API_KEY` ya existe como secret de GitHub Actions (la usa `pr-agent.yml` para
las revisiones automáticas de PR) — está disponible ahí, no en Vercel. Y un runner de GitHub
Actions parte de un `git checkout` completo del repo, con `git show <sha>:<fichero>` disponible
gratis; una función serverless de Vercel no tiene el repo en disco.

## Decisión

El triaje (`scripts/error-triage.mjs`) corre como workflow de GitHub Actions
(`.github/workflows/error-triage.yml`) con `schedule: '*/15 * * * *'`, no como cron de Vercel.
Lee incidencias pendientes de Supabase, usa `git show`/`git ls-tree` sobre el checkout completo
para extraer el snippet de código real, llama a Mistral (`codestral-latest`, mismo modelo que
`pr-agent.yml`) para redactar el ticket, y lo crea en Notion vía su API. El único secret nuevo
es `NOTION_TOKEN`; `MISTRAL_API_KEY`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya existían.

## Consecuencias

- La latencia máxima hasta que un error se convierte en ticket es de ~15 minutos (el intervalo
  del cron), no instantánea — aceptable para triaje, no para alertas de guardia.
- Si GitHub Actions tiene una interrupción o el cron se retrasa (algo que ocurre con cierta
  frecuencia en crons de Actions bajo carga), los tickets se acumulan como `pending` en
  Supabase sin perderse — el siguiente run los recoge todos.
- Si en el futuro se necesita triaje casi instantáneo, la ruta correcta no es mover esto a
  Vercel (sigue limitado a 1 cron/día en Hobby) sino disparar el workflow por
  `workflow_dispatch` vía la API de GitHub desde el propio `api/_v1/errors.ts` cuando llega una
  incidencia nueva de severidad alta — no está implementado porque hoy nadie lo necesita.
