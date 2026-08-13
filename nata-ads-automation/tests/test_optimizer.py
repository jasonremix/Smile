from datetime import date, timedelta

from nata_ads.config import OptimizerConfig
from nata_ads.optimizer import ActionType, evaluate
from nata_ads.providers.base import Campaign, CampaignStatus, Metrics

TODAY = date(2026, 1, 8)
WEEK_AGO = TODAY - timedelta(days=7)


def make_config(**overrides) -> OptimizerConfig:
    defaults = dict(
        min_conversions_for_evaluation=10,
        min_spend_cents_for_evaluation=2000,
        max_cpa_cents=500,
        budget_step_pct=20,
        min_daily_budget_cents=500,
        max_daily_budget_cents=50000,
        overspend_alert_pct=130,
    )
    defaults.update(overrides)
    return OptimizerConfig(**defaults)


def make_campaign(id_="c1", status=CampaignStatus.ENABLED, budget_cents=3000) -> Campaign:
    return Campaign(
        id=id_,
        name=f"Campaign {id_}",
        platform="google",
        status=status,
        daily_budget_cents=budget_cents,
    )


def make_metrics(campaign_id="c1", spend_cents=0, conversions=0.0, clicks=0, impressions=0) -> Metrics:
    return Metrics(
        campaign_id=campaign_id,
        date_from=WEEK_AGO,
        date_to=TODAY,
        impressions=impressions,
        clicks=clicks,
        conversions=conversions,
        spend_cents=spend_cents,
    )


def test_no_actions_when_not_enough_data():
    config = make_config()
    campaign = make_campaign(budget_cents=1000)
    metrics = make_metrics(spend_cents=500, conversions=1)  # unter beiden Schwellen

    actions = evaluate([campaign], {"c1": metrics}, config)

    assert actions == []


def test_pauses_campaign_with_zero_conversions_and_enough_spend():
    config = make_config()
    campaign = make_campaign(budget_cents=3000)
    metrics = make_metrics(spend_cents=2500, conversions=0)

    actions = evaluate([campaign], {"c1": metrics}, config)

    assert len(actions) == 1
    assert actions[0].type == ActionType.PAUSE
    assert actions[0].campaign_id == "c1"
    assert "ohne jede Conversion" in actions[0].reason


def test_pauses_campaign_with_cpa_above_limit():
    config = make_config(max_cpa_cents=500)
    campaign = make_campaign(budget_cents=3000)
    # CPA = 3000 Cent / 5 Conversions = 600 Cent > 500 Cent Limit
    metrics = make_metrics(spend_cents=3000, conversions=5)

    actions = evaluate([campaign], {"c1": metrics}, config)

    assert len(actions) == 1
    assert actions[0].type == ActionType.PAUSE
    assert "CPA" in actions[0].reason


def test_no_pause_when_cpa_within_limit():
    config = make_config(max_cpa_cents=500)
    campaign = make_campaign(budget_cents=3000)
    # CPA = 2000 Cent / 10 Conversions = 200 Cent < 500 Cent Limit
    metrics = make_metrics(spend_cents=2000, conversions=10)

    actions = evaluate([campaign], {"c1": metrics}, config)

    pause_actions = [a for a in actions if a.type == ActionType.PAUSE]
    assert pause_actions == []


def test_ignores_paused_campaigns():
    config = make_config()
    campaign = make_campaign(status=CampaignStatus.PAUSED, budget_cents=3000)
    metrics = make_metrics(spend_cents=5000, conversions=0)  # waere sonst PAUSE-wuerdig

    actions = evaluate([campaign], {"c1": metrics}, config)

    assert actions == []


def test_reallocates_budget_from_worse_to_better_campaign():
    config = make_config(max_cpa_cents=1000, budget_step_pct=20)

    good = make_campaign(id_="good", budget_cents=2000)
    bad = make_campaign(id_="bad", budget_cents=4000)

    # good: CPA = 2000 / 20 = 100 Cent
    good_metrics = make_metrics(campaign_id="good", spend_cents=2000, conversions=20)
    # bad: CPA = 4000 / 10 = 400 Cent (schlechter, aber noch unter dem Limit von 1000)
    bad_metrics = make_metrics(campaign_id="bad", spend_cents=4000, conversions=10)

    actions = evaluate(
        [good, bad], {"good": good_metrics, "bad": bad_metrics}, config
    )

    budget_actions = {a.campaign_id: a for a in actions if a.type == ActionType.SET_BUDGET}
    assert set(budget_actions) == {"good", "bad"}

    # 20% von 4000 = 800 Cent wandern von "bad" zu "good"
    assert budget_actions["bad"].new_budget_cents == 4000 - 800
    assert budget_actions["good"].new_budget_cents == 2000 + 800


def test_budget_reallocation_respects_min_and_max():
    config = make_config(
        max_cpa_cents=1000,
        budget_step_pct=90,
        min_daily_budget_cents=3500,
        max_daily_budget_cents=2300,
    )

    good = make_campaign(id_="good", budget_cents=2000)
    bad = make_campaign(id_="bad", budget_cents=4000)

    good_metrics = make_metrics(campaign_id="good", spend_cents=2000, conversions=20)
    bad_metrics = make_metrics(campaign_id="bad", spend_cents=4000, conversions=10)

    actions = evaluate(
        [good, bad], {"good": good_metrics, "bad": bad_metrics}, config
    )

    budget_actions = {a.campaign_id: a for a in actions if a.type == ActionType.SET_BUDGET}
    # "bad" darf nicht unter die Untergrenze fallen
    assert budget_actions["bad"].new_budget_cents >= config.min_daily_budget_cents
    # "good" darf die Obergrenze nicht überschreiten
    assert budget_actions["good"].new_budget_cents <= config.max_daily_budget_cents


def test_no_reallocation_with_single_evaluable_campaign():
    config = make_config(max_cpa_cents=1000)
    campaign = make_campaign(budget_cents=3000)
    metrics = make_metrics(spend_cents=2000, conversions=10)

    actions = evaluate([campaign], {"c1": metrics}, config)

    assert [a for a in actions if a.type == ActionType.SET_BUDGET] == []


def test_overspend_alert_fires_independent_of_evaluation_threshold():
    config = make_config(overspend_alert_pct=130, min_spend_cents_for_evaluation=100000)
    # Budget 100 Cent/Tag, Spend im 7-Tage-Zeitraum 1000 Cent => avg 142.8 Cent/Tag => 142% Pace
    campaign = make_campaign(budget_cents=100)
    metrics = make_metrics(spend_cents=1000, conversions=0)

    actions = evaluate([campaign], {"c1": metrics}, config)

    alert_actions = [a for a in actions if a.type == ActionType.ALERT]
    assert len(alert_actions) == 1
    assert "Tagesbudget" in alert_actions[0].reason


def test_no_overspend_alert_within_pace():
    config = make_config(overspend_alert_pct=130)
    campaign = make_campaign(budget_cents=1000)
    metrics = make_metrics(spend_cents=7000, conversions=0)  # avg = 1000/Tag = 100% Pace

    actions = evaluate([campaign], {"c1": metrics}, config)

    assert [a for a in actions if a.type == ActionType.ALERT] == []


def test_skips_campaigns_without_metrics():
    config = make_config()
    campaign = make_campaign()

    actions = evaluate([campaign], {}, config)

    assert actions == []
