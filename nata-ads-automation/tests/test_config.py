from pathlib import Path

import pytest

from nata_ads.config import ConfigError, load_campaign_config

EXAMPLE_CONFIG = Path(__file__).resolve().parent.parent / "config" / "campaigns.example.yaml"


def test_loads_example_config():
    config = load_campaign_config(EXAMPLE_CONFIG)

    assert config.company == "Nata Inc"
    assert config.default_currency == "EUR"
    assert len(config.campaigns) == 2

    platforms = {spec.platform for spec in config.campaigns}
    assert platforms == {"google", "meta"}

    assert config.optimizer.max_cpa_cents == 500
    assert config.optimizer.min_conversions_for_evaluation == 10


def test_campaign_fields_are_parsed(tmp_path):
    yaml_content = """
account:
  company: "Nata Inc"
  default_currency: EUR
campaigns:
  - name: "Test Campaign"
    platform: google
    daily_budget_cents: 1000
    target_countries: [DE, AT]
    headline: "Hallo"
"""
    path = tmp_path / "campaigns.yaml"
    path.write_text(yaml_content, encoding="utf-8")

    config = load_campaign_config(path)
    spec = config.campaigns[0]

    assert spec.name == "Test Campaign"
    assert spec.daily_budget_cents == 1000
    assert spec.target_countries == ("DE", "AT")
    assert spec.headline == "Hallo"
    assert spec.currency == "EUR"  # von default_currency geerbt


def test_missing_file_raises_config_error(tmp_path):
    with pytest.raises(ConfigError):
        load_campaign_config(tmp_path / "does-not-exist.yaml")


def test_unknown_platform_raises_config_error(tmp_path):
    yaml_content = """
campaigns:
  - name: "Bad Campaign"
    platform: tiktok
    daily_budget_cents: 1000
"""
    path = tmp_path / "campaigns.yaml"
    path.write_text(yaml_content, encoding="utf-8")

    with pytest.raises(ConfigError, match="platform"):
        load_campaign_config(path)


def test_invalid_budget_raises_config_error(tmp_path):
    yaml_content = """
campaigns:
  - name: "Bad Campaign"
    platform: google
    daily_budget_cents: -50
"""
    path = tmp_path / "campaigns.yaml"
    path.write_text(yaml_content, encoding="utf-8")

    with pytest.raises(ConfigError, match="daily_budget_cents"):
        load_campaign_config(path)


def test_no_campaigns_raises_config_error(tmp_path):
    path = tmp_path / "campaigns.yaml"
    path.write_text("campaigns: []\n", encoding="utf-8")

    with pytest.raises(ConfigError, match="Kampagnen"):
        load_campaign_config(path)
