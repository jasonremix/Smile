import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

const TABS = [
  { id: "privacy", label: "Datenschutz" },
  { id: "terms", label: "Nutzungsbedingungen" },
];

export default function LegalScreen() {
  const [tab, setTab] = useState("privacy");

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "privacy" ? <PrivacyPolicy /> : <TermsOfService />}
      </ScrollView>
    </View>
  );
}

function Heading({ children }) {
  return <Text style={styles.heading}>{children}</Text>;
}

function Paragraph({ children }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function PrivacyPolicy() {
  return (
    <>
      <Text style={styles.title}>Datenschutzerklärung</Text>
      <Paragraph>Stand: August 2026</Paragraph>

      <Heading>1. Verantwortlicher</Heading>
      <Paragraph>
        Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist Nata Inc, gegründet von
        Jason Bürger, Deutschland. Kontakt für Datenschutzanfragen: jasonbuerger@icloud.com.
      </Paragraph>

      <Heading>2. Welche Daten wir verarbeiten</Heading>
      <Paragraph>
        Bei der Registrierung: E-Mail-Adresse, Benutzername, Anzeigename und ein gehashtes
        Passwort. Bei der Nutzung: von dir aufgenommene Fotos/Videos (Snaps und Moments),
        Chat-Nachrichten, deine Connections-Liste sowie Nutzungsdaten wie deinen Nata Score.
      </Paragraph>

      <Heading>3. Zweck und Rechtsgrundlage</Heading>
      <Paragraph>
        Wir verarbeiten diese Daten, um dir die Kernfunktionen der App bereitzustellen
        (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO): Konto und Login, Versenden und Anzeigen
        von Snaps/Moments, Chat mit Connections sowie den Connections- und Blockier-Mechanismus.
      </Paragraph>

      <Heading>4. Speicherdauer</Heading>
      <Paragraph>
        Snaps werden nach dem Ansehen bzw. spätestens 24 Stunden nach dem Versenden automatisch
        gelöscht. Moments sind 24 Stunden nach dem Posten sichtbar und werden danach automatisch
        entfernt. Chat-Nachrichten bleiben bestehen, bis du sie oder dein Konto löschst. Nach
        Löschung deines Kontos werden deine personenbezogenen Daten gemäß Abschnitt 7 entfernt.
      </Paragraph>

      <Heading>5. Auftragsverarbeiter / Empfänger</Heading>
      <Paragraph>
        Für Authentifizierung, Datenbank und Dateispeicher nutzen wir Google Firebase (Google
        Ireland Limited bzw. Google LLC). Mit Google besteht ein Auftragsverarbeitungsvertrag
        inklusive der EU-Standardvertragsklauseln für Datenübermittlungen in Drittländer. Weitere
        Informationen: https://firebase.google.com/support/privacy
      </Paragraph>

      <Heading>6. Deine Rechte</Heading>
      <Paragraph>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, dich bei einer
        Datenschutz-Aufsichtsbehörde zu beschweren.
      </Paragraph>

      <Heading>7. Kontolöschung</Heading>
      <Paragraph>
        Du kannst dein Konto jederzeit direkt in der App unter Profil → Konto löschen entfernen.
        Dabei werden dein Nutzerprofil, deine Connections, Blockierungen sowie deine
        hochgeladenen Medien gelöscht. Aus technischen Gründen kann die vollständige Löschung aus
        Backups bis zu 30 Tage dauern.
      </Paragraph>

      <Heading>8. Kinder</Heading>
      <Paragraph>
        Nata richtet sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine Daten von
        Kindern unter 13 Jahren.
      </Paragraph>

      <Heading>9. Änderungen</Heading>
      <Paragraph>
        Wir können diese Datenschutzerklärung anpassen, wenn sich die App oder rechtliche
        Anforderungen ändern. Die jeweils aktuelle Fassung findest du immer hier in der App.
      </Paragraph>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <Text style={styles.title}>Nutzungsbedingungen</Text>
      <Paragraph>Stand: August 2026</Paragraph>

      <Heading>1. Geltungsbereich</Heading>
      <Paragraph>
        Diese Nutzungsbedingungen gelten für die Nutzung der App Nata, angeboten von Nata Inc.
        Mit der Registrierung akzeptierst du diese Bedingungen.
      </Paragraph>

      <Heading>2. Mindestalter</Heading>
      <Paragraph>
        Du musst mindestens 13 Jahre alt sein, um Nata zu nutzen. Falls du minderjährig bist,
        brauchst du die Zustimmung deiner Erziehungsberechtigten.
      </Paragraph>

      <Heading>3. Dein Konto</Heading>
      <Paragraph>
        Du bist für die Sicherheit deines Passworts und alle Aktivitäten unter deinem Konto
        verantwortlich. Ein Konto ist nicht übertragbar.
      </Paragraph>

      <Heading>4. Inhalte und Verhalten</Heading>
      <Paragraph>
        Du darfst über Nata keine Inhalte teilen, die rechtswidrig sind, andere belästigen,
        bedrohen, diskriminieren oder deren Rechte verletzen (z. B. Urheber-, Persönlichkeits- oder
        Markenrechte). Wir behalten uns vor, gemeldete Inhalte zu prüfen und bei Verstößen zu
        entfernen sowie Konten zu sperren.
      </Paragraph>

      <Heading>5. Melden und Blockieren</Heading>
      <Paragraph>
        Du kannst andere Nutzer sowie einzelne Snaps, Moments und Nachrichten über die
        entsprechende Melden-Funktion melden und Nutzer blockieren. Gemeldete Inhalte werden von
        uns geprüft; bei Verstößen gegen diese Bedingungen können wir Inhalte entfernen oder
        Konten sperren.
      </Paragraph>

      <Heading>6. Verfügbarkeit</Heading>
      <Paragraph>
        Nata befindet sich in aktiver Entwicklung. Wir übernehmen keine Gewähr für eine
        unterbrechungsfreie Verfügbarkeit der App.
      </Paragraph>

      <Heading>7. Kündigung</Heading>
      <Paragraph>
        Du kannst dein Konto jederzeit über die App löschen. Wir können Konten bei Verstößen gegen
        diese Bedingungen sperren oder löschen.
      </Paragraph>

      <Heading>8. Haftung</Heading>
      <Paragraph>
        Nata Inc haftet nicht für Inhalte, die von Nutzern geteilt werden. Für Vorsatz und grobe
        Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit bleibt unsere Haftung
        unberührt.
      </Paragraph>

      <Heading>9. Kontakt</Heading>
      <Paragraph>
        Bei Fragen zu diesen Nutzungsbedingungen erreichst du uns unter jasonbuerger@icloud.com.
      </Paragraph>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  heading: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 6,
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
