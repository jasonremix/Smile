"""Meta-Ads-Provider (Facebook/Instagram).

Nutzt den offiziellen ``facebook-business`` Python-SDK für die Meta
Marketing API. Kampagnen werden mit Campaign Budget Optimization (CBO)
angelegt, d.h. das Tagesbudget liegt auf Kampagnen- statt Anzeigengruppen-
Ebene – das hält dieses Modul konsistent zum Google-Ads-Provider.

Hinweis zum Funktionsumfang: ``create_campaign`` legt Kampagne + eine
Anzeigengruppe mit Geo-Targeting an, aber KEINE Anzeige/Creative – das
finale Creative (Bild/Video, Text-Varianten, CTA) sollte über den Meta
Ads Manager oder eine Erweiterung dieses Providers ergänzt werden.
"""
from __future__ import annotations

import logging
from datetime import date

from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adset import AdSet as FBAdSet
from facebook_business.adobjects.campaign import Campaign as FBCampaign
from facebook_business.api import FacebookAdsApi

from nata_ads.config import MetaAdsCredentials
from nata_ads.providers.base import (
    AdsProvider,
    Campaign,
    CampaignSpec,
    CampaignStatus,
    Metrics,
)

logger = logging.getLogger(__name__)

_STATUS_MAP = {
    "ACTIVE": CampaignStatus.ENABLED,
    "PAUSED": CampaignStatus.PAUSED,
    "ARCHIVED": CampaignStatus.REMOVED,
    "DELETED": CampaignStatus.REMOVED,
}

# Meta Marketing API "actions"-Typen, die wir als Conversion zählen.
# Je nach Kampagnenziel/Pixel-Setup ggf. anpassen oder erweitern.
_CONVERSION_ACTION_TYPES = {
    "offsite_conversion",
    "onsite_conversion",
    "app_custom_event",
    "purchase",
}


class MetaAdsProvider(AdsProvider):
    name = "meta"

    def __init__(self, credentials: MetaAdsCredentials) -> None:
        self._credentials = credentials
        self._initialized = False

    def _ensure_api(self) -> None:
        if self._initialized:
            return
        FacebookAdsApi.init(
            app_id=self._credentials.app_id,
            app_secret=self._credentials.app_secret,
            access_token=self._credentials.access_token,
        )
        self._initialized = True

    @property
    def account(self) -> AdAccount:
        self._ensure_api()
        account_id = self._credentials.ad_account_id
        if not account_id.startswith("act_"):
            account_id = f"act_{account_id}"
        return AdAccount(account_id)

    # ------------------------------------------------------------------
    # Lesen
    # ------------------------------------------------------------------

    def list_campaigns(self) -> list[Campaign]:
        fields = [
            FBCampaign.Field.id,
            FBCampaign.Field.name,
            FBCampaign.Field.status,
            FBCampaign.Field.daily_budget,
        ]
        campaigns: list[Campaign] = []
        for c in self.account.get_campaigns(fields=fields, params={"limit": 200}):
            daily_budget = c.get(FBCampaign.Field.daily_budget)
            campaigns.append(
                Campaign(
                    id=str(c[FBCampaign.Field.id]),
                    name=c[FBCampaign.Field.name],
                    platform=self.name,
                    status=_STATUS_MAP.get(c[FBCampaign.Field.status], CampaignStatus.PAUSED),
                    # Meta liefert Budgets als String-Cent-Betrag in Kontowährung.
                    daily_budget_cents=int(daily_budget) if daily_budget is not None else 0,
                )
            )
        return campaigns

    def get_metrics(
        self, campaign_ids: list[str], date_from: date, date_to: date
    ) -> dict[str, Metrics]:
        results: dict[str, Metrics] = {}
        for campaign_id in campaign_ids:
            insights = FBCampaign(campaign_id).get_insights(
                fields=["impressions", "clicks", "spend", "actions"],
                params={
                    "time_range": {
                        "since": date_from.isoformat(),
                        "until": date_to.isoformat(),
                    },
                },
            )
            impressions = clicks = 0
            spend_cents = 0
            conversions = 0.0
            for row in insights:
                impressions += int(row.get("impressions", 0))
                clicks += int(row.get("clicks", 0))
                spend_cents += round(float(row.get("spend", 0)) * 100)
                for action in row.get("actions", []) or []:
                    if action.get("action_type") in _CONVERSION_ACTION_TYPES:
                        conversions += float(action.get("value", 0))

            results[campaign_id] = Metrics(
                campaign_id=campaign_id,
                date_from=date_from,
                date_to=date_to,
                impressions=impressions,
                clicks=clicks,
                conversions=conversions,
                spend_cents=spend_cents,
            )
        return results

    # ------------------------------------------------------------------
    # Schreiben (immer dry_run-fähig)
    # ------------------------------------------------------------------

    def set_daily_budget(
        self, campaign_id: str, budget_cents: int, *, dry_run: bool = True
    ) -> None:
        if dry_run:
            logger.info(
                "[DRY RUN][meta] würde Tagesbudget von Kampagne %s auf %s Cent setzen",
                campaign_id,
                budget_cents,
            )
            return

        self._ensure_api()
        FBCampaign(campaign_id).api_update(params={FBCampaign.Field.daily_budget: budget_cents})

    def pause_campaign(self, campaign_id: str, *, dry_run: bool = True) -> None:
        self._set_campaign_status(campaign_id, FBCampaign.Status.paused, dry_run=dry_run)

    def resume_campaign(self, campaign_id: str, *, dry_run: bool = True) -> None:
        self._set_campaign_status(campaign_id, FBCampaign.Status.active, dry_run=dry_run)

    def create_campaign(self, spec: CampaignSpec, *, dry_run: bool = True) -> Campaign:
        if dry_run:
            logger.info(
                "[DRY RUN][meta] würde Kampagne '%s' anlegen (Budget %s Cent/Tag, Länder %s)",
                spec.name,
                spec.daily_budget_cents,
                spec.target_countries,
            )
            return Campaign(
                id="dry-run",
                name=spec.name,
                platform=self.name,
                status=CampaignStatus.PAUSED,
                daily_budget_cents=spec.daily_budget_cents,
                currency=spec.currency,
            )

        objective_map = {
            "AWARENESS": "OUTCOME_AWARENESS",
            "TRAFFIC": "OUTCOME_TRAFFIC",
            "ENGAGEMENT": "OUTCOME_ENGAGEMENT",
            "LEADS": "OUTCOME_LEADS",
            "SALES": "OUTCOME_SALES",
        }

        campaign = self.account.create_campaign(
            params={
                FBCampaign.Field.name: spec.name,
                FBCampaign.Field.objective: objective_map.get(
                    spec.objective.upper(), "OUTCOME_AWARENESS"
                ),
                FBCampaign.Field.status: FBCampaign.Status.paused,
                FBCampaign.Field.daily_budget: spec.daily_budget_cents,
                FBCampaign.Field.special_ad_categories: [],
            }
        )
        campaign_id = campaign[FBCampaign.Field.id]

        # Anzeigengruppe mit Geo-Targeting; Creative/Anzeige bewusst nicht
        # automatisiert (siehe Modul-Docstring).
        self.account.create_ad_set(
            params={
                FBAdSet.Field.name: f"{spec.name} – Zielgruppe",
                FBAdSet.Field.campaign_id: campaign_id,
                FBAdSet.Field.status: FBAdSet.Status.paused,
                FBAdSet.Field.billing_event: "IMPRESSIONS",
                FBAdSet.Field.optimization_goal: "REACH",
                FBAdSet.Field.targeting: {
                    "geo_locations": {
                        "countries": [c.upper() for c in spec.target_countries]
                    },
                },
            }
        )

        logger.info(
            "Kampagne '%s' angelegt (pausiert) – Creative/Anzeige bitte im "
            "Meta Ads Manager oder über eine Erweiterung dieses Providers ergänzen.",
            spec.name,
        )

        return Campaign(
            id=str(campaign_id),
            name=spec.name,
            platform=self.name,
            status=CampaignStatus.PAUSED,
            daily_budget_cents=spec.daily_budget_cents,
            currency=spec.currency,
        )

    # ------------------------------------------------------------------
    # Hilfsfunktionen
    # ------------------------------------------------------------------

    def _set_campaign_status(self, campaign_id: str, status: str, *, dry_run: bool) -> None:
        if dry_run:
            logger.info(
                "[DRY RUN][meta] würde Status von Kampagne %s auf %s setzen",
                campaign_id,
                status,
            )
            return

        self._ensure_api()
        FBCampaign(campaign_id).api_update(params={FBCampaign.Field.status: status})
