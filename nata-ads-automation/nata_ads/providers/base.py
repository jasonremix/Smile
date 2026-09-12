"""Plattform-unabhängige Datentypen und die Schnittstelle, die jeder
Ads-Provider (Google Ads, Meta Ads, ...) implementieren muss.

Geldbeträge werden konsequent als Integer-Cent geführt, um
Floating-Point-Rundungsfehler bei echtem Werbebudget zu vermeiden.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from enum import Enum


class CampaignStatus(str, Enum):
    ENABLED = "ENABLED"
    PAUSED = "PAUSED"
    REMOVED = "REMOVED"


@dataclass(frozen=True)
class Campaign:
    id: str
    name: str
    platform: str  # "google" | "meta"
    status: CampaignStatus
    daily_budget_cents: int
    currency: str = "EUR"


@dataclass(frozen=True)
class Metrics:
    """Kennzahlen einer Kampagne über einen Zeitraum."""

    campaign_id: str
    date_from: date
    date_to: date
    impressions: int = 0
    clicks: int = 0
    conversions: float = 0.0
    spend_cents: int = 0

    @property
    def cpa_cents(self) -> float | None:
        """Cost-per-Acquisition in Cent. None, wenn es keine Conversions gibt."""
        if self.conversions <= 0:
            return None
        return self.spend_cents / self.conversions

    @property
    def ctr(self) -> float | None:
        """Click-through-Rate. None, wenn es keine Impressions gibt."""
        if self.impressions <= 0:
            return None
        return self.clicks / self.impressions


@dataclass(frozen=True)
class CampaignSpec:
    """Deklarative Kampagnen-Vorgabe aus der YAML-Konfiguration,
    verwendet beim (Neu-)Anlegen von Kampagnen."""

    name: str
    platform: str
    daily_budget_cents: int
    currency: str = "EUR"
    objective: str = "AWARENESS"
    target_countries: tuple[str, ...] = field(default_factory=tuple)
    headline: str = ""
    body: str = ""
    final_url: str = ""


class AdsProvider(ABC):
    """Gemeinsame Schnittstelle für alle unterstützten Ads-Plattformen.

    Jede schreibende Methode nimmt ``dry_run`` entgegen. Bei ``dry_run=True``
    (Standard über die CLI) wird NICHTS an die Plattform gesendet — die
    Methode gibt nur zurück, was sie *tun würde*. Das ist die zentrale
    Sicherheitsbremse dieses Tools, weil hier mit echtem Werbebudget
    gearbeitet wird.
    """

    name: str

    @abstractmethod
    def list_campaigns(self) -> list[Campaign]:
        """Alle Kampagnen des konfigurierten Werbekontos laden."""

    @abstractmethod
    def get_metrics(
        self, campaign_ids: list[str], date_from: date, date_to: date
    ) -> dict[str, Metrics]:
        """Kennzahlen für die angegebenen Kampagnen im Zeitraum laden."""

    @abstractmethod
    def set_daily_budget(
        self, campaign_id: str, budget_cents: int, *, dry_run: bool = True
    ) -> None:
        """Tagesbudget einer Kampagne setzen."""

    @abstractmethod
    def pause_campaign(self, campaign_id: str, *, dry_run: bool = True) -> None:
        """Kampagne pausieren."""

    @abstractmethod
    def resume_campaign(self, campaign_id: str, *, dry_run: bool = True) -> None:
        """Pausierte Kampagne wieder aktivieren."""

    @abstractmethod
    def create_campaign(self, spec: CampaignSpec, *, dry_run: bool = True) -> Campaign:
        """Neue Kampagne gemäß Spezifikation anlegen."""
