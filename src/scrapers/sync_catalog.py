#!/usr/bin/env python3
"""
sync_catalog.py — Sincronización de catálogo para Smashly. Supabase es la
única fuente de verdad; no hay rackets.json.

Dos subcomandos, pensados para correr como dos jobs de GitHub Actions:

  refresh --store <tienda>   Re-scrapea las URLs YA conocidas de una tienda
                              y decide qué precio escribir (nunca escribe
                              NULL por un fallo de red — ver pricing.py).
                              Pensado para una matrix de 3 jobs en paralelo,
                              uno por tienda: un bloqueo en una tienda no
                              alarga ni contamina a las otras.

  discover                   Recorre las páginas de categoría de las 3
                              tiendas, descubre palas nuevas (fuzzy match
                              cross-store vía RacketManager — por eso corre
                              en un único job, no en una matrix), marca
                              descatalogadas y dedupea. Debe ejecutarse
                              DESPUÉS de que las 3 tiendas hayan refrescado
                              (`needs: [refresh]` en el workflow).

Uso:
  python -m src.scrapers.sync_catalog refresh --store padelnuestro
  python -m src.scrapers.sync_catalog refresh --store padelmarket --limit 20 --dry-run
  python -m src.scrapers.sync_catalog discover
  python -m src.scrapers.sync_catalog discover --limit 5 --dry-run
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, Set

# El parche global `ssl._create_default_https_context = _create_unverified_context`
# que había aquí desactivaba la verificación TLS para TODO el proceso, no solo
# para los scrapers. Los scrapers pasan su propio contexto explícito
# (base_scraper.ssl_ctx, que ahora verifica contra el bundle de certifi), así
# que el parche era innecesario además de peligroso.

# ── Path setup (permite `python src/scrapers/sync_catalog.py` además de -m) ─
if __name__ == "__main__" and __package__ is None:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    __package__ = "src.scrapers"

from . import db, report
from . import pricing
from .base_scraper import FetchOutcome, FetchResult
from .padelmarket_scraper import PadelMarketScraper
from .padelnuestro_scraper import PadelNuestroScraper
from .padelproshop_scraper import PadelProShopScraper
from .racket_manager import RacketManager
from .deduplicate_rackets import run as run_deduplication

STORE_CONFIGS = {
    "padelmarket":  (PadelMarketScraper,  "https://padelmarket.com/es-eu/collections/palas"),
    "padelnuestro": (PadelNuestroScraper, "https://www.padelnuestro.com/palas-padel"),
    "padelproshop": (PadelProShopScraper, "https://padelproshop.com/collections/palas-padel"),
}

# Días sin aparecer en el catálogo de TODAS las tiendas para marcar como descatalogada.
DISCONTINUED_THRESHOLD_DAYS = 30

# Concurrencia baja a propósito: padelmarket y padelproshop están detrás de
# Cloudflare y throttlean a IPs de datacenter con 429 + Retry-After 60s.
# Lanzar 5 peticiones a la vez disparaba el rate-limit y quemaba el timeout.
MAX_CONCURRENT_REFRESH = 2
MAX_CONCURRENT_DISCOVER = 2


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _require_env_or_die() -> None:
    missing = db.missing_env_vars()
    if missing:
        print(f"❌ Faltan variables de entorno: {', '.join(missing)}. Abortando antes de scrapear.")
        sys.exit(1)


# ── refresh ──────────────────────────────────────────────────────────────

async def refresh(store: str, limit: int, dry_run: bool, gone_cap: int) -> None:
    _require_env_or_die()
    client = db.get_client()

    rows = db.get_rackets_for_store(client, store)
    if limit:
        rows = rows[:limit]
    print(f"💸 REFRESH [{store}] — {len(rows)} URLs conocidas.")

    cls, _ = STORE_CONFIGS[store]
    scraper = cls()
    await scraper.init()

    stats = report.StoreRunStats(store=store)
    now_iso = _now_utc()
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REFRESH)

    async def process(row: dict):
        async with semaphore:
            url = row[f"{store}_link"]
            old_price = row.get(f"{store}_actual_price")
            try:
                result: FetchResult = await scraper.scrape_product(url)
            except Exception as e:
                result = FetchResult(FetchOutcome.FAILED, error=str(e))
            stats.record_outcome(result.outcome)
            decision = pricing.decide_price_update(store, result, old_price, now_iso, url)
            return row, result, decision

    results = await asyncio.gather(*[process(r) for r in rows])
    await scraper.close()

    rows_to_upsert = []
    price_history_entries = []
    newly_gone = 0  # GONE this run for a link that still had a price stored — a real transition,
                     # not one of the already-dead links every run reconfirms as GONE.

    for row, result, decision in results:
        if row.get(f"{store}_actual_price") is not None:
            stats.coverage_before += 1

        effective_price = row.get(f"{store}_actual_price") if result.outcome is FetchOutcome.FAILED else decision.new_price
        if effective_price is not None:
            stats.coverage_after += 1

        if decision.price_changed:
            stats.price_changed += 1

        if result.outcome is FetchOutcome.GONE and decision.price_changed:
            newly_gone += 1

        if decision.updates:
            rows_to_upsert.append({"id": row["id"], **decision.updates})

        if decision.price_changed and decision.new_price is not None:
            price_history_entries.append({
                "racket_id": row["id"],
                "store": store,
                "price": decision.new_price,
                "original_price": decision.updates.get(f"{store}_original_price"),
                "discount_percentage": decision.updates.get(f"{store}_discount_percentage", 0),
                "recorded_at": now_iso,
            })

    if newly_gone > gone_cap:
        print(
            f"  ❌ {newly_gone} URLs de {store} pasaron a 'gone' (301/404) en este run (de "
            f"{stats.gone} 'gone' totales, el resto ya lo eran), por encima del tope de "
            f"seguridad ({gone_cap}). Posible cambio de esquema de URLs en la tienda — "
            f"abortando sin escribir nada para evitar vaciar el catálogo."
        )
        report.write_step_summary(
            f"## Catalog sync — {store}\n\n"
            f"### ❌ gone_cap superado: {newly_gone} nuevos > {gone_cap} "
            f"(gone totales: {stats.gone}). Nada escrito.\n"
        )
        sys.exit(1)

    if dry_run:
        print(f"  [dry-run] {len(rows_to_upsert)} filas se actualizarían, {len(price_history_entries)} price_history.")
    else:
        db.batch_upsert(client, "rackets", rows_to_upsert)
        db.record_price_history(client, price_history_entries)
        print(f"  💾 {len(rows_to_upsert)} filas actualizadas, {len(price_history_entries)} price_history escritas.")

    violations = report.check_guardrails(stats)
    report.write_step_summary(report.render_summary(stats, violations))
    print(report.render_summary(stats, violations))

    if violations:
        for v in violations:
            print(f"  ⚠️  {v}")
        sys.exit(1)


# ── discover ─────────────────────────────────────────────────────────────

async def discover(limit: int, dry_run: bool, dedupe_cap: int) -> None:
    _require_env_or_die()
    client = db.get_client()

    rows = db.get_all_rackets_for_manager(client)
    manager = RacketManager(client, rows)
    print(f"🔎 DISCOVER — {len(manager.data)} palas conocidas, {len(manager.url_map)} URLs mapeadas.")

    seen_slugs_per_store: Dict[str, Set[str]] = {s: set() for s in STORE_CONFIGS}

    for store_name, (cls, category_url) in STORE_CONFIGS.items():
        print(f"\n{'─' * 50}\n🏪 {store_name}\n{'─' * 50}")
        scraper = cls()
        await scraper.init()
        try:
            urls = await scraper.scrape_category(category_url)
        except Exception as e:
            print(f"  ❌ Error escaneando categoría de {store_name}: {e}")
            await scraper.close()
            continue

        if limit:
            urls = urls[:limit]

        semaphore = asyncio.Semaphore(MAX_CONCURRENT_DISCOVER)
        new_urls = [u for u in urls if u not in manager.url_map]
        for u in urls:
            existing_slug = manager.url_map.get(u)
            if existing_slug:
                seen_slugs_per_store[store_name].add(existing_slug)

        print(f"  {len(urls)} URLs en catálogo, {len(new_urls)} nuevas (resto ya conocidas → las refresca el job refresh).")

        async def scrape_new(url: str):
            async with semaphore:
                try:
                    return url, await scraper.scrape_product(url)
                except Exception as e:
                    return url, FetchResult(FetchOutcome.FAILED, error=str(e))

        new_results = await asyncio.gather(*[scrape_new(u) for u in new_urls])
        await scraper.close()

        for url, result in new_results:
            if result.outcome is FetchOutcome.FAILED or result.product is None:
                continue  # sin señal fiable — se reintenta la semana que viene
            slug = manager.merge_product(result.product, store_name)
            if slug:
                seen_slugs_per_store[store_name].add(slug)

    written = manager.save(dry_run=dry_run)
    print(f"\n{'[dry-run] se persistirían' if dry_run else '💾 Persistidas'} {written} palas tocadas.")

    if dry_run:
        print("[dry-run] omitiendo last_seen / descatalogadas / flags / dedupe.")
        return

    for store_name, slugs in seen_slugs_per_store.items():
        ids = [manager.data[s]["id"] for s in slugs if manager.data.get(s) and manager.data[s].get("id")]
        db.update_last_seen(client, store_name, ids, _now_utc())

    threshold_iso = (datetime.now(timezone.utc) - timedelta(days=DISCONTINUED_THRESHOLD_DAYS)).isoformat()
    marked = db.mark_discontinued(client, threshold_iso)
    print(f"🗑️  {len(marked)} palas marcadas como descatalogadas.")

    changed_flags = db.finalize_comparison_flags(client)
    print(f"🏳️  {changed_flags} palas con comparison_only/on_offer recalculado.")

    print(f"\n{'─' * 50}\n🔁 Deduplicando catálogo...\n{'─' * 50}")
    run_deduplication(dry_run=False, delete_cap=dedupe_cap)

    print(f"\n{'─' * 50}\n📊 Sincronizando métricas radar de palas...\n{'─' * 50}")
    try:
        from .sync_radar_metrics import fetch_rackets_needing_metrics, process_racket
        needing_radar = fetch_rackets_needing_metrics()
        if needing_radar:
            print(f"  Encontradas {len(needing_radar)} palas sin métricas radar. Sincronizando...")
            for racket in needing_radar:
                res = process_racket(racket, apply_fallback=True, dry_run=False)
                print(f"  ✓ [{res.get('source', 'fallback')}]: {res.get('name')}")
        else:
            print("  ✓ Todas las palas del catálogo tienen métricas radar completas.")
    except Exception as e:
        print(f"  ⚠️ Error en sincronización de métricas radar: {e}")


# ── Main ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Smashly — sincronización de catálogo y precios.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_refresh = sub.add_parser("refresh", help="Refresca precios de URLs ya conocidas para una tienda.")
    p_refresh.add_argument("--store", required=True, choices=list(STORE_CONFIGS.keys()))
    p_refresh.add_argument("--limit", type=int, default=None, help="Limitar nº de productos (testing).")
    p_refresh.add_argument("--dry-run", action="store_true")
    p_refresh.add_argument("--gone-cap", type=int, default=40, help="Máximo de 'gone' (301/404) antes de abortar sin escribir.")

    p_discover = sub.add_parser("discover", help="Descubre palas nuevas, marca descatalogadas y dedupea.")
    p_discover.add_argument("--limit", type=int, default=None, help="Limitar URLs de categoría por tienda (testing).")
    p_discover.add_argument("--dry-run", action="store_true")
    p_discover.add_argument("--dedupe-cap", type=int, default=15, help="Máximo de filas que el dedupe puede borrar sin abortar.")

    args = parser.parse_args()

    if args.command == "refresh":
        asyncio.run(refresh(args.store, args.limit, args.dry_run, args.gone_cap))
    else:
        asyncio.run(discover(args.limit, args.dry_run, args.dedupe_cap))
