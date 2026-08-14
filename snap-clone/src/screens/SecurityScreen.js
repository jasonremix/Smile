import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
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
const MEASURES = [
  {
    title: "Verschlüsselte Übertragung",
    detail:
      "Jede Verbindung zwischen der App und unseren Servern läuft ausschließlich über HTTPS/TLS-Verschlüsselung.",
  },
  {
    title: "Passwörter nie im Klartext",
    detail:
      "Passwörter werden von Google Firebase Authentication gehasht gespeichert - selbst wir können dein Passwort nicht einsehen.",
  },
  {
    title: "Zugriffsregeln auf Datenbank-Ebene",
    detail:
      "Jede Anfrage an unsere Datenbank wird gegen strikte Sicherheitsregeln geprüft: Nutzer sehen nur, was sie laut Regel sehen dürfen - z. B. eigene Nachrichten, Benachrichtigungen nur im eigenen Postfach.",
  },
  {
    title: "Standort nur mit Zustimmung",
    detail:
      "Standort-Teilen ist Opt-in und speichert nie exakte Koordinaten, nur den Stadtnamen - jederzeit widerrufbar.",
  },
  {
    title: "Google- & Apple-Anmeldung",
    detail:
      "Alternative zur Passwort-Anmeldung über etablierte Identitätsanbieter, kein eigenes Passwort nötig.",
  },
  {
    title: "Blockieren & Melden",
    detail:
      "Jede Person, jeder Beitrag und jede Nachricht lässt sich melden oder blockieren - blockierte Personen sehen dich nicht mehr.",
  },
  {
    title: "Konto jederzeit löschbar",
    detail:
      "Löschung direkt in der App, ohne Support-Anfrage - dein Profil, deine Beiträge und Verbindungen werden entfernt.",
  },
];

export default function SecurityScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Sicherheit" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Nata ist eine Beta-App eines kleinen, unabhängigen Teams - wir haben (noch) keine
          formale externe Sicherheitszertifizierung wie ISO 27001 oder SOC 2. Statt das
          vorzutäuschen, zeigen wir hier ehrlich, welche konkreten Maßnahmen wir umsetzen.
        </Text>

        <View style={styles.card}>
          {MEASURES.map((item, i) => (
            <View key={item.title} style={[styles.row, i === MEASURES.length - 1 && styles.noBorder]}>
              <Icon name="shield" size={16} color={colors.primaryLight} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          Fragen oder einen Sicherheitshinweis melden? Nutze "Feedback geben" in den
          Einstellungen.
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
  footnote: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
