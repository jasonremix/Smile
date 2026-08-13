# Nata Ads Automation

Kampagnen-Sync, Reporting und regelbasierte Budget-Optimierung für die
**offiziellen** Werbeanzeigen von Nata Inc auf Google Ads und Meta Ads
(Facebook/Instagram) — über die offiziellen Werbeplattform-APIs.

Dieses Tool erstellt und verwaltet **echte, deklarierte Werbeanzeigen**
über die offiziellen Ads-APIs von Google und Meta. Es ist kein Bot für
Fake-Engagement, automatisiertes Spam-Posting oder verdeckte Werbung —
alle Anzeigen laufen unter dem Nata-Inc-Werbekonto, sind als Werbung
gekennzeichnet und unterliegen den [Google-Ads-Richtlinien](https://support.google.com/adspolicy)
sowie den [Meta-Werberichtlinien](https://www.facebook.com/policies/ads).
Verstöße (z. B. Behauptungen, Nata sei bereits verfügbar, obwohl das noch
nicht stimmt) können zur Kontosperrung führen — bitte Anzeigentexte in
`config/campaigns.yaml` entsprechend sorgfältig pflegen.

## Was das Tool tut

- **`sync`** — legt Kampagnen aus `config/campaigns.yaml` an, die auf der
  jeweiligen Plattform noch nicht existieren (Namensabgleich). Neue
  Kampagnen werden immer **pausiert** angelegt; Anzeigengruppe +
  Geo-Targeting werden gesetzt, das finale Creative (Bild/Video, exakte
  Anzeigentexte) bitte im Google Ads / Meta Ads Manager ergänzen.
- **`report`** — zeigt Spend, Klicks, Conversions und CPA je Kampagne für
  einen wählbaren Zeitraum, optional als CSV-Export.
- **`optimize`** — wertet Performance gegen konfigurierbare Schwellenwerte
  aus und schlägt vor: Kampagnen mit zu hohem CPA oder ohne jede
  Conversion pausieren, Budget von schwächeren zu stärkeren Kampagnen
  verschieben, bei Überspend-Pace warnen.

## Sicherheitsprinzip: Dry-Run per Default

**Jeder schreibende Befehl ist standardmäßig ein Dry-Run.** Ohne das
`--apply`-Flag wird nichts an Google Ads oder Meta Ads gesendet — die
Befehle zeigen nur, was passieren *würde*. Das ist Absicht: Hier wird mit
echtem Werbebudget hantiert, ein stiller Bug soll niemals zu ungewolltem
Ausgeben oder Pausieren führen.

```bash
nata-ads optimize                 # zeigt nur, was passieren würde
nata-ads optimize --apply         # führt die Aktionen wirklich aus
```

Empfehlung: `sync`/`optimize` zunächst immer ohne `--apply` laufen lassen,
das Ergebnis prüfen, erst danach mit `--apply` wiederholen.

## Setup

### 1. Installieren

```bash
cd nata-ads-automation
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Zugangsdaten

```bash
cp .env.example .env
```

Dann `.env` befüllen:

- **Google Ads**: Developer-Token, OAuth2-Client (Client-ID/-Secret),
  Refresh-Token sowie Login-/Ziel-Kunden-ID. Details:
  [Google Ads API – Erste Schritte](https://developers.google.com/google-ads/api/docs/first-call/overview).
- **Meta Ads**: App-ID/-Secret aus einer Facebook-App mit
  Marketing-API-Produkt, ein Access-Token mit `ads_management`-Scope
  sowie die Werbekonto-ID. Details:
  [Meta Marketing API – Erste Schritte](https://developers.facebook.com/docs/marketing-apis/get-started).

`.env` wird nie committet (siehe `.gitignore`).

Falls du nur eine der beiden Plattformen nutzt, brauchst du auch nur
deren Zugangsdaten — das Tool baut nur die Provider auf, die in
`campaigns.yaml` tatsächlich vorkommen.

### 3. Kampagnen-Konfiguration

```bash
cp config/campaigns.example.yaml config/campaigns.yaml
```

`config/campaigns.yaml` enthält:

- **`optimizer`** — Schwellenwerte für `optimize` (max. CPA, Mindest-Spend
  vor Bewertung, Budget-Schrittgröße, Budget-Ober-/Untergrenze,
  Überspend-Warnschwelle). Details siehe Kommentare in
  `config/campaigns.example.yaml`.
- **`campaigns`** — eine Liste geplanter Kampagnen (Name, Plattform,
  Tagesbudget, Zielländer, Anzeigentext-Bausteine).

## Nutzung

```bash
# Kampagnen anlegen, die in campaigns.yaml stehen, aber noch nicht existieren
nata-ads sync              # Dry-Run
nata-ads sync --apply      # wirklich anlegen

# Performance-Report der letzten 14 Tage, zusätzlich als CSV
nata-ads report --days 14 --csv report.csv

# Budget-Optimierung vorschlagen bzw. ausführen
nata-ads optimize --days 7
nata-ads optimize --days 7 --apply
```

Alle Befehle akzeptieren `--config <pfad>`, falls die Konfiguration nicht
unter `config/campaigns.yaml` liegt.

## Wie die Optimierung entscheidet

Alle Regeln stehen in `nata_ads/optimizer.py` (reine Funktionen, keine
API-Aufrufe — dadurch vollständig unit-testbar, siehe `tests/`):

1. **Pausieren**: Eine aktive Kampagne wird zum Pausieren vorgeschlagen,
   wenn sie genug Daten hat (`min_spend_cents_for_evaluation` ODER
   `min_conversions_for_evaluation` erreicht) und entweder **null
   Conversions** hat oder ihr **CPA über `max_cpa_cents`** liegt.
2. **Budget-Verschiebung**: Unter Kampagnen mit ausreichend Daten und
   CPA innerhalb des Limits wird `budget_step_pct` % Budget von der
   schwächsten (höchster CPA) zur stärksten (niedrigster CPA) Kampagne
   verschoben — begrenzt durch `min_daily_budget_cents` /
   `max_daily_budget_cents`.
3. **Überspend-Warnung**: Wenn der durchschnittliche Tages-Spend im
   gewählten Zeitraum `overspend_alert_pct` % des Tagesbudgets
   überschreitet, wird eine reine Info-Warnung ausgegeben (keine
   automatische Aktion).

## Projektstruktur

```
nata-ads-automation/
├── nata_ads/
│   ├── cli.py              CLI-Befehle (sync, report, optimize)
│   ├── config.py           YAML-Konfiguration + .env-Zugangsdaten laden
│   ├── optimizer.py        Regelbasierte Auswertung (reine Funktionen)
│   ├── reporting.py        Konsolen-Tabelle + CSV-Export
│   └── providers/
│       ├── base.py         Plattform-unabhängige Typen + Provider-Interface
│       ├── google_ads.py   Google-Ads-Provider
│       └── meta_ads.py     Meta-Ads-Provider
├── config/
│   └── campaigns.example.yaml
├── tests/                  Unit-Tests für Config + Optimizer (keine Live-API-Calls)
├── .env.example
└── requirements.txt
```

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

Die Tests decken `config.py` und `optimizer.py` ab und laufen ohne echte
Ads-Zugangsdaten (die Provider-Module werden dabei nicht importiert).

## Bekannte Einschränkungen

- `sync`/`create_campaign` legt Kampagne, Budget und Geo-Targeting an,
  aber **kein finales Anzeigen-Creative** (Bild/Video, exakte
  Anzeigentext-Varianten) — das bewusst manuell im jeweiligen Ads-Manager
  ergänzen, um volle Kontrolle über das Erscheinungsbild zu behalten.
- Geo-Targeting bei Google Ads ist auf eine kleine DACH-Lookup-Tabelle
  begrenzt (`_GEO_TARGET_CONSTANTS` in `google_ads.py`) — für weitere
  Länder dort ergänzen.
- Die Budget-Verschiebung ist eine einfache Zwei-Kampagnen-Regel (bester
  vs. schwächster Performer), kein vollständiger Multi-Armed-Bandit-Optimierer.
