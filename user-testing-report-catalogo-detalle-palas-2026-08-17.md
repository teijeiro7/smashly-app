# User Testing Report — Catálogo de palas + Página de detalle — 2026-08-17

**Modo:** Live (browser automation con Chromium headless contra dev local + Supabase real) + análisis estático
**Scope:** `/catalog` (filtros, búsqueda, paginación, vista, comparador) y `/palas/:slug` (galería, precio, specs, radar, alertas, listas, reseñas, historial)
**Personas:** Visitante no logueado (primario) + Jugador logueado (secundario)
**Datos de referencia:** 1230 palas activas en catálogo, 1354 filas en tabla `rackets` (incl. discontinuadas), 36 marcas, 742 en oferta

---

## Summary

El catálogo funciona en lo básico: filtra, busca, pagina con scroll infinito y el comparador persiste en `localStorage`. El problema es la promesa rota y los callejones sin salida: el detalle está pensado para usuario logueado, pero para el anónimo (el visitante que llega de Google) casi todo el valor se esconde tras un banner que apenas invita a registrarse; y para el logueado la función estrella — Alertas de precio — está rota de punta a punta porque la tabla `price_watch` **no existe en producción**. Además, el registro falla en silencio si el apodo está cogido. Hallazgos: 2 CRÍTICOS, 5 HIGH, 6 MEDIUM, 4 LOW.

---

## Verificación post-fix (2026-08-17, sesión de continuación)

Calidad: `pnpm lint` (0 errores), `tsc --noEmit` (0 errores), `pnpm test:unit` (487/488 pass, 1 skip) — todo verde tras corregir 2 errores de tipos y 2 imports muertos introducidos por los fixes. Verificación en vivo con Playwright contra dev server (anon + comprobaciones puntuales vía SQL/Supabase MCP).

- ✅ **CRITICAL — Registro apodo duplicado**: corregido. El hallazgo original decía "error 500 silencioso" — **no era silencioso**, sí mostraba un toast (`sileo`) pero con el texto crudo en inglés `"Database error saving new user"`. Con `mapSignUpError()` (`AuthContext.tsx:95`) ahora se ve un toast en español: *"No se ha podido crear la cuenta. Prueba de nuevo en unos minutos."* — verificado en vivo reproduciendo el 500 real de Supabase. Nota: como Postgres envuelve el conflicto de `UNIQUE(nickname)` en ese mensaje genérico (no menciona la columna), no llega al mensaje específico "Ese apodo ya está en uso" pese a que el regex lo contempla — el bucket genérico `database error|unexpected_failure` lo intercepta antes. Mejora posible pero fuera del alcance mínimo (evitar texto en inglés), que sí está resuelto.
- ✅ **CRITICAL — `price_watch` inexistente**: migración aplicada a remoto (tabla + RLS). Verificado: `GET /api/v1/price-watch` anónimo → `401 Unauthorized` (antes 500 `Could not find the table`). Esquema de columnas confirmado correcto vía SQL.
- ✅ **HIGH — Wishlist anónimo sin salida**: corregido. Verificado en vivo: pulsar el corazón sin sesión abre el modal de login/registro (no el callejón sin salida de "Crear Nueva Lista").
- ✅ **HIGH — Specs inventadas (peso "360-375g", etc.)**: corregido. Verificado en vivo: "Peso: No especificado" en vez de un valor fabricado; el resto de specs muestran datos reales de la BD (p.ej. "Balance: Según", que es el dato real, no un fallback).
- ✅ **HIGH — "Envío Gratis"/"En Stock" hardcodeados**: el bloque `ShippingInfo` ya no se renderiza; de paso se ha eliminado el styled-component y el import `FiTruck` que habían quedado huérfanos (unused-vars, rompían `tsc`).
- ✅ **HIGH — Catálogo abre con "Solo comparación" primero**: corregido, verificado en vivo — las primeras tarjetas tienen precio real (ninguna "Solo comparación" en la primera página).
- ✅ **HIGH — Filtro "más vistos"/badge "Popular" mentían**: el filtro "más vistos" y el badge "Popular" se han eliminado (no se han fingido con datos reales).
- ✅ **MEDIUM — Precio "0€" engañoso**: corregido. Verificado en código: `racket.precio_actual ? ... : 'Sin precio disponible'` (antes caía a "0€"); el CTA "Ver en tienda" ahora solo aparece si `lowestPrice?.link` existe (antes `href="#"`).
- ✅ **MEDIUM — URLs de filtros con comillas `?offers="true"`**: corregido con `pickBoolean` en `router.tsx`. **Bug nuevo encontrado durante esta verificación y corregido**: el `useState` de los filtros booleanos/string arrancaba con valores por defecto y se sincronizaba con la URL en un `useEffect` separado; en el montaje, el efecto que reescribe la URL corría con ese estado por defecto (aún no actualizado) y **sobrescribía cualquier URL con `?offers=true`/`?availableOnly=true` a `/catalog` vacío** antes de que el usuario viera el filtro aplicado — es decir, un enlace compartido con filtros booleanos perdía los filtros al cargar. Corregido inicializando el estado directamente desde `searchParams` (`useState(() => searchParams['offers'] === true)` etc.) en vez de vía efecto, eliminando la carrera. Verificado con navegación directa a `?offers=true&availableOnly=true` (persiste) y toggle interactivo (sigue escribiendo bien en la URL). Cambio en `frontend/src/pages/CatalogPage.tsx`.
- ⏳ **No verificado / sin cambios en esta sesión**: "Detalle para anónimo casi vacío" (decisión de producto, no tocado), "Rendimiento de imágenes" (fix parcial ya aplicado — lazy/async en `RacketCard`, no medido de nuevo).
- ✅ **MEDIUM — Mensaje de error crudo de la BD en pantalla ("Pala no encontrada")**: corregido. `queryError?.message` ya no se renderiza directamente al usuario; ahora es un texto estático amigable en español.
- ✅ **Corrección adicional tras revisión de seguridad — fallback de `mapSignUpError` sin traducir**: el fallback devolvía el `message` crudo de Supabase para cualquier error no contemplado por los 3 patrones (p.ej. rate limiting, captcha, signups deshabilitados) — reproducía el mismo bug de origen (texto en inglés) para otros casos no cubiertos. Añadido patrón de rate-limit y el fallback ahora es un mensaje genérico en español en vez de passthrough.
- ✅ **Corrección adicional — "Precio actualizado: hace un momento" inventado**: cuando `racket.updated_at` es null, ya no se muestra una fecha relativa fabricada ("hace un momento" sugiere frescura falsa); ahora dice "en revisión".
- 🧹 Cuentas de prueba `curlprobe*@test.com` y `auditprobe@test.com` eliminadas de Supabase dev.

### Revisión de seguridad (security-agent, audit-only)

Repasados los 7 archivos modificados de esta sesión más la migración `price_watch`. Sin `.security/` inicializado en el repo → modo `audit-only` (solo lectura, sin escribir estado).

- **Sin vulnerabilidades nuevas.** Los cambios son de UI/copy, tipado de search params y un fix de race condition en React state — sin nuevos sinks de inyección, sin `dangerouslySetInnerHTML`, sin URLs de usuario sin sanear.
- **`price_watch` RLS correcta**: policy única `USING/WITH CHECK (user_id = auth.uid())` cubre todos los comandos; los endpoints (`api/_v1/price-watch/index.ts`, `[id].ts`) usan `supabaseAdmin` pero acotan siempre por `user.id` del JWT verificado (nunca del body), y el DELETE comprueba propiedad antes de borrar (403 si no coincide) — sin IDOR.
- **Corregido**: `mapSignUpError()` (`AuthContext.tsx:95`) tenía un `return message` de fallback que pasaba tal cual cualquier error de Supabase no contemplado por los 3 patrones (rate limit, captcha, signups deshabilitados, etc.) — reproducía el mismo bug de origen (texto en inglés en la UI) para casos no cubiertos. Ahora ese fallback es un mensaje genérico en español, y se ha añadido un patrón explícito para rate-limit.
- **Hallazgo preexistente (no introducido esta sesión)**: los endpoints de `price-watch` devuelven `error.message` crudo de Postgres al cliente en el 500 (`index.ts:44,84`, `[id].ts:55`) — mismo patrón que el resto de la API; menor riesgo de exponer nombres de columnas/constraints. No es parte del alcance de este fix.

---

## Findings

### CRITICAL — 2

#### Registro: apodo duplicado → error 500 silencioso, usuario no puede crear cuenta
**Qué hacía el usuario:** crear cuenta para guardar listas/palas.
**Qué pasó:** al registrarse con un apodo ya existente, el endpoint `/auth/v1/signup` responde 500 `{"code":"unexpected_failure","message":"Database error saving new user"}`. El trigger `handle_new_user` viola la restricción `user_profiles_nickname_key` (UNIQUE(nickname), verificada en la BD remota). La UI **no muestra ningún error**: el botón pasa a "Creando cuenta..." y se queda ahí; no aparece mensaje en pantalla.
**Repro:**
1. `/catalog` → "Registrarse" → rellenar con apodo que ya existe (p.ej. uno usado previamente, `audituser`).
2. Enviar formulario.
3. La petición devuelve 500 y el modal se queda sin feedback.
**Code pointer:** `frontend/src/contexts/AuthContext.tsx:296` (signUp traga el error y devuelve `{data:null,error}`), formulario en `frontend/src/components/auth/AuthModal.tsx` (no renderiza `error`), trigger `supabase/migrations/20260621000001_enable_rls.sql:33`.
**Por qué importa:** el único CTA de conversión del anónimo ("Crear cuenta") bloquea silenciosamente a un subconjunto de usuarios; el registro parecía "colgado". Sin feedback no hay forma de saber que el apodo está cogido.
**Fix sugerido:** capturar el 500 en `signUp` y devolver un mensaje legible ("Ese apodo ya está en uso"); validar disponibilidad de apodo antes del envío o incluir sugerencias (p.ej. `audituser_123`).

#### Alertas de precio rotas de punta a punta para todo usuario logueado (tabla inexistente en prod)
**Qué hacía el usuario (logueado):** ver el historial de precios que "vende" el banner y crear una alerta de bajada de precio.
**Qué pasó:** al abrir cualquier detalle, la página dispara `GET /api/v1/price-watch?racket_id=N` → 500 (`Could not find the table 'public.price_watch' in the schema cache`). Crear una alerta → `POST /api/v1/price-watch` → 500. La UI no informa de nada (solo consola); la alerta jamás se guarda.
**Repro:**
1. Loguéate.
2. Abre `/palas/adidas-adidas-adipower-ctrl-mtw-pro-edt-2025`.
3. Escribe precio objetivo y pulsa "Avísame" → 500, sin mensaje.
**Code pointer:** endpoint `api/_v1/price-watch/index.ts:31` (`.from('price_watch')`), migración `supabase/migrations/20260713000002_price_watch.sql` (crea la tabla pero **no aplicada** a la BD remota, verificada vía SQL), llamada `frontend/src/pages/RacketDetailPage.tsx:1412` y `:1427`.
**Por qué importa:** el "Alerta de precio" es una de las propuestas de valor centrales para el usuario logueado; está muerta en producción y falla en silencio con 500+ en consola por cada visita.
**Fix sugerido:** aplicar la migración `20260713000002_price_watch.sql` a la BD remota (o crear la tabla); añadir manejo de error visible en `handleCreateWatch`/`listWatches`.

---

### HIGH — 5

#### Corazón "Guardar en mis listas" abre modal sin salida para el anónimo
**Qué hacía el usuario (anónimo):** guardar una pala que le gusta.
**Qué pasó:** el corazón de la página de detalle abre "Añadir a mis listas" para **todo el mundo**, pero la lista no se puede crear: el botón "Crear Nueva Lista" abre el formulario y "Crear" queda deshabilitado con el nombre vacío; si se rellena, `createList` llama a la API sin token y el error se traga (`Error handled by context`). No hay aviso de login, ni redirect al modal de auth, ni mensaje.
**Repro:**
1. Sin sesión, abrir cualquier pala.
2. Pulsar el corazón (arriba a la derecha de la galería).
3. "Crear Nueva Lista" → relleno nombre → guardar → nada (fallo silencioso).
**Code pointer:** `frontend/src/pages/RacketDetailPage.tsx:1682` (wishlist siempre visible) y `:2151` (modal sin guard de auth en detalle; en catálogo sí se oculta el botón: `CatalogPage.tsx:1389`).
**Por qué importa:** inconsistencia catálogo/detalle: en el catálogo el botón desaparece para anónimos, en el detalle aparece y lleva a un callejón sin salida.
**Fix sugerido:** o bien ocultar el corazón para no autenticados (como en catálogo), o bien al pulsarlo abrir el modal de login/registro con mensaje "Inicia sesión para guardar en tus listas".

#### Datos técnicos inventados cuando falta la especificación real
**Qué hacía el usuario:** comparar specs para decidir; el peso es un dato de compra clave.
**Qué pasó:** el detalle muestra valores fabricados en duro cuando la BD no tiene el dato: Peso siempre "360-375g" (la columna `peso` **no existe** en `rackets`, se mapea siempre a `null`), Caras "Carbon", Balance "Media", Nivel "Avanzado", Núcleo "EVA", Forma "N/A".
**Repro:** abrir cualquier pala y ver el bloque "Especificaciones Técnicas" (ej. `Peso 360-375g`).
**Code pointer:** `frontend/src/pages/RacketDetailPage.tsx:1949` (`racket.peso ? ... : '360-375g'`), `:1938`, `:1960`, `:1973`, `:1988`. Origen del null: `frontend/src/services/racketService.ts:161` (peso no es columna real, comentado en `:172`).
**Por qué importa:** para un comparador de palas, mostrar un peso falso como si fuera el real puede inducir a una compra equivocada; es peor que no mostrar nada.
**Fix sugerido:** eliminar los fallbacks inventados; mostrar "—"/"No especificado" cuando no haya dato; si `peso` debe existir, añadirlo al scraper y a la tabla.

#### "Comparar Precios" (logueado): "Envío Gratis" y "En Stock" hardcodeados para todas las tiendas
**Qué hacía el usuario (logueado):** elegir según tienda fiándose de stock/envío.
**Qué pasó:** la tabla de comparación de tiendas pinta siempre "Envío Gratis" y "• En Stock" en todas las filas, sin dato real detrás.
**Repro:** loguéate → abre una pala con precio → sección "Comparar Precios" (p.ej. `Ver en Padel Nuestro` con `Envío Gratis • En Stock`).
**Code pointer:** `frontend/src/pages/RacketDetailPage.tsx:2092-2102` (texto estático en `ShippingInfo`).
**Por qué importa:** información de compra fabricada; el usuario puede comprar en una tienda creyendo que hay stock/envío gratis.
**Fix sugerido:** quitar o condicionar a datos reales de stock/envío por tienda (el modelo `StorePrice` ya tiene `in_stock`).

#### El catálogo arranca con palas "Solo comparación" (sin precio) como primera impresión
**Qué hacía el usuario:** hojear el catálogo buscando qué comprar.
**Qué pasó:** la primera tarjeta del listado es una pala "No disponible para venta" (solo comparación) y el orden por defecto es alfabético por nombre. Un visitante que llega al catálogo ve primero producto no comprable y sin precio.
**Probe:** primera tarjeta real: `Solo comparación | Adidas | Adidas Drive Light 3.4 | No disponible para venta`.
**Code pointer:** `frontend/src/services/racketService.ts:186` (`order('name')`), render `frontend/src/pages/CatalogPage.tsx:1381`.
**Por qué importa:** primera página = primera impresión de valor; palas sin precio dominan el inicio (todas las "Adidas..." del principio son comparación).
**Fix sugerido:** ordenar primero las palas con precio/stock disponible (mover `solo_comparacion` abajo, o orden por precio/relevancia por defecto).

#### Filtro "más vistos" y insignia "Popular" no funcionan (columna inexistente)
**Qué hacía el usuario:** usar `?mostViewed=true` o esperar ver las palas populares.
**Qué pasó:** `view_count` no es una columna real de `rackets`; el mapeo la rellena con 0 (`racketService.ts:146`). El filtro de "más vistos" (`CatalogPage.tsx:777`) ordena por `0` y coge el top 20% estable — es decir, las primeras por orden alfabético, no las populares. La insignia "Popular" (`RacketCard.tsx:318`, requiere `view_count > 10`) no aparece nunca. Además `RacketViewService.recordView` solo registra visitas de usuarios autenticados.
**Repro:** abrir `/catalog?mostViewed=true` y comparar con `/catalog` — misma lista.
**Por qué importa:** funcionalidad visible por URL que miente sobre lo que muestra.
**Fix sugerido:** o bien quitar el filtro/insignia, o bien implementar `view_count` real (columna o tabla `racket_views` con conteo agregado) y mostrarlo.

---

### MEDIUM — 6

#### Detalle para anónimo casi vacío; el CTA de conversión está al final de la página
**Qué hacía el usuario (anónimo):** valorar la pala desde el detalle antes de registrarse.
**Qué pasó:** la tabla "Comparar Precios", el "Historial de precios", las "Reviews" y la "Alerta de precio" solo se renderizan para autenticados (`RacketDetailPage.tsx:1997`, `:2076`, `:2116`). El anónimo solo ve precio único + "Ver en tienda" + specs y al final un banner "Accede a todas las funcionalidades". El banner es el único gancho y está tras todo el contenido.
**Probe:** anónimo: presente `Mejor Precio + Ver en tienda + Especificaciones + Análisis + banner auth`; ausente tabla de precios, historial, reseñas, alerta.
**Code pointer:** `frontend/src/pages/RacketDetailPage.tsx:2125-2147`.
**Por qué importa:** decisión de producto (gate tras login), pero desde el punto de vista del visitante el valor diferencial del comparador no se muestra — el mensaje SEO promete "compara precios" y solo se cumple tras registrarse. Riesgo de fuga de conversión.
**Fix sugerido (producto):** mostrar la tabla de precios e historial de forma anónima (SEO/confianza) y reservar alertas/listas/reseñas al login; o subir el banner justo debajo del precio.

#### Palas sin datos de precio muestran "0€" o "Solo comparación" de forma engañosa
**Qué hacía el usuario:** mirar el precio de una pala sin stock registrado.
**Qué pasó:** si no hay ninguna tienda con precio, `calculateBestPrice` devuelve `precio_actual: 0`. En detalle el precio cae a "0€" (`RacketDetailPage.tsx:1825`); en el card aparece "Solo comparación" aunque la pala NO esté marcada como tal (`RacketCard.tsx:369`), y el botón "Ver en Tienda" apunta a `#` (`RacketDetailPage.tsx:1846`).
**Code pointer:** `frontend/src/services/racketService.ts:75-81`, `frontend/src/pages/RacketDetailPage.tsx:1825`/`:1846`, `frontend/src/components/features/RacketCard.tsx:369`.
**Fix sugerido:** mostrar "Sin precio disponible / Agotado" junto con estado real, ocultar CTA de compra si no hay enlace; usar un solo término ("Solo comparación" solo para `solo_comparacion` real).

#### URLs de filtros feitas para compartir: `?offers="true"` con comillas
**Qué hacía el usuario:** compartir un catálogo filtrado por URL.
**Qué pasó:** TanStack Router serializa los valores de búsqueda como JSON de strings: `?offers=%22true%22` (`offers="true"`). Funciona dentro de la app pero la URL queda sucia y frágil para enlaces externos/SEO.
**Code pointer:** `frontend/src/pages/CatalogPage.tsx:645-655` (set de `params` + `navigate` con search).
**Fix sugerido:** asegurar `params` booleanos como flags sin valor o parsear con `pickBoolean`; validar en `router.tsx:394` (hoy todo string).

#### Rendimiento de imágenes: primeras 4 cargan sincrónicas y las externas tardan, payload de catálogo completo
**Qué hacía el usuario:** navegar el catálogo en red de teléfono.
**Qué pasó:** el catálogo descarga ~1230 filas enteras en un fetch (cache 30 min, bien) pero las imágenes de CDNs externas (padelnuestro/shopify/padelmarket) tardan: a los 2 s las 9 tarjetas seguían cargando imagen. En móvil no hay overflow horizontal (bien), pero la sensación de carga es pobre.
**Probe:** 9 imágenes `loading` tras 2 s en `networkidle`.
**Code pointer:** `frontend/src/components/features/RacketCard.tsx:306-317` (eager+sync en primeras 4, lazy el resto).
**Fix sugerido:** imagenes a 2x desde tu propio dominio/CDN de imágenes (proxy de resize), `loading=lazy` global y no bloquear el render con las 4 eager.

#### Inconsistencias de idioma y copys técnicos
**Qué veía el usuario:** en plena interfaz en español: rating sin reseñas en inglés "No reviews yet" (`RacketDetailPage.tsx:1788`), título de sección "Reviews & Valoraciones" (`h2` real), erratas técnicas en errores (mensaje de la BD directo en pantalla de "Pala no encontrada": `queryError?.message` en `:1591` muestra texto inglés interno tipo "Database error saving new user"). Nav mezcla "Comparar palas" / "Comparar Palas" / "Comparar".
**Por qué importa:** erosión de confianza y copia incoherente para un público español.
**Fix sugerido:** unificar idioma (ES), sustituir los mensajes de error crudos por copy amigable.

#### SEO/gestión de contenido desactualizado
**Qué veía el usuario/buscador:** el título SEO sigue diciendo "+800 Modelos" (`CatalogPage.tsx:1119`) cuando ya hay 1230; el "Precio actualizado" dice "hace un momento" cuando no hay fecha (`RacketDetailPage.tsx:1842`).
**Por qué importa:** métricas y confianza; la fecha inventada "hace un momento" puede engañar sobre la frescura del precio.
**Fix sugerido:** actualizar copy con cifras reales; mostrar "Precio en revisión" en vez de "hace un momento" si no hay timestamp.

---

### LOW — 4

- **Búsqueda de 1 carácter inútil:** escribir "a" filtra por token local y devuelve casi todo (`CatalogPage.tsx:691` solo usa API con ≥2 caracteres). Sugerir "escribe al menos 2 letras".
- **Estados de carga el detalle:** con cache caliente el pintado inicial es rápido (placeholderData desde catálogo, bien), pero hay un parpadeo de skeleton en entrada directa por URL; aceptable.
- **"Mostrando 9 de 1230 palas"** sin indicación de página — el scroll infinito no tiene contador de página ni salto; con 1230 palas es difícil "llegar al final" intencionadamente.
- **Chips rápidos de marca** activan búsqueda por marca pero no limpian otros filtros activos (combinaciones raras: marca + forma + oferta a la vez sin indicador claro de filtros activos).

---

## What works well

- **Comparador** persiste en `localStorage`, avisa con toasts (`sileo`) del límite de 3 y panel flotante "Comparar ahora" siempre accesible.
- **Filtros sincronizados con URL** (compartir enlaces) y "Limpiar" resetea todo correctamente.
- **Scroll infinito** funciona bien (9→18→27) con indicador de carga y mensaje de fin.
- **Accesibilidad básica cuidada:** alt descriptivos, `aria-label` en iconos, navegación por teclado en galería (flechas), `role="button"`+`tabIndex` en thumbnails.
- **Catálogo bien optimizado a nivel de carga de datos:** selección de columnas evita los 1.3MB de specs/descripciones y cachea 30 min.
- **Vista lista/cuadrícula** y cambios de estado de filtros responden sin recargas.

---

## Notas de método

- Probes automatizadas: `Playwright`/Chromium headless contra `http://localhost:5173` (dev con Vite + API en 4001, proxys a Supabase real `lrdgyfmkkboyhoycrnov`). Sesiones anónimas y autenticadas creadas ad hoc; la cuenta de prueba `audit*@test.com` con apodo único registró OK.
- Verificaciones de esquema remoto vía SQL directo (no existen `price_watch`; `user_profiles.nickname` tenía `UNIQUE`).
- No se evaluaron flujos de pago/afiliación reales (dogfooding del enlace de afiliado no ejecutable fuera de navegación real ni en móvil físico).

*Reporte generado con el skill de User Testing (modo QA).*