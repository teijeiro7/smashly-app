# Diseño: Búsqueda Fuzzy con pg_trgm para Palas

**Fecha:** 2026-05-04  
**Autor:** opencode  
**Estado:** Aprobado por usuario

## Resumen Ejecutivo

Implementar una búsqueda fuzzy basada en PostgreSQL `pg_trgm` para reemplazar la búsqueda actual por palabras exactas en el catálogo de palas y el buscador global. La búsqueda debe permitir encontrar palas escribiendo palabras en cualquier orden ("Genius 12K", "AT10 2025") y funcionar simultáneamente con los filtros avanzados existentes (marca, forma, balance, etc.).

## Contexto Actual

### Stack Tecnológico
- **Backend:** Express + TypeScript + Supabase (PostgreSQL)
- **Frontend:** React + Vite + TypeScript
- **Base de datos:** PostgreSQL en Supabase
- **Infraestructura RAG existente:** Embeddings en `racket_embeddings` (no se usará para esta funcionalidad)

### Búsqueda Actual (a reemplazar)
```typescript
// CatalogPage.tsx - Frontend
const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
return searchWords.every(word => combinedText.includes(word));

// racketService.ts - Backend
.or(`name.ilike.%${query}%, brand.ilike.%${query}%, model.ilike.%${query}%`)
```

**Problemas actuales:**
- Requiere palabras exactas y en el texto
- "Genius 12K" no encuentra "Nox AT10 Genius 12K" si falta una palabra
- No ordena por relevancia
- Filtrado completo en frontend limita a palas cargadas

## Requisitos

### Funcionales
1. Búsqueda por texto libre que funcione con palabras en cualquier orden
2. Integración con filtros avanzados (marca, forma, balance, nucleo, cara, nivel, tipo_juego, dureza)
3. Soporte para filtros booleanos (solo disponibles, en oferta, más vistos)
4. Búsqueda en múltiples campos: nombre, marca, modelo, características
5. Ordenación por relevancia (similarity score)
6. Debe funcionar tanto en el buscador del catálogo como en el global del header

### No Funcionales
- Latencia < 100ms para búsquedas
- Sin costes adicionales (no usar OpenRouter)
- Mantener compatibilidad con filtros existentes
- No romper la UX actual (debounce, loading states)

## Diseño Técnico

### 1. Base de Datos

#### 1.1 Extensión pg_trgm
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### 1.2 Columna search_document
Columna generada automáticamente que combina todos los campos buscables:

```sql
ALTER TABLE rackets 
ADD COLUMN IF NOT EXISTS search_document TEXT 
GENERATED ALWAYS AS (
  COALESCE(name, '') || ' ' || 
  COALESCE(brand, '') || ' ' || 
  COALESCE(model, '') || ' ' ||
  COALESCE(characteristics_product, '') || ' ' ||
  COALESCE(characteristics_shape, '') || ' ' ||
  COALESCE(characteristics_balance, '') || ' ' ||
  COALESCE(characteristics_core, '') || ' ' ||
  COALESCE(characteristics_face, '') || ' ' ||
  COALESCE(characteristics_hardness, '') || ' ' ||
  COALESCE(characteristics_game_level, '') || ' ' ||
  COALESCE(characteristics_game_type, '') || ' ' ||
  COALESCE(characteristics_player_collection, '') || ' ' ||
  COALESCE(characteristics_player, '') || ' ' ||
  COALESCE(characteristics_finish, '') || ' ' ||
  COALESCE(characteristics_surface, '')
) STORED;
```

#### 1.3 Índices
```sql
-- Índice GIN para búsqueda fuzzy rápida
CREATE INDEX rackets_search_trgm 
ON rackets USING gin(search_document gin_trgm_ops);

-- Índices para filtros (ya existen parcialmente, verificar)
CREATE INDEX IF NOT EXISTS rackets_brand_idx ON rackets(brand);
CREATE INDEX IF NOT EXISTS rackets_shape_idx ON rackets(characteristics_shape);
CREATE INDEX IF NOT EXISTS rackets_balance_idx ON rackets(characteristics_balance);
CREATE INDEX IF NOT EXISTS rackets_core_idx ON rackets(characteristics_core);
CREATE INDEX IF NOT EXISTS rackets_face_idx ON rackets(characteristics_face);
CREATE INDEX IF NOT EXISTS rackets_hardness_idx ON rackets(characteristics_hardness);
CREATE INDEX IF NOT EXISTS rackets_game_level_idx ON rackets(characteristics_game_level);
CREATE INDEX IF NOT EXISTS rackets_game_type_idx ON rackets(characteristics_game_type);
```

#### 1.4 Función RPC search_rackets_fuzzy

```sql
CREATE OR REPLACE FUNCTION search_rackets_fuzzy(
  search_query TEXT,
  filter_brand TEXT DEFAULT NULL,
  filter_shape TEXT DEFAULT NULL,
  filter_balance TEXT DEFAULT NULL,
  filter_core TEXT DEFAULT NULL,
  filter_face TEXT DEFAULT NULL,
  filter_game_level TEXT DEFAULT NULL,
  filter_game_type TEXT DEFAULT NULL,
  filter_hardness TEXT DEFAULT NULL,
  filter_available_only BOOLEAN DEFAULT FALSE,
  filter_on_offer BOOLEAN DEFAULT FALSE,
  filter_most_viewed BOOLEAN DEFAULT FALSE,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS TABLE(
  id INT,
  name TEXT,
  brand TEXT,
  model TEXT,
  similarity_score REAL,
  -- Todos los demás campos de la tabla rackets
  characteristics_brand TEXT,
  characteristics_shape TEXT,
  characteristics_balance TEXT,
  characteristics_core TEXT,
  characteristics_face TEXT,
  characteristics_format TEXT,
  characteristics_hardness TEXT,
  characteristics_game_level TEXT,
  characteristics_finish TEXT,
  characteristics_surface TEXT,
  characteristics_game_type TEXT,
  characteristics_player_collection TEXT,
  characteristics_player TEXT,
  characteristics_color TEXT,
  characteristics_color_2 TEXT,
  characteristics_product TEXT,
  specs JSONB,
  images TEXT[],
  description TEXT,
  on_offer BOOLEAN,
  comparison_only BOOLEAN,
  view_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  padelnuestro_actual_price NUMERIC,
  padelnuestro_original_price NUMERIC,
  padelnuestro_discount_percentage NUMERIC,
  padelnuestro_link TEXT,
  padelmarket_actual_price NUMERIC,
  padelmarket_original_price NUMERIC,
  padelmarket_discount_percentage NUMERIC,
  padelmarket_link TEXT,
  padelproshop_actual_price NUMERIC,
  padelproshop_original_price NUMERIC,
  padelproshop_discount_percentage NUMERIC,
  padelproshop_link TEXT,
  radar_potencia NUMERIC,
  radar_control NUMERIC,
  radar_manejabilidad NUMERIC,
  radar_punto_dulce NUMERIC,
  radar_salida_bola NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.brand,
    r.model,
    similarity(r.search_document, search_query)::REAL as similarity_score,
    r.characteristics_brand,
    r.characteristics_shape,
    r.characteristics_balance,
    r.characteristics_core,
    r.characteristics_face,
    r.characteristics_format,
    r.characteristics_hardness,
    r.characteristics_game_level,
    r.characteristics_finish,
    r.characteristics_surface,
    r.characteristics_game_type,
    r.characteristics_player_collection,
    r.characteristics_player,
    r.characteristics_color,
    r.characteristics_color_2,
    r.characteristics_product,
    r.specs,
    r.images,
    r.description,
    r.on_offer,
    r.comparison_only,
    r.view_count,
    r.created_at,
    r.updated_at,
    r.padelnuestro_actual_price,
    r.padelnuestro_original_price,
    r.padelnuestro_discount_percentage,
    r.padelnuestro_link,
    r.padelmarket_actual_price,
    r.padelmarket_original_price,
    r.padelmarket_discount_percentage,
    r.padelmarket_link,
    r.padelproshop_actual_price,
    r.padelproshop_original_price,
    r.padelproshop_discount_percentage,
    r.padelproshop_link,
    r.radar_potencia,
    r.radar_control,
    r.radar_manejabilidad,
    r.radar_punto_dulce,
    r.radar_salida_bola
  FROM rackets r
  WHERE 
    similarity(r.search_document, search_query) > 0.1
    AND (filter_brand IS NULL OR r.brand = filter_brand)
    AND (filter_shape IS NULL OR r.characteristics_shape = filter_shape)
    AND (filter_balance IS NULL OR r.characteristics_balance = filter_balance)
    AND (filter_core IS NULL OR r.characteristics_core = filter_core)
    AND (filter_face IS NULL OR r.characteristics_face = filter_face)
    AND (filter_game_level IS NULL OR r.characteristics_game_level = filter_game_level)
    AND (filter_game_type IS NULL OR r.characteristics_game_type = filter_game_type)
    AND (filter_hardness IS NULL OR r.characteristics_hardness = filter_hardness)
    AND (filter_available_only = FALSE OR r.comparison_only = FALSE)
    AND (filter_on_offer = FALSE OR r.on_offer = TRUE)
  ORDER BY similarity_score DESC, r.view_count DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Comentario para documentación
COMMENT ON FUNCTION search_rackets_fuzzy IS 
'Búsqueda fuzzy de palas usando pg_trgm. Permite buscar palabras en cualquier orden.
Ejemplo: "genius 12k" encuentra "Nox AT10 Genius 12K".
Parámetros:
  - search_query: Texto a buscar
  - filter_*: Filtros opcionales (NULL = no aplicar)
  - filter_available_only: Solo palas disponibles para compra
  - filter_on_offer: Solo palas en oferta
  - result_limit: Máximo resultados (default 50)
  - result_offset: Para paginación (default 0)';
```

#### 1.5 Script SQL de Migración
Crear archivo: `backend/api/src/sql/2026-05-04-add-fuzzy-search.sql`

### 2. Backend (API)

#### 2.1 Modificar RacketService

Archivo: `backend/api/src/services/racketService.ts`

**Nueva función:**
```typescript
static async searchRacketsFuzzy(
  query: string,
  filters: SearchFilters = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<PaginatedResponse<Racket[]>> {
  const { data, error } = await supabase.rpc('search_rackets_fuzzy', {
    search_query: query.trim(),
    filter_brand: filters.brand || null,
    filter_shape: filters.shape || null,
    filter_balance: filters.balance || null,
    filter_core: filters.core || null,
    filter_face: filters.face || null,
    filter_game_level: filters.game_level || null,
    filter_game_type: filters.game_type || null,
    filter_hardness: filters.hardness || null,
    filter_available_only: filters.available_only || false,
    filter_on_offer: filters.on_offer || false,
    filter_most_viewed: filters.most_viewed || false,
    result_limit: pagination.limit || 50,
    result_offset: pagination.offset || 0,
  });

  if (error) {
    logger.error('Error in fuzzy search:', error);
    throw new Error(`Error en búsqueda: ${error.message}`);
  }

  const processedData = processRacketData(data || []);
  return {
    data: processedData.map(mapToFrontendFormat),
    count: data?.length || 0,
  };
}
```

**Modificar searchRackets existente:**
- Mantener como fallback o deprecar gradualmente
- O reemplazar directamente si no hay otros consumidores

#### 2.2 Modificar Controller

Archivo: `backend/api/src/controllers/racketController.ts`

**Modificar método searchRackets:**
```typescript
static async searchRackets(req: Request, res: Response): Promise<void> {
  const query = req.query.q as string;
  
  if (!query || query.trim().length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  // Extraer filtros de query params
  const filters: SearchFilters = {
    brand: req.query.brand as string,
    shape: req.query.shape as string,
    balance: req.query.balance as string,
    // ... resto de filtros
  };

  try {
    const result = await RacketService.searchRacketsFuzzy(query.trim(), filters);
    res.json(result);
  } catch (error) {
    logger.error('Error in searchRackets:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}
```

#### 2.3 Validación

El endpoint actual ya tiene `validateSearchQuery`, verificar que permita queries de 2+ caracteres.

### 3. Frontend

#### 3.1 Modificar CatalogPage

Archivo: `frontend/src/pages/CatalogPage.tsx`

**Cambios:**
- Reemplazar lógica de filtrado frontend por llamada a API
- Mantener estado de filtros y búsqueda
- Agregar loading state durante búsqueda
- Preservar ordenación por relevancia del backend

**Nueva lógica de búsqueda:**
```typescript
// Reemplazar useEffect de filtrado actual
useEffect(() => {
  const performSearch = async () => {
    if (!searchQuery.trim() && !hasActiveFilters()) {
      setFilteredRackets(rackets);
      return;
    }

    setIsSearching(true);
    try {
      const filters = {
        brand: selectedBrand !== 'Todas' ? selectedBrand : undefined,
        shape: selectedShape !== 'Todas' ? selectedShape : undefined,
        // ... resto de filtros
      };

      const result = await RacketService.searchRackets(searchQuery, filters);
      setFilteredRackets(result.data);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback: búsqueda local simple
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = setTimeout(performSearch, 300);
  return () => clearTimeout(debouncedSearch);
}, [searchQuery, selectedBrand, selectedShape, /* ... */]);
```

#### 3.2 Modificar GlobalSearch

Archivo: `frontend/src/components/features/GlobalSearch.tsx`

**Cambios:**
- Usar endpoint `/api/rackets/search` con debounce
- Mostrar top 5 resultados con autocomplete
- Resaltar términos coincidentes
- Navegar al catálogo con query al presionar Enter

#### 3.3 Actualizar racketService (frontend)

Archivo: `frontend/src/services/racketService.ts`

**Modificar searchRackets:**
```typescript
static async searchRackets(
  query: string, 
  filters?: Record<string, string>
): Promise<Racket[]> {
  const params = new URLSearchParams({ q: query });
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const url = buildApiUrl(API_ENDPOINTS.RACKETS_SEARCH, params);
  // ... resto igual
}
```

### 4. Manejo de Casos Especiales

#### 4.1 Búsqueda Vacía
- Si query está vacía y hay filtros: usar endpoint de filtros existente
- Si query está vacía y no hay filtros: mostrar todas las palas

#### 4.2 Búsqueda Corta (< 2 caracteres)
- No ejecutar búsqueda fuzzy
- Mostrar mensaje "Escribe al menos 2 caracteres"
- O usar búsqueda exacta (ilike) como fallback

#### 4.3 Sin Resultados
- Mostrar mensaje con sugerencias
- Botón para limpiar filtros
- Sugerir términos similares (opcional futuro)

#### 4.4 Filtro "Más Vistos"
- Como no hay campo `is_bestseller`, usar `view_count` DESC
- Aplicar después de la búsqueda fuzzy (post-filtrado)

## Ejemplos de Uso

### Caso 1: Búsqueda simple
```
GET /api/rackets/search?q=genius+12k
```
Resultado: Nox AT10 Genius 12K, Nox AT10 Genius 18K, etc.

### Caso 2: Búsqueda + filtros
```
GET /api/rackets/search?q=at10&brand=Nox&shape=Diamante
```
Resultado: Solo palas AT10 de Nox con forma diamante

### Caso 3: Búsqueda global
```
GET /api/rackets/search?q=vertex&limit=5
```
Resultado: Top 5 palas Vertex (Bullpadel)

## Métricas de Éxito

- [ ] Búsqueda "genius 12k" encuentra "Nox AT10 Genius 12K"
- [ ] Búsqueda "at10 2025" encuentra todas las AT10 de 2025
- [ ] Búsqueda "carbon" encuentra palas con carbono en nombre/especificaciones
- [ ] Tiempo de respuesta < 100ms para queries simples
- [ ] Funciona con filtros combinados (marca + forma + búsqueda)
- [ ] Sin costes adicionales (sin llamadas OpenRouter)

## Plan de Rollout

1. **Fase 1:** Crear columna search_document e índices (sin afectar producción)
2. **Fase 2:** Crear función RPC en Supabase
3. **Fase 3:** Implementar endpoint backend con feature flag
4. **Fase 4:** Actualizar frontend del catálogo
5. **Fase 5:** Actualizar búsqueda global
6. **Fase 6:** Testing y validación
7. **Fase 7:** Activar en producción y deprecar búsqueda antigua

## Notas de Implementación

- **pg_trgm similarity threshold:** 0.1 es conservador. Ajustar a 0.2 si hay demasiados falsos positivos.
- **Índice GIN vs GiST:** GIN es mejor para lecturas frecuentes (nuestro caso).
- **search_document:** Considerar añadir specs JSONB parseado si se necesita buscar dentro de especificaciones técnicas.
- **Mantenimiento:** La columna es GENERATED ALWAYS, se actualiza automáticamente al modificar datos.

## Dependencias

- Extensión `pg_trgm` habilitada en Supabase
- Acceso a SQL Editor de Supabase para ejecutar migración
- No requiere nuevas dependencias npm

## Referencias

- [PostgreSQL pg_trgm documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search)
- Archivos existentes con búsqueda: `CatalogPage.tsx`, `GlobalSearch.tsx`, `racketService.ts` (backend y frontend)
