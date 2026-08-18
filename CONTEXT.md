# Smashly

Catálogo y comparador de palas de pádel (mercado español). Monorepo: frontend (Vite/React) +
API (Vercel serverless) + Supabase.

## Language

**Ocurrencia**:
Una instancia concreta de un error real (una fila en `error_occurrences`). Una por cada vez que
sucede, incluidas repeticiones del mismo bug.

**Incidencia**:
Grupo de Ocurrencias que comparten `fingerprint` — la misma causa raíz vista una o mil veces
(una fila en `error_incidents`). Es la unidad de trabajo: se triaja, se ticketea, se cierra.
_Avoid_: Error, bug (demasiado genéricos — una Incidencia es específicamente el agregado).

**Fingerprint**:
Hash determinista (`source` + mensaje normalizado + primer frame propio) que agrupa Ocurrencias
en una misma Incidencia. Estable entre deploys — sobrevive al hash de build del nombre de chunk.

**Ticket**:
La página creada en la base de Notion "To-do List" a partir de una Incidencia. Siempre uno por
Incidencia, nunca uno por Ocurrencia.

**Regresión**:
Reaparición de una Incidencia cuyo Ticket ya estaba en `Done` en Notion. Genera un Ticket nuevo
marcado `🔁 REGRESIÓN`, enlazado al anterior — no reabre el ticket cerrado.

**Ruido**:
Ocurrencia que no es un bug propio: extensiones de navegador, errores de red del usuario,
scripts cross-origin. Se descarta antes de salir del cliente, o se marca `ignored` en el
triaje — nunca genera Ticket.
