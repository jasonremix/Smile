import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { auth } from "../config/firebase";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Bewusst "Sicherheitsmassnahmen" statt "Zertifikate": Nata ist eine
// Beta-App eines kleinen, unabhaengigen Teams ohne formale externe
// Sicherheitszertifizierung (ISO 27001, SOC 2 o.ae.). Erfundene
// Compliance-Badges anzuzeigen waere irrefuehrend - stattdessen listet
// diese Seite ehrlich auf, welche konkreten technischen Massnahmen
// tatsaechlich umgesetzt sind (siehe Master-Prompt Sektion 51: keine
// vorgetaeuschte Funktionalitaet).
// badge = kurzes Label fuer die Chip-Uebersicht oben, title/detail fuer die
// ausfuehrliche, nach Kategorie gruppierte Liste darunter - dieselbe
// Quelle fuer beides, damit nichts auseinanderlaufen kann. Bewusst keine
// kreisrunden "Siegel"-Formen oder goldene Farben fuer die Chips - das
// wuerde optisch eine offizielle Zertifizierung suggerieren, die es nicht
// gibt. Drei Kategorien statt einer langen Liste, damit die Seite mit
// wachsender Anzahl an Massnahmen uebersichtlich bleibt.
const CATEGORIES = [
  {
    label: "Kommunikation & Inhalte",
    items: [
      {
        icon: "lock",
        badge: "TLS-verschlüsselt",
        title: "Verschlüsselte Übertragung",
        detail:
          "Jede Verbindung zwischen der App und unseren Servern läuft ausschließlich über HTTPS/TLS-Verschlüsselung.",
      },
      {
        icon: "warning",
        badge: "Inhaltsprüfung",
        title: "Automatische Inhaltsprüfung",
        detail:
          "Beiträge, Kommentare, Nachrichten und Profiltexte werden vor dem Absenden automatisch auf Beleidigungen, Drohungen und offensichtlichen Spam geprüft - zusätzlich zur Prüfung in der App auch direkt in unseren Datenbank-Zugriffsregeln, greift also selbst bei einem direkten Schreibversuch gegen die Datenbank.",
      },
      {
        icon: "info",
        badge: "Krisen-Unterstützung",
        title: "Unterstützung bei Krisen",
        detail:
          "Erkennt unsere Prüfung Anzeichen akuter Selbstgefährdung, wird der Text nicht gesendet - stattdessen bekommst du einen einfühlsamen Hinweis mit der kostenlosen, anonymen Telefonseelsorge statt einer reinen Regelverstoß-Meldung.",
      },
      {
        icon: "block",
        badge: "Blockieren & Melden",
        title: "Blockieren & Melden",
        detail:
          "Jede Person, jeder Beitrag und jede Nachricht lässt sich melden oder blockieren - blockierte Personen sehen dich nicht mehr. Meldungen lassen sich als PDF-Vorfallsbericht dokumentieren.",
      },
      {
        icon: "shield",
        badge: "Automatische Sperren",
        title: "Automatische Sperr-Eskalation",
        detail:
          "Wiederholte, von der Inhaltsprüfung erkannte Verstöße lösen automatisch einen zeitlich befristeten Timeout aus - die Dauer richtet sich nach Schwere und Häufigkeit und wird direkt in unseren Datenbank-Zugriffsregeln durchgesetzt, nicht nur im Client. Selbstgefährdung führt nie zu einer Sperre, nur zu Hilfsangeboten.",
      },
    ],
  },
  {
    label: "Dein Konto",
    items: [
      {
        icon: "shield",
        badge: "Gehashte Passwörter",
        title: "Passwörter nie im Klartext",
        detail:
          "Passwörter werden von Google Firebase Authentication gehasht gespeichert - selbst wir können dein Passwort nicht einsehen.",
      },
      {
        icon: "check",
        badge: "Google-/Apple-Login",
        title: "Google- & Apple-Anmeldung",
        detail:
          "Alternative zur Passwort-Anmeldung über etablierte Identitätsanbieter, kein eigenes Passwort nötig.",
      },
      {
        icon: "trash",
        badge: "Jederzeit löschbar",
        title: "Konto jederzeit löschbar",
        detail:
          "Löschung direkt in der App, ohne Support-Anfrage - dein Profil, deine Beiträge und Verbindungen werden entfernt.",
      },
    ],
  },
  {
    label: "Privatsphäre & Datenzugriff",
    items: [
      {
        icon: "shield",
        badge: "Zugriffsregeln",
        title: "Zugriffsregeln auf Datenbank-Ebene",
        detail:
          "Jede Anfrage an unsere Datenbank wird gegen strikte Sicherheitsregeln geprüft: Nutzer sehen nur, was sie laut Regel sehen dürfen - z. B. eigene Nachrichten, Benachrichtigungen nur im eigenen Postfach.",
      },
      {
        icon: "pin",
        badge: "Standort-Opt-in",
        title: "Standort nur mit Zustimmung",
        detail:
          "Standort-Teilen ist Opt-in und speichert nie exakte Koordinaten, nur den Stadtnamen - jederzeit widerrufbar.",
      },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);

function formatMetaDate(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleDateString("de-DE") + ", " + date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function SecurityScreen({ navigation }) {
  // Firebase Auth liefert nur einen einzelnen "letzte Anmeldung"-Zeitstempel,
  // keine Liste einzelner Geraete/Sitzungen - das braeuchte eine eigene
  // Backend-Infrastruktur (Admin SDK), die es fuer Nata nicht gibt. Deshalb
  // hier ehrlich nur die echten, tatsaechlich verfuegbaren Werte statt einer
  // vorgetaeuschten Geraete-Liste mit erfundenen "Abmelden"-Buttons.
  const metadata = auth.currentUser?.metadata;

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Sicherheit" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Nata ist eine Beta-App eines kleinen, unabhängigen Teams - wir haben (noch) keine
          formale externe Sicherheitszertifizierung wie ISO 27001 oder SOC 2. Statt das
          vorzutäuschen, zeigen wir hier ehrlich, welche konkreten Maßnahmen wir umsetzen.
        </Text>

        <View style={styles.badgeRow}>
          {ALL_ITEMS.map((item) => (
            <View key={item.badge} style={styles.badge}>
              <Icon name={item.icon} size={13} color={colors.primaryLight} style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.badgeDisclaimer}>
          Eigene Einschätzung unseres Teams, keine externe Prüfstelle hat das zertifiziert.
        </Text>

        {CATEGORIES.map((category) => (
          <View key={category.label}>
            <Text style={styles.sectionLabel}>{category.label}</Text>
            <View style={styles.card}>
              {category.items.map((item, i) => (
                <View
                  key={item.title}
                  style={[styles.row, i === category.items.length - 1 && styles.noBorder]}
                >
                  <Icon name={item.icon} size={16} color={colors.primaryLight} style={styles.rowIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Konto-Aktivität</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="person" size={16} color={colors.primaryLight} style={styles.rowIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Konto erstellt</Text>
              <Text style={styles.rowDetail}>{formatMetaDate(metadata?.creationTime)}</Text>
            </View>
          </View>
          <View style={[styles.row, styles.noBorder]}>
            <Icon name="check" size={16} color={colors.primaryLight} style={styles.rowIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Letzte Anmeldung</Text>
              <Text style={styles.rowDetail}>{formatMetaDate(metadata?.lastSignInTime)}</Text>
              <Text style={styles.metaCaveat}>
                Firebase liefert nur diesen einen Zeitstempel, keine Liste einzelner Geräte -
                dafür bräuchte es ein eigenes Backend, das es für Nata noch nicht gibt.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footnote}>
          Fragen, eine automatische Sperre unklar oder ein Sicherheitshinweis? Eröffne ein
          "Support-Ticket" in den Einstellungen - ein Bot antwortet sofort, bei Bedarf kannst du
          an den Gründer weiterleiten.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 19,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  badgeIcon: {
    marginRight: spacing.xs,
  },
  badgeText: {
    color: colors.text,
    ...typography.caption,
    fontWeight: "700",
  },
  badgeDisclaimer: {
    color: colors.textMuted,
    ...typography.caption,
    fontStyle: "italic",
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  rowTitle: {
    color: colors.text,
    ...typography.subhead,
    marginBottom: 2,
  },
  rowDetail: {
    color: colors.textMuted,
    ...typography.caption,
    lineHeight: 17,
  },
  metaCaveat: {
    color: colors.textMuted,
    ...typography.caption,
    fontStyle: "italic",
    lineHeight: 16,
    marginTop: 4,
  },
  footnote: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
