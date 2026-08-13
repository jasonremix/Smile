"""Formatierung von Reports: Konsolen-Tabellen und CSV-Export.

Bewusst ohne Zusatzabhängigkeit (kein ``tabulate``/``rich``) — das Tool
verwaltet echtes Werbebudget, da soll die Abhängigkeitsliste so klein
und prüfbar wie möglich bleiben.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

from nata_ads.providers.base import Campaign, Metrics

_COLUMNS = [
    "Plattform",
    "Kampagne",
    "Status",
    "Budget/Tag",
    "Spend",
    "Klicks",
    "Conversions",
    "CPA",
]


def _fmt_cents(cents: int, currency: str) -> str:
    return f"{cents / 100:.2f} {currency}"


def _row_for(campaign: Campaign, metrics: Metrics | None) -> list[str]:
    if metrics is None:
        return [
            campaign.platform,
            campaign.name,
            campaign.status.value,
            _fmt_cents(campaign.daily_budget_cents, campaign.currency),
            "–",
            "–",
            "–",
            "–",
        ]

    cpa = metrics.cpa_cents
    return [
        campaign.platform,
        campaign.name,
        campaign.status.value,
        _fmt_cents(campaign.daily_budget_cents, campaign.currency),
        _fmt_cents(metrics.spend_cents, campaign.currency),
        str(metrics.clicks),
        f"{metrics.conversions:g}",
        _fmt_cents(round(cpa), campaign.currency) if cpa is not None else "–",
    ]


def print_report(
    campaigns: list[Campaign], metrics_by_id: dict[str, Metrics], *, file=None
) -> None:
    file = file or sys.stdout
    rows = [_row_for(c, metrics_by_id.get(c.id)) for c in campaigns]
    widths = [
        max(len(_COLUMNS[i]), *(len(r[i]) for r in rows)) if rows else len(_COLUMNS[i])
        for i in range(len(_COLUMNS))
    ]

    def print_row(values: list[str]) -> None:
        print(" | ".join(v.ljust(w) for v, w in zip(values, widths)), file=file)

    print_row(_COLUMNS)
    print_row(["-" * w for w in widths])
    for row in rows:
        print_row(row)


def write_csv(
    path: str | Path, campaigns: list[Campaign], metrics_by_id: dict[str, Metrics]
) -> None:
    path = Path(path)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(_COLUMNS)
        for campaign in campaigns:
            writer.writerow(_row_for(campaign, metrics_by_id.get(campaign.id)))
