-- ============================================================================
-- Fase 5 — Higiene de RLS (rendimiento, sin cambios de semántica de acceso)
--
-- Este fichero NO ha sido aplicado por el agente que lo generó (regla dura del
-- runbook de la Fase 5: no se permite `apply_migration` en esta fase). Debe
-- revisarse y aplicarse manualmente/por CI.
--
-- Contiene tres bloques independientes, en orden de menor a mayor riesgo:
--   A) auth_rls_initplan   (48 avisos) — envolver auth.uid()/auth.role() en
--      subconsultas (select ...) para que el planner las trate como InitPlan
--      (evaluadas una vez) en vez de re-evaluarlas fila a fila.
--   B) multiple_permissive_policies (26 avisos / 6 combinaciones tabla+acción)
--      — fusionar políticas PERMISSIVE duplicadas de la misma tabla+acción en
--      una sola con el OR ya escrito, para que Postgres no tenga que evaluar
--      y combinar N políticas por fila.
--   C) duplicate_index (6 avisos) — eliminar el índice redundante de cada par
--      idéntico en `rackets`, `price_history` y `recommendations`.
--
-- En NINGÚN bloque se cambia qué filas puede leer/escribir cada rol: el
-- `qual`/`with_check` original se preserva exactamente, solo se envuelve
-- auth.uid()/auth.role() en subconsultas y se fusionan condiciones con OR.
-- ============================================================================


-- ============================================================================
-- BLOQUE A — auth_rls_initplan (48 políticas)
--
-- Para cada política: DROP + CREATE con la MISMA definición (FOR/TO/USING/
-- WITH CHECK), envolviendo únicamente las llamadas a auth.uid()/auth.role()
-- en (select auth.uid()) / (select auth.role()). El resto del qual/with_check
-- se copia tal cual.
--
-- Nota: algunas de estas políticas se vuelven a tocar en el BLOQUE B (donde
-- se fusionan con otra política PERMISSIVE de la misma tabla+acción). Se
-- crean aquí primero, sin optimización de fusión, para que si el script se
-- corta a mitad, lo aplicado hasta este punto ya sea una mejora net-positive
-- por sí sola (todas las políticas quedan con auth.* envuelto, aunque alguna
-- todavía esté duplicada hasta que se ejecute el Bloque B).
-- ============================================================================

-- user_profiles (4 políticas)
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

-- stores (3 políticas)
DROP POLICY IF EXISTS "Admin de tienda puede ver su tienda" ON public.stores;
CREATE POLICY "Admin de tienda puede ver su tienda" ON public.stores
  FOR SELECT
  USING ((select auth.uid()) = admin_user_id);

DROP POLICY IF EXISTS "Admin de tienda puede actualizar su tienda" ON public.stores;
CREATE POLICY "Admin de tienda puede actualizar su tienda" ON public.stores
  FOR UPDATE
  USING ((select auth.uid()) = admin_user_id);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear tiendas" ON public.stores;
CREATE POLICY "Usuarios autenticados pueden crear tiendas" ON public.stores
  FOR INSERT
  WITH CHECK ((select auth.uid()) = admin_user_id);

-- recommendations (2 políticas)
DROP POLICY IF EXISTS "Users can view their own recommendations" ON public.recommendations;
CREATE POLICY "Users can view their own recommendations" ON public.recommendations
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own recommendations" ON public.recommendations;
CREATE POLICY "Users can insert their own recommendations" ON public.recommendations
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- racket_views (4 políticas)
DROP POLICY IF EXISTS "Users can view their own racket views" ON public.racket_views;
CREATE POLICY "Users can view their own racket views" ON public.racket_views
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own racket views" ON public.racket_views;
CREATE POLICY "Users can insert their own racket views" ON public.racket_views
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own racket views" ON public.racket_views;
CREATE POLICY "Users can update their own racket views" ON public.racket_views
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own racket views" ON public.racket_views;
CREATE POLICY "Users can delete their own racket views" ON public.racket_views
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- comparisons (3 políticas; el SELECT se re-toca en el Bloque B)
DROP POLICY IF EXISTS "Users can view their own comparisons" ON public.comparisons;
CREATE POLICY "Users can view their own comparisons" ON public.comparisons
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own comparisons" ON public.comparisons;
CREATE POLICY "Users can insert their own comparisons" ON public.comparisons
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own comparisons" ON public.comparisons;
CREATE POLICY "Users can delete their own comparisons" ON public.comparisons
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- lists (4 políticas)
DROP POLICY IF EXISTS "Select own lists" ON public.lists;
CREATE POLICY "Select own lists" ON public.lists
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Insert own lists" ON public.lists;
CREATE POLICY "Insert own lists" ON public.lists
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Update own lists" ON public.lists;
CREATE POLICY "Update own lists" ON public.lists
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Delete own lists" ON public.lists;
CREATE POLICY "Delete own lists" ON public.lists
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- list_rackets (1 política, FOR ALL)
DROP POLICY IF EXISTS "Access rackets in own lists" ON public.list_rackets;
CREATE POLICY "Access rackets in own lists" ON public.list_rackets
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM lists l
    WHERE l.id = list_rackets.list_id AND l.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM lists l
    WHERE l.id = list_rackets.list_id AND l.user_id = (select auth.uid())
  ));

-- notifications (3 políticas)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- reviews (3 políticas)
DROP POLICY IF EXISTS "Allow authenticated insert reviews" ON public.reviews;
CREATE POLICY "Allow authenticated insert reviews" ON public.reviews
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated update reviews" ON public.reviews;
CREATE POLICY "Allow authenticated update reviews" ON public.reviews
  FOR UPDATE
  USING ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated delete reviews" ON public.reviews;
CREATE POLICY "Allow authenticated delete reviews" ON public.reviews
  FOR DELETE
  USING ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role');

-- review_likes (1 política, FOR ALL)
DROP POLICY IF EXISTS "Allow authenticated manage review_likes" ON public.review_likes;
CREATE POLICY "Allow authenticated manage review_likes" ON public.review_likes
  FOR ALL
  USING ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role')
  WITH CHECK ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role');

-- review_comments (1 política, FOR ALL)
DROP POLICY IF EXISTS "Allow authenticated manage review_comments" ON public.review_comments;
CREATE POLICY "Allow authenticated manage review_comments" ON public.review_comments
  FOR ALL
  USING ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role')
  WITH CHECK ((select auth.uid()) = user_id OR (select auth.role()) = 'service_role');

-- racket_embeddings (1 política, FOR ALL)
DROP POLICY IF EXISTS "Allow service_role manage embeddings" ON public.racket_embeddings;
CREATE POLICY "Allow service_role manage embeddings" ON public.racket_embeddings
  FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- review_embeddings (1 política, FOR ALL)
DROP POLICY IF EXISTS "Allow service_role manage review_embeddings" ON public.review_embeddings;
CREATE POLICY "Allow service_role manage review_embeddings" ON public.review_embeddings
  FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- knowledge_embeddings (1 política, FOR ALL)
DROP POLICY IF EXISTS "Allow service_role manage knowledge_embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Allow service_role manage knowledge_embeddings" ON public.knowledge_embeddings
  FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- contacts (2 políticas)
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view own contacts" ON public.contacts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prospects
    WHERE prospects.id = contacts.prospect_id AND prospects.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
CREATE POLICY "Users can insert own contacts" ON public.contacts
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM prospects
    WHERE prospects.id = contacts.prospect_id AND prospects.user_id = (select auth.uid())
  ));

-- search_queries (2 políticas)
DROP POLICY IF EXISTS "Users can view own searches" ON public.search_queries;
CREATE POLICY "Users can view own searches" ON public.search_queries
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own searches" ON public.search_queries;
CREATE POLICY "Users can insert own searches" ON public.search_queries
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- prospects (3 políticas)
DROP POLICY IF EXISTS "Users can view own prospects" ON public.prospects;
CREATE POLICY "Users can view own prospects" ON public.prospects
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own prospects" ON public.prospects;
CREATE POLICY "Users can insert own prospects" ON public.prospects
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own prospects" ON public.prospects;
CREATE POLICY "Users can update own prospects" ON public.prospects
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- store_prices (3 políticas "_owner"; las "_admin" no llaman a auth.* directamente
-- y no están en el advisor de auth_rls_initplan, se dejan intactas aquí; las 6
-- se re-tocan en el Bloque B para fusionar admin+owner por acción)
DROP POLICY IF EXISTS "store_prices_insert_owner" ON public.store_prices;
CREATE POLICY "store_prices_insert_owner" ON public.store_prices
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "store_prices_update_owner" ON public.store_prices;
CREATE POLICY "store_prices_update_owner" ON public.store_prices
  FOR UPDATE
  USING (store_id IN (
    SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "store_prices_delete_owner" ON public.store_prices;
CREATE POLICY "store_prices_delete_owner" ON public.store_prices
  FOR DELETE
  USING (store_id IN (
    SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid())
  ));

-- conversations (2 políticas)
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT
  USING (
    buyer_id = (select auth.uid())
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "conversations_insert_buyer" ON public.conversations;
CREATE POLICY "conversations_insert_buyer" ON public.conversations
  FOR INSERT
  WITH CHECK (buyer_id = (select auth.uid()));

-- messages (1 política; is_conversation_participant() es una función propia,
-- no auth.*, se deja tal cual — solo se envuelve el auth.uid() directo)
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT
  WITH CHECK (sender_id = (select auth.uid()) AND is_conversation_participant(conversation_id));

-- rackets (3 políticas; is_admin() es una función propia, no auth.*, se deja
-- tal cual — solo se envuelve el auth.uid() directo)
DROP POLICY IF EXISTS "rackets_insert_store_owner_or_admin" ON public.rackets;
CREATE POLICY "rackets_insert_store_owner_or_admin" ON public.rackets
  FOR INSERT
  WITH CHECK (
    is_admin()
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
    OR store_id IS NULL
  );

DROP POLICY IF EXISTS "rackets_update_store_owner_or_admin" ON public.rackets;
CREATE POLICY "rackets_update_store_owner_or_admin" ON public.rackets
  FOR UPDATE
  USING (
    is_admin()
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "rackets_delete_store_owner_or_admin" ON public.rackets;
CREATE POLICY "rackets_delete_store_owner_or_admin" ON public.rackets
  FOR DELETE
  USING (
    is_admin()
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
  );


-- ============================================================================
-- BLOQUE B — multiple_permissive_policies (6 combinaciones tabla+acción,
-- 26 avisos del advisor porque cuenta cada rol heredado por separado:
-- anon, authenticated, authenticator, dashboard_user, supabase_privileged_role)
--
-- Se fusiona cada par de políticas PERMISSIVE de la misma tabla+acción en una
-- sola con el OR de las condiciones originales (ya con auth.* envuelto).
--
-- IMPORTANTE — user_profiles/SELECT NO se fusiona: "Users can view own
-- profile" tiene roles={public} (todos los roles) y "Los perfiles públicos
-- son visibles para usuarios autenticados" tiene roles={authenticated}
-- explícito (TO authenticated). Fusionarlas en una sola política sin TO
-- ampliaría "true" (antes solo para authenticated) a todos los roles
-- (incluido anon), cambiando a quién aplica. Se deja sin tocar.
-- ============================================================================

-- 1/5: comparisons — SELECT
-- Fusiona "Public can view shared comparisons" + "Users can view their own comparisons"
-- (mismos roles={public} en ambas, fusión segura)
DROP POLICY IF EXISTS "Public can view shared comparisons" ON public.comparisons;
DROP POLICY IF EXISTS "Users can view their own comparisons" ON public.comparisons;
CREATE POLICY "Users can view their own or shared comparisons" ON public.comparisons
  FOR SELECT
  USING (
    (is_public = true AND share_token IS NOT NULL)
    OR (select auth.uid()) = user_id
  );

-- 2/5: store_prices — DELETE
-- Fusiona "store_prices_delete_admin" + "store_prices_delete_owner"
-- (mismos roles={public} en ambas, fusión segura)
DROP POLICY IF EXISTS "store_prices_delete_admin" ON public.store_prices;
DROP POLICY IF EXISTS "store_prices_delete_owner" ON public.store_prices;
CREATE POLICY "store_prices_delete_admin_or_owner" ON public.store_prices
  FOR DELETE
  USING (
    is_admin()
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
  );

-- 3/5: store_prices — INSERT
-- Fusiona "store_prices_insert_admin" + "store_prices_insert_owner"
DROP POLICY IF EXISTS "store_prices_insert_admin" ON public.store_prices;
DROP POLICY IF EXISTS "store_prices_insert_owner" ON public.store_prices;
CREATE POLICY "store_prices_insert_admin_or_owner" ON public.store_prices
  FOR INSERT
  WITH CHECK (
    is_admin()
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
  );

-- 4/5: store_prices — UPDATE
-- Fusiona "store_prices_update_admin" + "store_prices_update_owner"
DROP POLICY IF EXISTS "store_prices_update_admin" ON public.store_prices;
DROP POLICY IF EXISTS "store_prices_update_owner" ON public.store_prices;
CREATE POLICY "store_prices_update_admin_or_owner" ON public.store_prices
  FOR UPDATE
  USING (
    is_admin()
    OR store_id IN (SELECT stores.id FROM stores WHERE stores.admin_user_id = (select auth.uid()))
  );

-- 5/5: stores — SELECT
-- Fusiona "Admin de tienda puede ver su tienda" + "stores_select_public"
-- (mismos roles={public} en ambas, fusión segura). Nota: stores_select_public
-- tenía qual=true (lectura abierta a todos), así que el resultado fusionado
-- (true OR ...) sigue siendo equivalente a "true" — el conjunto de filas
-- visibles no cambia respecto al estado anterior (ya era "true OR algo").
DROP POLICY IF EXISTS "Admin de tienda puede ver su tienda" ON public.stores;
DROP POLICY IF EXISTS "stores_select_public" ON public.stores;
CREATE POLICY "stores_select_public_or_admin" ON public.stores
  FOR SELECT
  USING (
    true
    OR (select auth.uid()) = admin_user_id
  );


-- ============================================================================
-- BLOQUE C — duplicate_index (6 avisos)
--
-- Cada par de índices es idéntico (misma tabla, misma columna, mismo tipo).
-- Se conserva el que sigue la convención de nombres más consistente/legible
-- del resto del esquema y se elimina el redundante.
-- ============================================================================

-- 1/6: price_history.racket_id
-- Kept: idx_price_history_racket_id (nombre de tabla completo, patrón idx_<tabla>_<columna>)
-- Dropped: idx_ph_racket_id (abreviatura de tabla, duplicado redundante)
DROP INDEX IF EXISTS public.idx_ph_racket_id;

-- 2/6: rackets.brand
-- Kept: rackets_brand_idx (el nombre coincide con la columna real "brand")
-- Dropped: idx_rackets_marca (nombre en español "marca" no coincide con la
-- columna en inglés "brand", induce a error, duplicado redundante)
DROP INDEX IF EXISTS public.idx_rackets_marca;

-- 3/6: rackets.characteristics_balance
-- Kept: rackets_balance_idx (convención "_idx" consistente con el resto de
-- índices de características de rackets)
-- Dropped: idx_rackets_caracteristicas_balance (nombre en español, duplicado)
DROP INDEX IF EXISTS public.idx_rackets_caracteristicas_balance;

-- 4/6: rackets.characteristics_game_level
-- Kept: rackets_game_level_idx (convención "_idx" consistente)
-- Dropped: idx_rackets_caracteristicas_nivel (nombre en español, duplicado)
DROP INDEX IF EXISTS public.idx_rackets_caracteristicas_nivel;

-- 5/6: rackets.characteristics_shape
-- Kept: rackets_shape_idx (convención "_idx" consistente)
-- Dropped: idx_rackets_caracteristicas_forma (nombre en español, duplicado)
DROP INDEX IF EXISTS public.idx_rackets_caracteristicas_forma;

-- 6/6: recommendations.user_id
-- Kept: recommendations_user_id_idx (convención "_idx" consistente con los
-- índices de rackets)
-- Dropped: idx_recommendations_user_id (duplicado redundante, "idx_" prefix)
DROP INDEX IF EXISTS public.idx_recommendations_user_id;
