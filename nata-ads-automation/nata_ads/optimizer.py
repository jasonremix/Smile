"""Regelbasierte Budget-Optimierung.

Alles hier ist reine, seiteneffektfreie Logik: ``evaluate()`` nimmt
Kampagnen + Kennzahlen entgegen und gibt eine Liste von ``Action``-Objekten
zurück, die beschreiben, was *getan werden sollte*. Nichts wird hier an
eine Ads-Plattform gesendet — das übernimmt die CLI (``cli.py``), die jede
Action über den passenden Provider ausführt (standardmäßig als Dry-Run).

Diese Trennung macht die Regeln ohne echte API-Zugangsdaten testbar
(siehe tests/test_optimizer.py).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from nata_ads.config import OptimizerConfig
from nata_ads.providers.base import Campaign, CampaignStatus, Metrics


class ActionType(str, Enum):
    PAUSE = "pause"
    SET_BUDGET = "set_budget"
    ALERT = "alert"


@dataclass(frozen=True)
class Action:
    type: ActionType
    campaign_id: str
    campaign_name: str
    platform: str
    reason: str
    new_budget_cents: int | None = None


def evaluate(
    campaigns: list[Campaign],
    metrics_by_id: dict[str, Metrics],
    config: OptimizerConfig,
) -> list[Action]:
    """Wertet Kampagnen gegen die konfigurierten Schwellenwerte aus und
    gibt die daraus resultierenden Aktionen zurück (Pause, Budget-
    Verschiebung, Überspend-Warnung)."""
    actions: list[Action] = []

    enabled = [c for c in campaigns if c.status == CampaignStatus.ENABLED]

    evaluable: list[tuple[Campaign, Metrics]] = []
    for campaign in enabled:
        metrics = metrics_by_id.get(campaign.id)
        if metrics is None:
            continue

        actions.extend(_overspend_alerts(campaign, metrics, config))

        if not _has_enough_data(metrics, config):
            continue

        pause_reason = _pause_reason(metrics, config)
        if pause_reason:
            actions.append(
                Action(
                    type=ActionType.PAUSE,
                    campaign_id=campaign.id,
                    campaign_name=campaign.name,
                    platform=campaign.platform,
                    reason=pause_reason,
                )
            )
        else:
            evaluable.append((campaign, metrics))

    actions.extend(_reallocate_budget(evaluable, config))
    return actions


def _has_enough_data(metrics: Metrics, config: OptimizerConfig) -> bool:
    return (
        metrics.spend_cents >= config.min_spend_cents_for_evaluation
        or metrics.conversions >= config.min_conversions_for_evaluation
    )


def _pause_reason(metrics: Metrics, config: OptimizerConfig) -> str | None:
    if metrics.conversions <= 0:
        return (
            f"{metrics.spend_cents / 100:.2f} EUR ausgegeben ohne jede Conversion "
            f"(Schwelle: {config.min_spend_cents_for_evaluation / 100:.2f} EUR)"
        )

    cpa = metrics.cpa_cents
    if cpa is not None and cpa > config.max_cpa_cents:
        return (
            f"CPA {cpa / 100:.2f} EUR liegt über dem Limit von "
            f"{config.max_cpa_cents / 100:.2f} EUR"
        )
    return None


def _overspend_alerts(
    campaign: Campaign, metrics: Metrics, config: OptimizerConfig
) -> list[Action]:
    days = max((metrics.date_to - metrics.date_from).days, 1)
    avg_daily_spend_cents = metrics.spend_cents / days
    if campaign.daily_budget_cents <= 0:
        return []

    pace_pct = (avg_daily_spend_cents / campaign.daily_budget_cents) * 100
    if pace_pct <= config.overspend_alert_pct:
        return []

    return [
        Action(
            type=ActionType.ALERT,
            campaign_id=campaign.id,
            campaign_name=campaign.name,
            platform=campaign.platform,
            reason=(
                f"Durchschnittlicher Tages-Spend {avg_daily_spend_cents / 100:.2f} EUR "
                f"entspricht {pace_pct:.0f}% des Tagesbudgets "
                f"({campaign.daily_budget_cents / 100:.2f} EUR) – Limit liegt bei "
                f"{config.overspend_alert_pct:.0f}%"
            ),
        )
    ]


def _reallocate_budget(
    evaluable: list[tuple[Campaign, Metrics]], config: OptimizerConfig
) -> list[Action]:
    """Verschiebt budget_step_pct % Budget von der schwächsten zur stärksten
    Kampagne (gemessen an CPA), wenn mindestens zwei Kampagnen genug Daten
    haben und beide innerhalb des CPA-Limits liegen."""
    ranked = [
        (campaign, metrics, metrics.cpa_cents)
        for campaign, metrics in evaluable
        if metrics.cpa_cents is not None
    ]
    if len(ranked) < 2:
        return []

    ranked.sort(key=lambda t: t[2])  # niedrigster CPA zuerst = bester Performer
    best_campaign, _, best_cpa = ranked[0]
    worst_campaign, _, worst_cpa = ranked[-1]

    if best_campaign.id == worst_campaign.id or worst_cpa <= best_cpa:
        return []

    shift_from = round(worst_campaign.daily_budget_cents * config.budget_step_pct / 100)
    if shift_from <= 0:
        return []

    new_worst_budget = max(worst_campaign.daily_budget_cents - shift_from, config.min_daily_budget_cents)
    actual_shift = worst_campaign.daily_budget_cents - new_worst_budget
    if actual_shift <= 0:
        return []

    new_best_budget = min(best_campaign.daily_budget_cents + actual_shift, config.max_daily_budget_cents)
    actual_gain = new_best_budget - best_campaign.daily_budget_cents
    if actual_gain <= 0:
        return []

    reason_suffix = (
        f"(CPA {worst_cpa / 100:.2f} EUR vs. {best_cpa / 100:.2f} EUR bei "
        f"'{best_campaign.name}')"
    )

    return [
        Action(
            type=ActionType.SET_BUDGET,
            campaign_id=worst_campaign.id,
            campaign_name=worst_campaign.name,
            platform=worst_campaign.platform,
            reason=f"Budget reduziert zugunsten besser performender Kampagne {reason_suffix}",
            new_budget_cents=new_worst_budget,
        ),
        Action(
            type=ActionType.SET_BUDGET,
            campaign_id=best_campaign.id,
            campaign_name=best_campaign.name,
            platform=best_campaign.platform,
            reason=f"Budget erhöht wegen besserer Performance {reason_suffix}",
            new_budget_cents=new_best_budget,
        ),
    ]
