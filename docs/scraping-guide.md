# 🕷️ Guía de Scraping — Catalog & Price Sync

Cómo funciona la sincronización de catálogo y precios en GitHub Actions.
Supabase es la **única** fuente de verdad — no hay `rackets.json` ni ningún
otro artefacto intermedio.

---

## Workflow: `Catalog & Price Sync` (`.github/workflows/price-sync.yml`)

Corre cada domingo a las 05:00 UTC, en tres jobs encadenados:

1. **`check-secrets`** — verifica que `SUPABASE_URL` y
   `SUPABASE_SERVICE_ROLE_KEY` están configurados como secrets del repo.
   Si falta alguno, el workflow muere en segundos en vez de gastar minutos
   scrapeando para no escribir nada.

2. **`refresh`** — matrix de 3 jobs en paralelo, uno por tienda
   (`padelmarket`, `padelnuestro`, `padelproshop`). Cada uno re-scrapea
   **solo** las URLs de producto ya conocidas para esa tienda y decide qué
   precio escribir. Un 429/403/timeout **nunca** borra un precio existente
   — solo un 404 confirmado o una página que carga pero no ofrece precio lo
   hace (ver `src/scrapers/pricing.py`). Cada job publica un resumen
   (intentos, OK, sin precio, retirado, fallos, cobertura antes→después) en
   el step summary de su propio run, y falla si:
   - escribió 0 precios,
   - más del 25% de los lookups fallaron,
   - la cobertura de esa tienda cayó más de 10 puntos frente al valor anterior.

3. **`discover`** (`needs: refresh`) — un único job secuencial que:
   - recorre las páginas de categoría de las 3 tiendas,
   - descubre productos nuevos y los añade al catálogo (usa fuzzy matching
     cruzado entre tiendas — por eso es un job único y no una matrix, para
     no crear duplicados por condición de carrera),
   - marca como descatalogadas las palas que llevan >30 días sin aparecer
     en ninguna tienda,
   - recalcula `comparison_only`/`on_offer` para todo el catálogo,
   - dedupea (con un techo de borrado de seguridad, ver más abajo),
   - sincroniza radar metrics para las palas que aún no las tengan.

Si falla un fallo de scraping puntual, GitHub ya envía el email nativo de
"scheduled workflow failed" a quien tenga notificaciones activadas en el
repo — no hay ninguna integración de email de terceros que mantener.

---

## Ejecutar manualmente

**GitHub → Actions → Catalog & Price Sync → Run workflow.**

Parámetros opcionales:

| Parámetro | Descripción |
| --- | --- |
| `limit` | Limita el número de productos/URLs por tienda. Útil para probar sin esperar el run completo. |
| `dry_run` | No escribe nada en Supabase; solo imprime lo que haría. |

También se puede invocar cada subcomando directamente en local:

```bash
cd src/scrapers
pip install -r requirements.txt

# Refresca precios de una tienda
python -m src.scrapers.sync_catalog refresh --store padelproshop --limit 20 --dry-run

# Descubre palas nuevas, marca descatalogadas, dedupea
python -m src.scrapers.sync_catalog discover --limit 5 --dry-run
```

Necesitas `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en tu `.env` local.

---

## Dedupe: techo de borrado

`deduplicate_rackets.py` borra filas del catálogo (fusiona duplicados en el
canónico y elimina el resto). Corre desatendido cada semana dentro del job
`discover`, así que tiene un techo por defecto de **15 filas** por
ejecución: si el plan de borrado supera ese número, no borra nada y vuelca
el plan completo a los logs para revisión manual.

```bash
# Revisar qué borraría sin tocar nada
python -m src.scrapers.deduplicate_rackets --dry-run

# Ejecutar con el techo por defecto (15)
python -m src.scrapers.deduplicate_rackets

# Ejecutar sin techo (solo si ya revisaste el plan a mano)
python -m src.scrapers.deduplicate_rackets --no-cap
```

`scripts/dedup_rackets.py` es una herramienta manual aparte, con reglas de
detección distintas (sufijos de edición de jugador, `comparison_only` por
substring). No está conectada al workflow — solo para limpieza puntual.

---

## Arquitectura de los módulos

| Archivo | Responsabilidad |
| --- | --- |
| `base_scraper.py` | Contrato `FetchOutcome`/`FetchResult`, retry sync con backoff + `Retry-After`. |
| `padel{market,nuestro,proshop}_scraper.py` | Un scraper por tienda, implementan `scrape_product`/`scrape_category`. |
| `pricing.py` | Lógica pura: qué escribir según el resultado del scrape. Sin red, sin Supabase — es lo único con tests (`tests/scrapers/test_pricing.py`). |
| `db.py` | Todo el I/O de Supabase: paginación en lecturas completas, escritura en batch. |
| `report.py` | Métricas por tienda, guardrails, step summary. |
| `racket_manager.py` | Deduplicación cruzada entre tiendas (fuzzy match), merge de specs/imágenes. Persiste contra Supabase. |
| `sync_catalog.py` | Orquestador fino: subcomandos `refresh` y `discover`. |
| `deduplicate_rackets.py` | Limpieza de duplicados con techo de borrado. |
| `sync_radar_metrics.py` | Sincroniza métricas radar desde fuentes externas para palas que aún no las tienen. |

---

## Solución de problemas

### El job `refresh` de una tienda falla con "0 precios escritos"

La tienda está bloqueando el scraping por completo (403/429 persistente) o
cambió su estructura de API/HTML. Revisa el step summary del job para ver
el desglose de fallos.

### El job `discover` no descubre productos nuevos

Comprueba que la página de categoría configurada en `STORE_CONFIGS`
(`sync_catalog.py`) sigue siendo válida — las tiendas cambian sus rutas de
colección de vez en cuando.

### El dedupe abortó por el techo de borrado

Revisa el log del job `discover`: lista cada fila que borraría y su
canónico. Si el plan es correcto, ejecuta
`python -m src.scrapers.deduplicate_rackets` en local (o con `--no-cap`).
