# 0001 — `user_profiles` se crea exclusivamente server-side

**Estado:** Aceptada — 2026-08-13

## Contexto

`supabase/migrations/20260728000001_fix_role_privilege_escalation.sql` cerró una escalada de
privilegios real: cualquier usuario autenticado podía hacer
`supabase.from('user_profiles').update({ role: 'Admin' }).eq('id', me)` y saltarse todos los
checks `is_admin()`. La migración lo cerró con `REVOKE UPDATE ON public.user_profiles FROM
authenticated` seguido de un `GRANT UPDATE (...)` **columnar**: solo las columnas de perfil
editables por el propio usuario (nickname, avatar, medidas, preferencias de juego, ...) — nunca
`id`, `email`, `role`, `oauth_provider`, `created_at`, `updated_at`.

La fila de `user_profiles` para un usuario nuevo la crea el trigger `handle_new_user`
(`on_auth_user_created` en `auth.users`), que lee `id`, `email`, `nickname`, `full_name` de
`raw_user_meta_data` y fija `role = 'Player'` siempre server-side.

`AuthContext.signUp` (cliente), sin embargo, seguía haciendo además:

```ts
await supabase.from('user_profiles').upsert({
  id: data.user.id,
  email: data.user.email,
  nickname,
  full_name: fullName ?? null,
});
```

Un `upsert` es un `INSERT ... ON CONFLICT DO UPDATE`: cuando la fila ya existe (el trigger la
creó primero, en la misma transacción de signup), Postgres evalúa el permiso de `UPDATE` sobre
**todas** las columnas del `INSERT`, incluidas `id` y `email` — columnas fuera del `GRANT
UPDATE (...)` de arriba. El resultado era un 403 (`permission denied for table user_profiles`)
en **todo** registro nuevo (hallazgo P0 #3 en `docs/qa/main-2026-08-13.md`), con el usuario de
Auth ya creado pero sin feedback claro y el modal de registro quedando atascado.

## Decisión

`user_profiles` se crea y se puebla en el signup **exclusivamente** por `handle_new_user`. El
cliente nunca inserta ni upsertea esa fila — solo la lee (`fetchProfile` /
`loadAndSetProfile`, un `select`) y la actualiza más adelante a través de las columnas que sí
tiene concedidas (edición de perfil).

Se eliminó el upsert de `AuthContext.signUp`. `signUp` ya envía `nickname`/`full_name` en
`options.data` de `supabase.auth.signUp(...)`, que es exactamente lo que el trigger lee de
`raw_user_meta_data` — no hace falta ninguna segunda escritura desde el cliente.

## Consecuencias

- Si algún día se necesita que el cliente escriba un campo de perfil justo tras el registro, la
  ruta correcta es un `update` (no `upsert`) sobre las columnas ya concedidas en
  `20260728000001_fix_role_privilege_escalation.sql` — nunca reintroducir `id`/`email` en un
  `insert`/`upsert` desde `authenticated`.
- Si el trigger `handle_new_user` alguna vez se deshabilitara, el registro quedaría con el
  usuario de Auth creado pero sin fila de perfil — no hay red de seguridad en cliente. Es un
  trade-off aceptado: la alternativa (mantener el upsert) ya estaba rota por el `GRANT` columnar
  y reabrir sus columnas privilegiadas repetiría el problema que
  `20260728000001_fix_role_privilege_escalation.sql` cerró.
