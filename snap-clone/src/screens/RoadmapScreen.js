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
  "Neues, großes Beta-Paket: Challenges (zeitlich begrenzte Themen mit eigenem Feed und Teilnahme-Abzeichen), Umfrage-Sticker in Momenten, wöchentliches Leaderboard unter Connections, gemeinsame Streak-Ziele im Chat, Text-/Musik-Sticker beim Aufnehmen, Collab-Beiträge zu zweit, Zitat-Beiträge - alle aus echten Daten, ohne neue native Installation",
  "Nata Wrapped: ab dem 25. September jedes Jahr ein persönlicher Jahresrückblick aus echten Daten, mit jedes Jahr neuem Farb-Stil und Teilen-Funktion",
  "Gründer: Kohorten-Rückkehrquote (Tag 1/7/30) und zentrale Feature-Schalter für neue Beta-Funktionen",
  "Creator-Modus (Beta): eigenes goldenes Abzeichen, Antrag über die Einstellungen, Gründer prüft und entscheidet - wer angenommen wird, bekommt ein eigenes Creator-Studio mit echten Statistiken zu den eigenen Beiträgen (Reaktionen, Kommentare, meistbeachteter Beitrag)",
  "Sprachanrufe direkt in der App (Beta): Anrufen-Button im Chat und auf Profilen von Connections, eigener Anrufverlauf - braucht die neueste Version aus dem Beta-Kanal (neues natives Modul, kein reines Update)",
  "Eigene Kreise: beliebig viele selbst benannte Gruppen (z.B. Familie, Arbeit, Gaming) zum gezielten Teilen von Momenten - zusätzlich zur festen \"Enge Freunde\"-Liste",
  "Nata Code überarbeitet: kein Blind-Connect mehr beim Scannen - echte Profilvorschau mit gemeinsamen Interessen und gemeinsamen Connections vor dem Verbinden, drei Kontexte beim Teilen (schnell/unterwegs/Visitenkarte)",
  "Nata Match: Entdecken zeigt jetzt Personen mit gemeinsamen Interessen (echter Prozentsatz, keine \"perfekte Übereinstimmung\"-Behauptung)",
  "Persönlicher Einstieg nach dem Onboarding: Interessen wählen, dann Ziele auf Nata - direkt vor dem ersten Home-Start",
  "Nata AI erkennt jetzt auch Fotos (Vision) - Bild aufnehmen und direkt dazu fragen",
  "Live-Standort mit engen Freunden teilen (Beta, striktes Opt-in, nur Vordergrund, jederzeit abschaltbar)",
  "Zeitkapsel-Nachrichten im Chat: Nachricht jetzt schreiben, erst zu einem gewählten Zeitpunkt sichtbar",
  "Jahresrückblick als teilbares PDF, Interessens-Badges im Profil, gegenseitige-Freunde-Vorschläge in Discover",
  "Doppel-Tipp-Reaktion auf Momente, Nicht-stören-Zeiten für In-App-Hinweise",
  "Ehrliche Konto-Aktivität (Kontoerstellung/letzte Anmeldung) in der Sicherheits-Übersicht",
  "Erster-Start-Einführung für neue Nutzer:innen, Gründer-Dashboard bündelt alle Verwaltungs-Screens",
  "Momente-Archiv: eigene Momente dauerhaft über 24h hinaus behalten",
  "Eigene Statistik (längster Streak, bester Beitrag, aktivste Woche), eigene Daten als PDF herunterladen",
  "Streak-Jubiläen (7/30/100/365 Tage) als Benachrichtigung, tägliches Nutzungslimit für Nata AI",
  "Dezente, abschaltbare Sound-Effekte beim Senden/Empfangen von Nachrichten",
  "Verlaufs-Ring und Farbverlauf jetzt auch auf fremden Profilen, im Score-Balken und im aktiven Tab-Icon",
  "Zeitbasierte Begrüßung, Maskottchen in leeren Ansichten (Feed, Nachrichten, Benachrichtigungen, Suche)",
  "Offizielles Logo in der App (Anmeldung, Registrierung, Über Nata)",
  "Nata AI: eigener KI-Chat (Beta) für allgemeine Fragen, außerdem beantwortet der Support-Bot Tickets jetzt inhaltlich statt mit festen Textbausteinen",
  "Verifizierung beantragen (Beta): Formular mit Begründung und Nachweis-Links, Gründer prüft und entscheidet",
  "Beta-Ablauf-Countdown, überarbeiteter Home-Feed, Buttons/Profil/Beiträge/Nachrichten mit dezenten Farbverläufen aufgewertet",
  "Mehrere echte Fehler behoben: Einladungs-Zähler, Punkte-Historie, eine Sicherheitslücke in den Storys-Regeln, unnötiges Feed-Neuladen, Konto-Löschung vollständiger",
  "Enge Freunde: dauerhafte Liste, die beim Teilen eines Moments automatisch als Empfänger:innen vorausgewählt wird",
  "Mehr Reaktionen auf Beiträge (5 Emojis statt nur Herz) sowie Fotos in Beiträgen mit denselben Filtern wie bei Snaps/Moments",
  "Gespeicherte Beiträge: eigene Übersicht in den Einstellungen",
  "Foto-/Video-Filter beim Aufnehmen (Warm, Kühl, Sonnenuntergang, Nacht, Retro) - live im Sucher wählbar, für alle Empfänger:innen gleich sichtbar",
  "Ankündigungen des Gründers erscheinen jetzt dauerhaft in den Benachrichtigungen (nicht mehr nur als flüchtiger Banner)",
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
    title: "GIF-Suche beim Aufnehmen",
    detail:
      "Bewusst nicht umgesetzt - braucht einen externen API-Key (z.B. Giphy/Tenor), den nur der Gruender besorgen kann.",
  },
  {
    title: "Freihand-Zeichnen-Tool beim Aufnehmen",
    detail:
      "Bewusst nicht umgesetzt - bräuchte eine neue native Grafik-Bibliothek und damit einen neuen Build (wie bei den Anrufen, die iOS-Build-Zugang blockiert weiterhin einen sofortigen neuen Build).",
  },
  {
    title: "Feature-Schalter steuern noch keine UI-Sichtbarkeit",
    detail:
      "Die Schalter im Gründer-Bereich existieren und speichern echte Werte - sie blenden aktuell aber noch keine einzelnen App-Bereiche aus, sondern dienen als zentraler Statusüberblick.",
  },
  {
    title: "Push-Benachrichtigungen",
    detail:
      "Geraet fragt nach Login bereits die Berechtigung ab. Der tatsaechliche Versand braucht einen bezahlten Firebase-Plan (Blaze) fuer Cloud Functions - Code dafuer ist fertig, wartet auf Aktivierung.",
  },
  {
    title: "Sprachnachrichten-Versand & Profilbilder",
    detail: "Code ist fertig, wartet auf die Aktivierung von Firebase Storage.",
  },
  {
    title: "Design-Konsistenz-Durchgang",
    detail:
      "Erster Code-Durchgang: der Absturz-Bildschirm (ErrorBoundary) nutzte bisher eine eigene, " +
      "nicht zum Rest der App passende Farbwelt - jetzt auf die normalen Theme-Farben umgestellt. " +
      "Rund 30 ältere Screens verwenden noch feste Rundungs-Werte statt der gemeinsamen radius.js " +
      "Skala - eine vollständige Umstellung braucht eine echte visuelle Prüfung Screen für Screen, " +
      "die in dieser Umgebung ohne Simulator nicht seriös möglich ist.",
  },
  {
    title: "Eigene Kreise beim Posten (nicht nur bei Momenten)",
    detail:
      "Kreise lassen sich bereits beim Teilen eines Moments auswählen. Dieselbe gezielte Sichtbarkeit " +
      "auch für normale Beiträge im Feed einzuführen, braucht eine sorgfältige Anpassung der " +
      "Feed-Abfrage selbst (sonst riskiert man, den bestehenden, funktionierenden Feed zu brechen) - " +
      "kommt als eigener, separater Schritt.",
  },
  {
    title: "Feinere Inhaltsprüfung per Cloud Functions",
    detail:
      "Die serverseitige Prüfung läuft aktuell über Firestore-Regeln (feste Begriffsliste). Komplexere Erkennung - z. B. Kontext, Bilder, Umgehungsversuche - würde echte Cloud Functions brauchen.",
  },
  {
    title: "Einreichung im App Store & Play Store",
    detail:
      "Damit Nata ohne Beta-Kanal installierbar wird. Ziel: dein Konto, deine Connections, Beiträge " +
      "und dein Nata Score bleiben beim Umstieg von der Beta erhalten - das ist unser Plan, aber " +
      "noch keine feste Zusage, da der genaue Ablauf von der App-Store-Freigabe abhängt. Rechtzeitig " +
      "vor dem 24.09.2026 informieren wir hier und per Ankündigung genauer.",
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
