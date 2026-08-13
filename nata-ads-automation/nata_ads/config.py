"""Laden der Kampagnen-Konfiguration (YAML) und der Plattform-Zugangsdaten
(Umgebungsvariablen / .env)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from dotenv import load_dotenv

from nata_ads.providers.base import CampaignSpec

SUPPORTED_PLATFORMS = {"google", "meta"}


@dataclass(frozen=True)
class OptimizerConfig:
    """Schwellenwerte für die regelbasierte Budget-Optimierung.

    Alle Beträge in Cent, alle Prozentwerte als Zahl ohne %-Zeichen
    (20 bedeutet 20 %).
    """

    min_conversions_for_evaluation: int = 10
    min_spend_cents_for_evaluation: int = 2000
    max_cpa_cents: int = 500
    budget_step_pct: float = 20.0
    min_daily_budget_cents: int = 500
    max_daily_budget_cents: int = 50000
    overspend_alert_pct: float = 130.0


@dataclass(frozen=True)
class AppConfig:
    company: str
    default_currency: str
    optimizer: OptimizerConfig
    campaigns: list[CampaignSpec] = field(default_factory=list)


class ConfigError(ValueError):
    """Ungültige oder unvollständige Konfiguration."""


def load_campaign_config(path: str | Path) -> AppConfig:
    """Lädt und validiert eine Kampagnen-YAML-Datei (siehe config/campaigns.example.yaml)."""
    path = Path(path)
    if not path.exists():
        raise ConfigError(f"Konfigurationsdatei nicht gefunden: {path}")

    with path.open("r", encoding="utf-8") as fh:
        raw = yaml.safe_load(fh) or {}

    account = raw.get("account") or {}
    company = account.get("company", "Nata Inc")
    default_currency = account.get("default_currency", "EUR")

    optimizer_raw = raw.get("optimizer") or {}
    try:
        optimizer = OptimizerConfig(**optimizer_raw)
    except TypeError as exc:
        raise ConfigError(f"Unbekanntes Feld im optimizer-Block: {exc}") from exc

    campaigns: list[CampaignSpec] = []
    for i, entry in enumerate(raw.get("campaigns") or []):
        campaigns.append(_parse_campaign_entry(entry, index=i, default_currency=default_currency))

    if not campaigns:
        raise ConfigError("Konfiguration enthält keine Kampagnen (campaigns: [])")

    return AppConfig(
        company=company,
        default_currency=default_currency,
        optimizer=optimizer,
        campaigns=campaigns,
    )


def _parse_campaign_entry(entry: dict, *, index: int, default_currency: str) -> CampaignSpec:
    label = entry.get("name", f"#{index}")

    platform = entry.get("platform")
    if platform not in SUPPORTED_PLATFORMS:
        raise ConfigError(
            f"Kampagne '{label}': platform muss einer von {sorted(SUPPORTED_PLATFORMS)} sein, "
            f"war {platform!r}"
        )

    budget = entry.get("daily_budget_cents")
    if not isinstance(budget, int) or budget <= 0:
        raise ConfigError(
            f"Kampagne '{label}': daily_budget_cents muss eine positive Ganzzahl sein"
        )

    return CampaignSpec(
        name=entry["name"],
        platform=platform,
        daily_budget_cents=budget,
        currency=entry.get("currency", default_currency),
        objective=entry.get("objective", "AWARENESS"),
        target_countries=tuple(entry.get("target_countries", [])),
        headline=entry.get("headline", ""),
        body=entry.get("body", ""),
        final_url=entry.get("final_url", ""),
    )


@dataclass(frozen=True)
class GoogleAdsCredentials:
    developer_token: str
    client_id: str
    client_secret: str
    refresh_token: str
    login_customer_id: str
    customer_id: str


@dataclass(frozen=True)
class MetaAdsCredentials:
    app_id: str
    app_secret: str
    access_token: str
    ad_account_id: str


def load_env(dotenv_path: str | Path | None = None) -> None:
    """Lädt eine .env-Datei ins Prozess-Environment (no-op, falls keine vorhanden)."""
    load_dotenv(dotenv_path=dotenv_path)


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise ConfigError(
            f"Umgebungsvariable {name} fehlt. Siehe .env.example für alle benötigten Werte."
        )
    return value


def load_google_ads_credentials() -> GoogleAdsCredentials:
    return GoogleAdsCredentials(
        developer_token=_require_env("GOOGLE_ADS_DEVELOPER_TOKEN"),
        client_id=_require_env("GOOGLE_ADS_CLIENT_ID"),
        client_secret=_require_env("GOOGLE_ADS_CLIENT_SECRET"),
        refresh_token=_require_env("GOOGLE_ADS_REFRESH_TOKEN"),
        login_customer_id=_require_env("GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
        customer_id=_require_env("GOOGLE_ADS_CUSTOMER_ID"),
    )


def load_meta_ads_credentials() -> MetaAdsCredentials:
    return MetaAdsCredentials(
        app_id=_require_env("META_APP_ID"),
        app_secret=_require_env("META_APP_SECRET"),
        access_token=_require_env("META_ACCESS_TOKEN"),
        ad_account_id=_require_env("META_AD_ACCOUNT_ID"),
    )
