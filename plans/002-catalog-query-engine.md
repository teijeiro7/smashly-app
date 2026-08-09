# Plan 002: Catalog Query Engine & Debouncing

## Contexto y Razón
`CatalogPage.tsx` contenía un bucle de re-renderizado infinito entre los efectos de `searchParams` y `navigate()`, además de lanzar peticiones HTTP a la API en cada pulsación de tecla tecleada. Este plan aísla la lógica de búsqueda y parámetros en un hook desacoplado `useCatalogQuery`.

## Archivos en Alcance
- `frontend/src/pages/CatalogPage.tsx`
- `frontend/src/hooks/useDebounce.ts`
- `frontend/src/services/racketService.ts`

## Pasos de Ejecución

1. **Integración de `useDebounce`**:
   - Aplicar `useDebounce(searchQuery, 300)` para pausar la ejecución de búsquedas API al teclear.
2. **Guarda de Sincronización URL**:
   - Comparar `JSON.stringify(searchParams)` con el nuevo objeto de filtros antes de llamar a `navigate({ replace: true })`, rompiendo el bucle de renderizado.
3. **Optimización de Proyecciones**:
   - Utilizar `CATALOG_SELECT_FIELDS` en `racketService.ts` para no descargar descripciones ni columnas pesadas durante la búsqueda en catálogo.

## Criterios de Aceptación
- [x] Navegar por el catálogo, escribir búsquedas y cambiar filtros ocurre de forma fluida sin bloqueos de interfaz ni bucles de renderizado.
- [x] `cd frontend && npx tsc --noEmit` aprueba con 0 errores.
