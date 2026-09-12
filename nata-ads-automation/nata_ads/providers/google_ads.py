"""Google-Ads-Provider.

Nutzt den offiziellen ``google-ads`` Python-Client. Erwartet ein
Developer-Token mit mindestens Basic-Access sowie ein OAuth2-Refresh-Token
für ein Konto mit Zugriff auf das Ziel-Werbekonto (siehe README).

Geo-Targeting ist auf eine kleine Länder-Lookup-Tabelle für den DACH-Start
begrenzt (siehe ``_GEO_TARGET_CONSTANTS`` unten). Für weitere Länder die
Konstanten über ``GeoTargetConstantService.SuggestGeoTargetConstants``
nachschlagen und die Tabelle erweitern.
"""
from __future__ import annotations

import logging
from datetime import date

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.protobuf import field_mask_pb2

from nata_ads.config import GoogleAdsCredentials
from nata_ads.providers.base import (
    AdsProvider,
    Campaign,
    CampaignSpec,
    CampaignStatus,
    Metrics,
)

logger = logging.getLogger(__name__)

# geoTargetConstants für gängige DACH-Länder (stabile, öffentlich dokumentierte IDs).
# Quelle: Google Ads Geo Target Constants (https://developers.google.com/google-ads/api/data/geotargets)
_GEO_TARGET_CONSTANTS: dict[str, str] = {
    "DE": "geoTargetConstants/2276",
    "AT": "geoTargetConstants/2040",
    "CH": "geoTargetConstants/2756",
}

_STATUS_MAP = {
    "ENABLED": CampaignStatus.ENABLED,
    "PAUSED": CampaignStatus.PAUSED,
    "REMOVED": CampaignStatus.REMOVED,
}


class GoogleAdsProvider(AdsProvider):
    name = "google"

    def __init__(self, credentials: GoogleAdsCredentials) -> None:
        self._credentials = credentials
        self._client: GoogleAdsClient | None = None

    @property
    def client(self) -> GoogleAdsClient:
        if self._client is None:
            self._client = GoogleAdsClient.load_from_dict(
                {
                    "developer_token": self._credentials.developer_token,
                    "client_id": self._credentials.client_id,
                    "client_secret": self._credentials.client_secret,
                    "refresh_token": self._credentials.refresh_token,
                    "login_customer_id": self._credentials.login_customer_id,
                    "use_proto_plus": True,
                }
            )
        return self._client

    @property
    def customer_id(self) -> str:
        return self._credentials.customer_id

    # ------------------------------------------------------------------
    # Lesen
    # ------------------------------------------------------------------

    def list_campaigns(self) -> list[Campaign]:
        ga_service = self.client.get_service("GoogleAdsService")
        query = """
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              campaign_budget.amount_micros,
              customer.currency_code
            FROM campaign
            WHERE campaign.status != 'REMOVED'
        """
        campaigns: list[Campaign] = []
        try:
            response = ga_service.search(customer_id=self.customer_id, query=query)
            for row in response:
                campaigns.append(
                    Campaign(
                        id=str(row.campaign.id),
                        name=row.campaign.name,
                        platform=self.name,
                        status=_STATUS_MAP.get(row.campaign.status.name, CampaignStatus.PAUSED),
                        daily_budget_cents=_micros_to_cents(row.campaign_budget.amount_micros),
                        currency=row.customer.currency_code or "EUR",
                    )
                )
        except GoogleAdsException:
            logger.exception("Google Ads: Kampagnen konnten nicht geladen werden")
            raise
        return campaigns

    def get_metrics(
        self, campaign_ids: list[str], date_from: date, date_to: date
    ) -> dict[str, Metrics]:
        if not campaign_ids:
            return {}

        ga_service = self.client.get_service("GoogleAdsService")
        id_list = ", ".join(campaign_ids)
        query = f"""
            SELECT
              campaign.id,
              metrics.impressions,
              metrics.clicks,
              metrics.conversions,
              metrics.cost_micros
            FROM campaign
            WHERE campaign.id IN ({id_list})
              AND segments.date BETWEEN '{date_from.isoformat()}' AND '{date_to.isoformat()}'
        """

        totals: dict[str, dict] = {
            cid: {"impressions": 0, "clicks": 0, "conversions": 0.0, "spend_cents": 0}
            for cid in campaign_ids
        }

        response = ga_service.search(customer_id=self.customer_id, query=query)
        for row in response:
            cid = str(row.campaign.id)
            bucket = totals.setdefault(
                cid, {"impressions": 0, "clicks": 0, "conversions": 0.0, "spend_cents": 0}
            )
            bucket["impressions"] += row.metrics.impressions
            bucket["clicks"] += row.metrics.clicks
            bucket["conversions"] += row.metrics.conversions
            bucket["spend_cents"] += _micros_to_cents(row.metrics.cost_micros)

        return {
            cid: Metrics(
                campaign_id=cid,
                date_from=date_from,
                date_to=date_to,
                impressions=vals["impressions"],
                clicks=vals["clicks"],
                conversions=vals["conversions"],
                spend_cents=vals["spend_cents"],
            )
            for cid, vals in totals.items()
        }

    # ------------------------------------------------------------------
    # Schreiben (immer dry_run-fähig)
    # ------------------------------------------------------------------

    def set_daily_budget(
        self, campaign_id: str, budget_cents: int, *, dry_run: bool = True
    ) -> None:
        budget_resource_name = self._get_budget_resource_name(campaign_id)

        if dry_run:
            logger.info(
                "[DRY RUN][google] würde Tagesbudget von Kampagne %s auf %s Cent setzen",
                campaign_id,
                budget_cents,
            )
            return

        campaign_budget_service = self.client.get_service("CampaignBudgetService")
        operation = self.client.get_type("CampaignBudgetOperation")
        budget = operation.update
        budget.resource_name = budget_resource_name
        budget.amount_micros = _cents_to_micros(budget_cents)
        operation.update_mask.CopyFrom(field_mask_pb2.FieldMask(paths=["amount_micros"]))
        campaign_budget_service.mutate_campaign_budgets(
            customer_id=self.customer_id, operations=[operation]
        )

    def pause_campaign(self, campaign_id: str, *, dry_run: bool = True) -> None:
        self._set_campaign_status(campaign_id, "PAUSED", dry_run=dry_run)

    def resume_campaign(self, campaign_id: str, *, dry_run: bool = True) -> None:
        self._set_campaign_status(campaign_id, "ENABLED", dry_run=dry_run)

    def create_campaign(self, spec: CampaignSpec, *, dry_run: bool = True) -> Campaign:
        if dry_run:
            logger.info(
                "[DRY RUN][google] würde Kampagne '%s' anlegen (Budget %s Cent/Tag, Länder %s)",
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

        campaign_budget_service = self.client.get_service("CampaignBudgetService")
        campaign_service = self.client.get_service("CampaignService")
        campaign_criterion_service = self.client.get_service("CampaignCriterionService")

        # 1. Budget anlegen
        budget_operation = self.client.get_type("CampaignBudgetOperation")
        budget = budget_operation.create
        budget.name = f"{spec.name} – Budget"
        budget.delivery_method = self.client.enums.BudgetDeliveryMethodEnum.STANDARD
        budget.amount_micros = _cents_to_micros(spec.daily_budget_cents)
        budget_response = campaign_budget_service.mutate_campaign_budgets(
            customer_id=self.customer_id, operations=[budget_operation]
        )
        budget_resource_name = budget_response.results[0].resource_name

        # 2. Kampagne anlegen (pausiert – bewusst kein Sofortstart über Automatisierung)
        campaign_operation = self.client.get_type("CampaignOperation")
        campaign = campaign_operation.create
        campaign.name = spec.name
        campaign.status = self.client.enums.CampaignStatusEnum.PAUSED
        campaign.advertising_channel_type = (
            self.client.enums.AdvertisingChannelTypeEnum.DISPLAY
        )
        campaign.campaign_budget = budget_resource_name
        campaign.network_settings.target_content_network = True
        campaign_response = campaign_service.mutate_campaigns(
            customer_id=self.customer_id, operations=[campaign_operation]
        )
        campaign_resource_name = campaign_response.results[0].resource_name
        campaign_id = campaign_resource_name.split("/")[-1]

        # 3. Geo-Targeting je konfiguriertem Land
        geo_operations = []
        for country in spec.target_countries:
            geo_target = _GEO_TARGET_CONSTANTS.get(country.upper())
            if not geo_target:
                logger.warning(
                    "Kein bekannter geoTargetConstant für Land '%s' – bitte "
                    "_GEO_TARGET_CONSTANTS in google_ads.py ergänzen. Land wird übersprungen.",
                    country,
                )
                continue
            op = self.client.get_type("CampaignCriterionOperation")
            criterion = op.create
            criterion.campaign = campaign_resource_name
            criterion.location.geo_target_constant = geo_target
            geo_operations.append(op)

        if geo_operations:
            campaign_criterion_service.mutate_campaign_criteria(
                customer_id=self.customer_id, operations=geo_operations
            )

        logger.info(
            "Kampagne '%s' angelegt (pausiert) – Anzeigengruppen/Anzeigen bitte "
            "im Google Ads UI oder über eine Erweiterung dieses Providers ergänzen.",
            spec.name,
        )

        return Campaign(
            id=campaign_id,
            name=spec.name,
            platform=self.name,
            status=CampaignStatus.PAUSED,
            daily_budget_cents=spec.daily_budget_cents,
            currency=spec.currency,
        )

    # ------------------------------------------------------------------
    # Hilfsfunktionen
    # ------------------------------------------------------------------

    def _get_budget_resource_name(self, campaign_id: str) -> str:
        ga_service = self.client.get_service("GoogleAdsService")
        query = f"""
            SELECT campaign_budget.resource_name
            FROM campaign
            WHERE campaign.id = {campaign_id}
            LIMIT 1
        """
        response = ga_service.search(customer_id=self.customer_id, query=query)
        for row in response:
            return row.campaign_budget.resource_name
        raise ValueError(f"Kampagne {campaign_id} nicht gefunden")

    def _set_campaign_status(self, campaign_id: str, status: str, *, dry_run: bool) -> None:
        if dry_run:
            logger.info(
                "[DRY RUN][google] würde Status von Kampagne %s auf %s setzen",
                campaign_id,
                status,
            )
            return

        campaign_service = self.client.get_service("CampaignService")
        operation = self.client.get_type("CampaignOperation")
        campaign = operation.update
        campaign.resource_name = campaign_service.campaign_path(self.customer_id, campaign_id)
        campaign.status = getattr(self.client.enums.CampaignStatusEnum, status)
        operation.update_mask.CopyFrom(field_mask_pb2.FieldMask(paths=["status"]))
        campaign_service.mutate_campaigns(customer_id=self.customer_id, operations=[operation])


def _micros_to_cents(micros: int) -> int:
    return round(micros / 10_000)


def _cents_to_micros(cents: int) -> int:
    return cents * 10_000
