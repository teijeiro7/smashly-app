# Plan 001: AuthSessionManager & Resiliencia de Sesión

## Contexto y Razón
Actualmente la gestión de sesión de Supabase está distribuida entre `AuthContext.tsx`, `router.tsx` y `getAuthHeaders()`. En recargas de página o reconexiones, las llamadas a `getSession()` y `onAuthStateChange` compiten entre sí cargando el perfil de usuario de forma redundante. Este plan centraliza la hidratación de sesión en un único gestor de estado.

## Archivos en Alcance
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/router.tsx`
- `frontend/src/config/api.ts`

## Pasos de Ejecución

1. **Refresco Transparente de Token JWT**:
   - Garantizar que `getAuthHeaders()` compruebe la caducidad del token (expiring within 60s) y ejecute `supabase.auth.refreshSession()` automáticamente.
2. **Promesa `ready` Determinista**:
   - Asegurar que `readyResolveRef.current()` se llame únicamente tras haber completado tanto la comprobación de sesión como la carga/fallback del perfil.
3. **Desacoplamiento de `GlobalStyles`**:
   - Mantener `<GlobalStyles />` por encima de `<ErrorBoundary>` en `main.tsx` para garantizar que las variables CSS de tema existan en todo momento.

## Criterios de Aceptación
- [x] `cd frontend && npx tsc --noEmit` sin errores de tipo.
- [x] `cd frontend && pnpm test --run` aprueba todas las pruebas de `AuthContext.test.tsx` y `router.guards.test.ts`.
