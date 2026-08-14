import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Echte, ehrliche Roadmap statt Marketing-Versprechen: "Kuerzlich" spiegelt
// tatsaechlich bereits ausgelieferte Funktionen wider, "Geplant" den
// echten, aktuellen Backlog - ohne feste Datumszusagen, die wir als
// Beta-Team nicht garantieren koennen.
const SHIPPED = [
  "Automatische Sperr-/Timeout-Eskalation bei wiederholten Verstößen - Dauer richtet sich nach Schwere, serverseitig in den Datenbank-Zugriffsregeln durchgesetzt (nicht nur im Client umgehbar)",
  "Support-Tickets: Bot-Antworten in Echtzeit, mit optionaler Weiterleitung an den Gründer (@jasonbuerger)",
  "Automatische Inhaltsprüfung, client- und serverseitig (Firestore-Regeln) - deutlich erweiterte Begriffsliste, eigene Kategorie für Drohungen sowie einfühlsame Krisen-Unterstützung mit Telefonseelsorge-Hinweis statt reiner Regelverstoß-Meldung",
  "Strukturiertes Melden-Formular (was/wann/Beschreibung) mit optionalem PDF-Vorfallsbericht",
  "Notification Center für Likes, Kommentare und Verbindungsanfragen",
  "Globale Suche über Personen und Beiträge",
  "Erweiterte Privatsphäre-Stufen (Sichtbarkeit in Suche, Connections-Liste)",
  "Profil bearbeiten: Name, Bio, Avatarfarbe, optionales Standort-Teilen",
  "Sprachnachrichten als Beta-Funktion",
  "Überarbeitetes Design: Navigation, Profil, Connections, Discover",
];

const PLANNED = [
  {
    title: "Push-Benachrichtigungen",
    detail: "Benachrichtigungen auch, wenn die App im Hintergrund oder geschlossen ist.",
  },
  {
    title: "Profilbilder & Sprachnachrichten-Versand",
    detail: "Code ist fertig, wartet auf die Einrichtung des Cloud-Speichers.",
  },
  {
    title: "Feinere Inhaltsprüfung per Cloud Functions",
    detail:
      "Die serverseitige Prüfung läuft aktuell über Firestore-Regeln (feste Begriffsliste). Komplexere Erkennung - z. B. Kontext, Bilder, Umgehungsversuche - würde echte Cloud Functions brauchen.",
  },
  {
    title: "Einreichung im App Store & Play Store",
    detail: "Damit Nata ohne Beta-Kanal installierbar wird.",
  },
];

export default function RoadmapScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Roadmap" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Nata ist eine Beta - hier siehst du ehrlich, was schon da ist und woran wir als Nächstes
          arbeiten. Keine festen Termine, weil wir als kleines Team nichts versprechen wollen, was
          wir nicht halten können.
        </Text>

        <Text style={styles.sectionLabel}>Kürzlich hinzugefügt</Text>
        <View style={styles.card}>
          {SHIPPED.map((item, i) => (
            <View key={item} style={[styles.shippedRow, i === SHIPPED.length - 1 && styles.noBorder]}>
              <Icon name="check" size={14} color={colors.online} style={styles.rowIcon} />
              <Text style={styles.shippedText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Als Nächstes geplant</Text>
        <View style={styles.card}>
          {PLANNED.map((item, i) => (
            <View key={item.title} style={[styles.plannedRow, i === PLANNED.length - 1 && styles.noBorder]}>
              <Icon name="roadmap" size={16} color={colors.primaryLight} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.plannedTitle}>{item.title}</Text>
                <Text style={styles.plannedDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
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
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  shippedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  plannedRow: {
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
  shippedText: {
    flex: 1,
    color: colors.text,
    ...typography.footnote,
    lineHeight: 19,
  },
  plannedTitle: {
    color: colors.text,
    ...typography.subhead,
    marginBottom: 2,
  },
  plannedDetail: {
    color: colors.textMuted,
    ...typography.caption,
    lineHeight: 16,
  },
});
