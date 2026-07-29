"""
report.py — Per-store run metrics, guardrail checks, and the GitHub Actions
step summary. This is what makes the pipeline fail loudly instead of
reporting `success` while writing nothing, which is exactly what happened
for five weeks straight.
"""

import os
from dataclasses import dataclass
from typing import List

from .base_scraper import FetchOutcome

FAILED_RATIO_THRESHOLD = 0.25
COVERAGE_DROP_THRESHOLD_POINTS = 10.0


@dataclass
class StoreRunStats:
    store: str
    attempted: int = 0
    ok: int = 0
    no_price: int = 0
    gone: int = 0
    failed: int = 0
    price_changed: int = 0
    coverage_before: int = 0
    coverage_after: int = 0

    @property
    def failed_ratio(self) -> float:
        return self.failed / self.attempted if self.attempted else 0.0

    @property
    def coverage_before_pct(self) -> float:
        return 100.0 * self.coverage_before / self.attempted if self.attempted else 0.0

    @property
    def coverage_after_pct(self) -> float:
        return 100.0 * self.coverage_after / self.attempted if self.attempted else 0.0

    @property
    def coverage_drop_points(self) -> float:
        return self.coverage_before_pct - self.coverage_after_pct

    def record_outcome(self, outcome: FetchOutcome) -> None:
        self.attempted += 1
        if outcome is FetchOutcome.OK:
            self.ok += 1
        elif outcome is FetchOutcome.NO_PRICE:
            self.no_price += 1
        elif outcome is FetchOutcome.GONE:
            self.gone += 1
        elif outcome is FetchOutcome.FAILED:
            self.failed += 1


def check_guardrails(stats: StoreRunStats) -> List[str]:
    """Violations for a single store's run. Empty list = all clear."""
    violations: List[str] = []
    if stats.attempted == 0:
        return violations

    if stats.ok == 0:
        violations.append(
            f"{stats.store}: 0 precios escritos de {stats.attempted} intentos — el sync no está funcionando."
        )
    if stats.failed_ratio > FAILED_RATIO_THRESHOLD:
        violations.append(
            f"{stats.store}: {stats.failed_ratio:.0%} de los lookups fallaron "
            f"(umbral {FAILED_RATIO_THRESHOLD:.0%}). Posible bloqueo (429/403) de la tienda."
        )
    if stats.coverage_drop_points > COVERAGE_DROP_THRESHOLD_POINTS:
        violations.append(
            f"{stats.store}: cobertura de precios cayó {stats.coverage_drop_points:.1f} puntos "
            f"({stats.coverage_before_pct:.0f}% → {stats.coverage_after_pct:.0f}%, umbral {COVERAGE_DROP_THRESHOLD_POINTS})."
        )
    return violations


def render_summary(stats: StoreRunStats, violations: List[str]) -> str:
    lines = [
        f"## Catalog sync — {stats.store}",
        "",
        "| Intentos | OK | Sin precio | Retirado | Fallos | Cobertura antes→después |",
        "|---|---|---|---|---|---|",
        (
            f"| {stats.attempted} | {stats.ok} | {stats.no_price} | {stats.gone} | {stats.failed} | "
            f"{stats.coverage_before_pct:.0f}% → {stats.coverage_after_pct:.0f}% |"
        ),
        "",
        f"Precios que cambiaron: {stats.price_changed}",
        "",
    ]
    if violations:
        lines.append("### ⚠️ Guardrails violados")
        for v in violations:
            lines.append(f"- {v}")
    else:
        lines.append("✅ Guardrails OK")
    lines.append("")
    return "\n".join(lines)


def write_step_summary(text: str) -> None:
    """Append to $GITHUB_STEP_SUMMARY if running in Actions, else print."""
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)
