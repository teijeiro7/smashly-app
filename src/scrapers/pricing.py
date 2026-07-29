"""
pricing.py — Pure decision logic for what to write to Supabase after a scrape.

No network, no Supabase client, no prints. This is the piece that failed
before: a 429/403 used to be written as `{store}_actual_price = NULL`,
silently destroying real prices. The rule enforced here is:

    FAILED (network/parse failure) → write nothing, ever.
    NO_PRICE / GONE (confirmed by the store) → clear the price.
    OK → write the new price.

`decide_price_update` is called once per (racket, store). The caller
aggregates the per-store `PriceDecision.updates` dicts into a single
Supabase update payload, then calls `compute_comparison_only` across all
three stores' resulting prices to decide the racket-level flag.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional

from .base_scraper import FetchOutcome, FetchResult

STORES = ("padelnuestro", "padelmarket", "padelproshop")

# A price is only considered "changed" (and worth a price_history row) past
# this absolute delta — avoids float-rounding noise creating phantom history.
PRICE_CHANGE_EPSILON = 0.01


@dataclass
class PriceDecision:
    """What to write for a single (racket, store) pair, and whether it moved."""

    updates: Dict[str, object] = field(default_factory=dict)
    price_changed: bool = False
    new_price: Optional[float] = None
    old_price: Optional[float] = None


def decide_price_update(
    store: str,
    result: FetchResult,
    old_price: Optional[float],
    now_iso: str,
    url: str,
) -> PriceDecision:
    """
    Decide what to write for one store's price column, given the scrape
    outcome and the price currently stored in the DB.

    FAILED never appears in `updates` — a network failure carries no
    information about the product's actual price.

    `url` must be the racket's already-known URL for this store (the caller
    has it — that's what got scraped). Every non-empty `updates` dict below
    always carries the SAME set of keys (including the link column)
    regardless of outcome: a batch upsert mixing rows with different key
    sets makes PostgREST reject the whole batch, since it requires every
    row in a bulk upsert to share identical columns.
    """
    if store not in STORES:
        raise ValueError(f"unknown store: {store}")

    if result.outcome is FetchOutcome.FAILED:
        return PriceDecision(updates={}, price_changed=False, new_price=None, old_price=old_price)

    checked_col = f"{store}_price_checked_at"
    link_col = f"{store}_link"

    def _cleared(drop_link: bool = False) -> PriceDecision:
        updates = {
            f"{store}_actual_price": None,
            f"{store}_original_price": None,
            f"{store}_discount_percentage": 0,
            link_col: None if drop_link else url,
            checked_col: now_iso,
        }
        return PriceDecision(
            updates=updates,
            price_changed=old_price is not None,
            new_price=None,
            old_price=old_price,
        )

    if result.outcome in (FetchOutcome.NO_PRICE, FetchOutcome.GONE):
        # GONE = la URL está confirmada muerta (301/404): también se retira el
        # link, así deja de entrar en url_map y discover no vuelve a bombear
        # last_seen para una fila que ya no existe en la tienda.
        return _cleared(drop_link=result.outcome is FetchOutcome.GONE)

    # OK — but defend against a scraper reporting OK with no real price.
    product = result.product
    new_price = product.price if product else None
    if not new_price or new_price <= 0:
        return _cleared()

    original = product.original_price
    discount = 0
    if original and original > new_price:
        discount = round((1 - new_price / original) * 100)

    updates = {
        f"{store}_actual_price": new_price,
        f"{store}_original_price": original,
        f"{store}_discount_percentage": discount,
        link_col: url,
        checked_col: now_iso,
    }
    price_changed = old_price is None or abs(float(old_price) - float(new_price)) > PRICE_CHANGE_EPSILON
    return PriceDecision(updates=updates, price_changed=price_changed, new_price=new_price, old_price=old_price)


def compute_comparison_only(resulting_prices: Dict[str, Optional[float]]) -> bool:
    """
    True only when every known store price is None. Symmetric by
    construction — unlike the old code, this can flip back to False the
    moment any store reports a real price again.
    """
    return all(resulting_prices.get(store) is None for store in STORES)


def compute_on_offer(resulting_discounts: Dict[str, int]) -> bool:
    """True if any store currently reports a positive discount."""
    return any((resulting_discounts.get(store) or 0) > 0 for store in STORES)
