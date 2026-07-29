"""
Tests for the core rule that failed in production: a network failure must
never clear a stored price. Only OK/NO_PRICE/GONE — signals confirmed by
the store itself — may ever write NULL.
"""

import pytest

from src.scrapers.base_scraper import FetchOutcome, FetchResult, Product
from src.scrapers.pricing import (
    STORES,
    decide_price_update,
    compute_comparison_only,
    compute_on_offer,
)
from src.scrapers.report import StoreRunStats, check_guardrails

NOW = "2026-07-29T00:00:00+00:00"


def _product(price, original=None, url="https://store.example/p"):
    return Product(
        url=url, name="Test Racket", price=price, brand="TestBrand",
        image="", specs={}, original_price=original,
    )


class TestDecidePriceUpdate:
    def test_failed_never_writes_anything(self):
        result = FetchResult(FetchOutcome.FAILED, error="429 Too Many Requests")
        decision = decide_price_update("padelproshop", result, old_price=99.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates == {}
        assert decision.price_changed is False

    def test_failed_leaves_old_price_reported_unchanged(self):
        result = FetchResult(FetchOutcome.FAILED, error="timeout")
        decision = decide_price_update("padelmarket", result, old_price=149.99, now_iso=NOW, url="https://store.example/p")

        assert decision.old_price == 149.99
        assert decision.new_price is None
        assert "padelmarket_actual_price" not in decision.updates

    def test_no_price_clears_when_old_price_existed(self):
        result = FetchResult(FetchOutcome.NO_PRICE, product=_product(price=0.0))
        decision = decide_price_update("padelnuestro", result, old_price=120.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates["padelnuestro_actual_price"] is None
        assert decision.updates["padelnuestro_price_checked_at"] == NOW
        assert decision.price_changed is True

    def test_no_price_is_not_a_change_when_already_null(self):
        result = FetchResult(FetchOutcome.NO_PRICE)
        decision = decide_price_update("padelnuestro", result, old_price=None, now_iso=NOW, url="https://store.example/p")

        assert decision.price_changed is False
        assert decision.updates["padelnuestro_actual_price"] is None

    def test_gone_clears_price_like_no_price(self):
        result = FetchResult(FetchOutcome.GONE)
        decision = decide_price_update("padelproshop", result, old_price=80.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates["padelproshop_actual_price"] is None
        assert decision.price_changed is True

    def test_gone_also_clears_the_link(self):
        # A GONE (301/404) is a confirmed removal — keeping the dead link
        # around means discover keeps bumping last_seen for a URL that no
        # longer exists in the store, and the racket never gets flagged.
        result = FetchResult(FetchOutcome.GONE)
        decision = decide_price_update("padelnuestro", result, old_price=80.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates["padelnuestro_link"] is None

    def test_no_price_keeps_the_link(self):
        # NO_PRICE means the page loaded and confirmed no sellable price —
        # the product still exists at that URL, unlike GONE.
        result = FetchResult(FetchOutcome.NO_PRICE, product=_product(price=0.0))
        decision = decide_price_update("padelnuestro", result, old_price=80.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates["padelnuestro_link"] == "https://store.example/p"

    def test_ok_writes_new_price_and_marks_checked(self):
        # The link column always echoes the caller-supplied `url` (the
        # racket's known URL for this store), not the scraped product's own
        # url field — the two are expected to match in practice, but the
        # decision is keyed off what the caller already knows.
        result = FetchResult(FetchOutcome.OK, product=_product(price=129.0, url="https://s/x"))
        decision = decide_price_update("padelmarket", result, old_price=149.0, now_iso=NOW, url="https://s/x")

        assert decision.updates["padelmarket_actual_price"] == 129.0
        assert decision.updates["padelmarket_link"] == "https://s/x"
        assert decision.updates["padelmarket_price_checked_at"] == NOW
        assert decision.price_changed is True
        assert decision.new_price == 129.0

    def test_ok_computes_discount_percentage(self):
        result = FetchResult(FetchOutcome.OK, product=_product(price=80.0, original=100.0))
        decision = decide_price_update("padelnuestro", result, old_price=100.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates["padelnuestro_discount_percentage"] == 20

    def test_ok_unchanged_price_is_not_flagged_as_changed(self):
        result = FetchResult(FetchOutcome.OK, product=_product(price=100.0))
        decision = decide_price_update("padelproshop", result, old_price=100.0, now_iso=NOW, url="https://store.example/p")

        assert decision.price_changed is False

    def test_ok_tiny_float_drift_is_not_a_change(self):
        result = FetchResult(FetchOutcome.OK, product=_product(price=100.001))
        decision = decide_price_update("padelproshop", result, old_price=100.0, now_iso=NOW, url="https://store.example/p")

        assert decision.price_changed is False

    def test_ok_with_zero_price_is_defensively_treated_as_no_price(self):
        # A scraper bug could report OK with price=0 — must not write a fake price.
        result = FetchResult(FetchOutcome.OK, product=_product(price=0.0))
        decision = decide_price_update("padelmarket", result, old_price=50.0, now_iso=NOW, url="https://store.example/p")

        assert decision.updates["padelmarket_actual_price"] is None

    def test_unknown_store_raises(self):
        result = FetchResult(FetchOutcome.OK, product=_product(price=10.0))
        with pytest.raises(ValueError):
            decide_price_update("not-a-store", result, old_price=None, now_iso=NOW, url="https://store.example/p")

    def test_ok_and_cleared_updates_share_the_same_keys(self):
        # A batch upsert mixing rows with different columns gets the whole
        # batch rejected by PostgREST — every non-empty `updates` dict this
        # function returns must have identical keys, whatever the outcome.
        ok = decide_price_update(
            "padelnuestro", FetchResult(FetchOutcome.OK, product=_product(price=50.0)),
            old_price=None, now_iso=NOW, url="https://store.example/p",
        )
        cleared = decide_price_update(
            "padelnuestro", FetchResult(FetchOutcome.GONE),
            old_price=50.0, now_iso=NOW, url="https://store.example/p",
        )
        assert set(ok.updates.keys()) == set(cleared.updates.keys())
        assert "padelnuestro_link" in ok.updates and "padelnuestro_link" in cleared.updates


class TestComparisonFlags:
    def test_comparison_only_true_when_all_stores_null(self):
        assert compute_comparison_only({s: None for s in STORES}) is True

    def test_comparison_only_false_when_any_store_has_price(self):
        prices = {s: None for s in STORES}
        prices[STORES[0]] = 42.0
        assert compute_comparison_only(prices) is False

    def test_comparison_only_flips_back_to_false(self):
        # The old code only ever set this True — it could never recover once a
        # price came back. Symmetry is the whole point of this helper.
        prices = {s: None for s in STORES}
        assert compute_comparison_only(prices) is True
        prices[STORES[0]] = 10.0
        assert compute_comparison_only(prices) is False

    def test_on_offer_true_with_any_positive_discount(self):
        discounts = {s: 0 for s in STORES}
        discounts[STORES[1]] = 15
        assert compute_on_offer(discounts) is True

    def test_on_offer_false_when_no_discounts(self):
        assert compute_on_offer({s: 0 for s in STORES}) is False


class TestGuardrails:
    def test_no_violations_on_healthy_run(self):
        stats = StoreRunStats(store="padelnuestro", attempted=100, ok=95, no_price=3, gone=2, failed=0, coverage_before=90, coverage_after=93)
        assert check_guardrails(stats) == []

    def test_zero_ok_is_flagged(self):
        stats = StoreRunStats(store="padelproshop", attempted=50, ok=0, failed=50, coverage_before=40, coverage_after=0)
        violations = check_guardrails(stats)
        assert any("0 precios" in v for v in violations)

    def test_high_failure_ratio_is_flagged(self):
        stats = StoreRunStats(store="padelmarket", attempted=100, ok=70, failed=30, coverage_before=90, coverage_after=90)
        violations = check_guardrails(stats)
        assert any("fallaron" in v for v in violations)

    def test_coverage_drop_is_flagged(self):
        stats = StoreRunStats(store="padelproshop", attempted=500, ok=500, failed=0, coverage_before=400, coverage_after=100)
        violations = check_guardrails(stats)
        assert any("cobertura" in v for v in violations)

    def test_no_attempts_means_no_violations(self):
        stats = StoreRunStats(store="padelmarket", attempted=0)
        assert check_guardrails(stats) == []
