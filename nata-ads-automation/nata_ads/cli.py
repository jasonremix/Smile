"""Kommandozeilen-Schnittstelle der Nata-Ads-Automatisierung.

Alle schreibenden Befehle sind standardmäßig ein Dry-Run: sie zeigen nur,
was passieren würde. Erst mit dem expliziten ``--apply``-Flag werden
echte Änderungen an Google Ads / Meta Ads gesendet. Das ist bewusst so,
weil hier mit echtem Werbebudget hantiert wird.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

import click

from nata_ads import optimizer, reporting
from nata_ads.config import (
    AppConfig,
    ConfigError,
    load_campaign_config,
    load_env,
    load_google_ads_credentials,
    load_meta_ads_credentials,
)
from nata_ads.providers.base import AdsProvider, Campaign

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("nata_ads.cli")


def _build_providers(config: AppConfig) -> dict[str, AdsProvider]:
    """Baut nur die Provider auf, deren Plattform tatsächlich in der
    Konfiguration vorkommt – so braucht z.B. ein reines Google-Setup keine
    Meta-Zugangsdaten."""
    platforms = {spec.platform for spec in config.campaigns}
    providers: dict[str, AdsProvider] = {}

    try:
        if "google" in platforms:
            from nata_ads.providers.google_ads import GoogleAdsProvider

            providers["google"] = GoogleAdsProvider(load_google_ads_credentials())

        if "meta" in platforms:
            from nata_ads.providers.meta_ads import MetaAdsProvider

            providers["meta"] = MetaAdsProvider(load_meta_ads_credentials())
    except ConfigError as exc:
        raise click.ClickException(str(exc)) from exc

    return providers


def _matching_campaigns(
    providers: dict[str, AdsProvider], config: AppConfig
) -> list[Campaign]:
    """Lädt von jeder benötigten Plattform die Kampagnen und behält nur
    die, deren Name in der Konfiguration vorkommt."""
    configured_names = {spec.name for spec in config.campaigns}
    matched: list[Campaign] = []
    for platform, provider in providers.items():
        for campaign in provider.list_campaigns():
            if campaign.name in configured_names:
                matched.append(campaign)
    return matched


@click.group()
@click.option(
    "--config",
    "config_path",
    default="config/campaigns.yaml",
    show_default=True,
    help="Pfad zur Kampagnen-Konfiguration (YAML).",
)
@click.option("--env-file", default=None, help="Pfad zu einer .env-Datei (optional).")
@click.pass_context
def cli(ctx: click.Context, config_path: str, env_file: str | None) -> None:
    """Nata Ads Automation – Kampagnen-Sync, Reporting und regelbasierte
    Budget-Optimierung für Google Ads & Meta Ads."""
    load_env(env_file)
    try:
        ctx.obj = load_campaign_config(config_path)
    except ConfigError as exc:
        raise click.ClickException(str(exc)) from exc


@cli.command()
@click.option(
    "--apply",
    "apply_",
    is_flag=True,
    default=False,
    help="Änderungen wirklich senden (ohne dieses Flag: reiner Dry-Run).",
)
@click.pass_obj
def sync(config: AppConfig, apply_: bool) -> None:
    """Legt in der Konfiguration definierte Kampagnen an, die auf der
    jeweiligen Plattform noch nicht existieren (Namensabgleich)."""
    providers = _build_providers(config)
    existing_names_by_platform: dict[str, set[str]] = {}
    for platform, provider in providers.items():
        existing_names_by_platform[platform] = {c.name for c in provider.list_campaigns()}

    if not apply_:
        click.secho("DRY RUN – es werden keine echten Änderungen gesendet.\n", fg="yellow")

    created = 0
    for spec in config.campaigns:
        existing = existing_names_by_platform.get(spec.platform, set())
        if spec.name in existing:
            click.echo(f"  = '{spec.name}' ({spec.platform}) existiert bereits, übersprungen")
            continue

        provider = providers[spec.platform]
        campaign = provider.create_campaign(spec, dry_run=not apply_)
        created += 1
        click.echo(
            f"  + '{spec.name}' ({spec.platform}) "
            f"{'angelegt' if apply_ else 'würde angelegt werden'} "
            f"[id={campaign.id}]"
        )

    click.echo(f"\n{created} Kampagne(n) {'angelegt' if apply_ else 'zum Anlegen vorgemerkt'}.")


@cli.command()
@click.option("--days", default=7, show_default=True, help="Zeitraum in Tagen bis heute.")
@click.option("--csv", "csv_path", default=None, help="Report zusätzlich als CSV speichern.")
@click.pass_obj
def report(config: AppConfig, days: int, csv_path: str | None) -> None:
    """Zeigt Spend, Klicks, Conversions und CPA der konfigurierten Kampagnen."""
    providers = _build_providers(config)
    campaigns = _matching_campaigns(providers, config)

    date_to = date.today()
    date_from = date_to - timedelta(days=days)

    metrics_by_id: dict[str, object] = {}
    for platform, provider in providers.items():
        ids = [c.id for c in campaigns if c.platform == platform]
        metrics_by_id.update(provider.get_metrics(ids, date_from, date_to))

    reporting.print_report(campaigns, metrics_by_id)
    if csv_path:
        reporting.write_csv(csv_path, campaigns, metrics_by_id)
        click.echo(f"\nCSV geschrieben nach {csv_path}")


@cli.command()
@click.option("--days", default=7, show_default=True, help="Zeitraum in Tagen bis heute.")
@click.option(
    "--apply",
    "apply_",
    is_flag=True,
    default=False,
    help="Vorgeschlagene Aktionen wirklich ausführen (ohne dieses Flag: reiner Dry-Run).",
)
@click.pass_obj
def optimize(config: AppConfig, days: int, apply_: bool) -> None:
    """Wertet Performance gegen die konfigurierten Regeln aus und pausiert
    schlecht performende bzw. verschiebt Budget zu gut performenden
    Kampagnen."""
    providers = _build_providers(config)
    campaigns = _matching_campaigns(providers, config)

    date_to = date.today()
    date_from = date_to - timedelta(days=days)

    metrics_by_id: dict[str, object] = {}
    for platform, provider in providers.items():
        ids = [c.id for c in campaigns if c.platform == platform]
        metrics_by_id.update(provider.get_metrics(ids, date_from, date_to))

    actions = optimizer.evaluate(campaigns, metrics_by_id, config.optimizer)

    if not actions:
        click.echo("Keine Aktionen notwendig – alle Kampagnen innerhalb der Schwellenwerte.")
        return

    if not apply_:
        click.secho("DRY RUN – es werden keine echten Änderungen gesendet.\n", fg="yellow")

    for action in actions:
        click.echo(f"[{action.type.value.upper()}] {action.campaign_name} ({action.platform})")
        click.echo(f"    Grund: {action.reason}")

        if action.type == optimizer.ActionType.ALERT:
            continue  # reine Information, keine Ausführung

        provider = providers[action.platform]
        if action.type == optimizer.ActionType.PAUSE:
            provider.pause_campaign(action.campaign_id, dry_run=not apply_)
        elif action.type == optimizer.ActionType.SET_BUDGET:
            provider.set_daily_budget(
                action.campaign_id, action.new_budget_cents, dry_run=not apply_
            )

    click.echo(f"\n{len(actions)} Aktion(en) {'ausgeführt' if apply_ else 'vorgeschlagen'}.")


def main() -> None:
    cli()


if __name__ == "__main__":
    main()
