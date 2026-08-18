# Estructura de ramas

- `main` — **producción**. Solo recibe merges desde `dev` en release. Nunca commits directos, nunca PRs de feature/fix directos.
- `dev` — **integración**, rama por defecto en GitHub. Todas las ramas `feature/*`, `fix/*`, `chore/*`, etc. abren PR contra `dev`.
- Release a producción: PR `dev` → `main` cuando `dev` está estable.

## Flujo

```
feature/x ──PR──▶ dev ──PR (release)──▶ main
fix/y     ──PR──▶ dev
```

1. Rama de trabajo desde `dev`: `git checkout -b fix/algo dev`
2. PR contra `dev` (la skill `develop-pr` ya apunta ahí por defecto).
3. Cuando `dev` acumula lo suficiente para release, PR `dev` → `main`.

## Reglas

- Nunca commitear ni abrir PR de feature/fix directo contra `main`.
- `main` = estado desplegado en producción. Si hace falta un hotfix urgente, rama `hotfix/*` desde `main`, merge a `main` y luego back-merge a `dev`.
