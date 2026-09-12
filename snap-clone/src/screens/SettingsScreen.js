import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import SettingsRow from "../components/SettingsRow";
import SettingsSection from "../components/SettingsSection";
import SettingsToggleRow from "../components/SettingsToggleRow";
import { useAuth } from "../context/AuthContext";
import { FOUNDER_USERNAME } from "../services/ticketService";
import { getSoundEffectsEnabled, setSoundEffectsEnabled } from "../utils/soundEffects";
import { generateDataExportPdf } from "../utils/dataExportPdf";
import { getQuietHours, setQuietHours } from "../utils/quietHours";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Fest verdrahtet statt ueber expo-constants gelesen: das Modul ist in
// bisher ausgelieferten Builds nicht dabei, ein neues natives Modul nur fuer
// die Versionsanzeige waere unnoetig riskant. Muss beim Aendern der Version
// in app.json manuell mitgezogen werden.
const APP_VERSION = "1.0.1";

// Eigener Screen statt eingebetteter Liste in ProfileScreen - Profil bleibt
// so eine reine Identitaets-/Beitraege-Ansicht, waehrend Einstellungen ihre
// eigene, uebersichtliche Gruppenliste im iOS-Stil bekommen.
export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietHours, setQuietHoursState] = useState({ enabled: false, startHour: 22, endHour: 8 });
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (label) => !q || label.toLowerCase().includes(q);
  const anyMatch = (labels) => !q || labels.some(matches);
  const ALL_LABELS = [
    "Mein Nata-Code", "Einladungen", "Connections verwalten", "Enge Freunde", "Meine Kreise",
    "Entdecken", "Gespeicherte Beiträge", "Meine Statistik", "Momente-Archiv", "Anrufe", "Challenges",
    "Leaderboard", "Nata Wrapped", "Verifizierung beantragen", "Creator-Studio", "Creator werden",
    "Privatsphäre", "Datenschutz & Nutzungsbedingungen", "Eigene Daten herunterladen",
    "Benachrichtigungen ansehen", "Sound-Effekte im Chat", "Nicht-stören-Zeiten",
    "Sicherheitsmaßnahmen", "Support-Tickets", "Blockierte Nutzer", "Konto löschen",
    "Gründer-Dashboard", "Über Nata", "Roadmap", "Feedback geben", "Abmelden",
  ];
  const hasAnyResult = !q || ALL_LABELS.some(matches);

  useEffect(() => {
    getSoundEffectsEnabled().then(setSoundEnabled);
    getQuietHours().then(setQuietHoursState);
  }, []);

  const handleToggleSound = (value) => {
    setSoundEnabled(value);
    setSoundEffectsEnabled(value);
  };

  const updateQuietHours = (partial) => {
    const next = { ...quietHours, ...partial };
    setQuietHoursState(next);
    setQuietHours(next);
  };

  const handleDataExport = () => {
    Alert.alert(
      "Eigene Daten herunterladen",
      "Erstellt eine PDF-Zusammenfassung deines Profils, deiner Beiträge und deiner Punkte-Historie zum Speichern oder Teilen.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Erstellen", onPress: () => generateDataExportPdf(user) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Abmelden", "Moechtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Abmelden", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.bigHeader, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
          <Icon name="back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.bigTitle}>Einstellungen{"\n"}und Datenschutz</Text>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Einstellungen durchsuchen"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
              <Icon name="close" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!q ? (
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <View style={[styles.profileAvatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
            <Text style={styles.profileAvatarText}>
              {(user?.displayName || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{user?.displayName}</Text>
            <Text style={styles.profileUsername}>@{user?.username}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        ) : null}

        {anyMatch(["Mein Nata-Code", "Einladungen", "Connections verwalten", "Enge Freunde", "Meine Kreise"]) ? (
        <>
        <Text style={styles.sectionLabel}>Konto</Text>
        <SettingsSection>
          {matches("Mein Nata-Code") ? (
            <SettingsRow icon="grid" label="Mein Nata-Code" onPress={() => navigation.navigate("QRCode")} />
          ) : null}
          {matches("Einladungen") ? (
            <SettingsRow icon="ticket" label="Einladungen" onPress={() => navigation.navigate("Referral")} />
          ) : null}
          {matches("Connections verwalten") ? (
            <SettingsRow
              icon="people"
              label="Connections verwalten"
              onPress={() => navigation.navigate("Tabs", { screen: "Friends" })}
            />
          ) : null}
          {matches("Enge Freunde") ? (
            <SettingsRow icon="star" label="Enge Freunde" onPress={() => navigation.navigate("CloseFriends")} />
          ) : null}
          {matches("Meine Kreise") ? (
            <SettingsRow icon="people" label="Meine Kreise" onPress={() => navigation.navigate("Circles")} />
          ) : null}
        </SettingsSection>
        </>
        ) : null}

        {anyMatch(["Entdecken", "Gespeicherte Beiträge", "Meine Statistik", "Momente-Archiv", "Anrufe", "Challenges", "Leaderboard", "Nata Wrapped"]) ? (
        <>
        <Text style={styles.sectionLabel}>Aktivität</Text>
        <SettingsSection>
          {matches("Entdecken") ? (
            <SettingsRow
              icon="search"
              label="Entdecken"
              onPress={() => navigation.navigate("Tabs", { screen: "Discovery" })}
            />
          ) : null}
          {matches("Gespeicherte Beiträge") ? (
            <SettingsRow icon="bookmark" label="Gespeicherte Beiträge" onPress={() => navigation.navigate("SavedPosts")} />
          ) : null}
          {matches("Meine Statistik") ? (
            <SettingsRow icon="grid" label="Meine Statistik" onPress={() => navigation.navigate("MyStats")} />
          ) : null}
          {matches("Momente-Archiv") ? (
            <SettingsRow icon="moment" label="Momente-Archiv" onPress={() => navigation.navigate("MomentsArchive")} />
          ) : null}
          {matches("Anrufe") ? (
            <SettingsRow
              icon="call"
              label="Anrufe"
              onPress={() => navigation.navigate("CallHistory")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
          {matches("Challenges") ? (
            <SettingsRow
              icon="flame"
              label="Challenges"
              onPress={() => navigation.navigate("Challenges")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
          {matches("Leaderboard") ? (
            <SettingsRow
              icon="star"
              label="Leaderboard"
              onPress={() => navigation.navigate("Leaderboard")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
          {(() => {
            const now = new Date();
            const wrappedLive = now >= new Date(now.getFullYear(), now.getMonth(), 20, 2, 0, 0);
            return wrappedLive && matches("Nata Wrapped") ? (
              <SettingsRow
                icon="sparkle"
                label="Nata Wrapped"
                onPress={() => navigation.navigate("Wrapped")}
                badge={<BetaBadge style={styles.feedbackBadge} />}
              />
            ) : null;
          })()}
        </SettingsSection>
        </>
        ) : null}

        {anyMatch(["Verifizierung beantragen", "Creator-Studio", "Creator werden"]) ? (
        <>
        <Text style={styles.sectionLabel}>Creator</Text>
        <SettingsSection>
          {!user?.verified && matches("Verifizierung beantragen") ? (
            <SettingsRow
              icon="shield"
              label="Verifizierung beantragen"
              onPress={() => navigation.navigate("VerificationRequest")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
          {user?.isCreator ? (
            matches("Creator-Studio") ? (
              <SettingsRow
                icon="star"
                label="Creator-Studio"
                onPress={() => navigation.navigate("CreatorStudio")}
                badge={<BetaBadge style={styles.feedbackBadge} />}
              />
            ) : null
          ) : matches("Creator werden") ? (
            <SettingsRow
              icon="star"
              label="Creator werden"
              onPress={() => navigation.navigate("CreatorRequest")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
        </SettingsSection>
        </>
        ) : null}

        {anyMatch(["Privatsphäre", "Datenschutz & Nutzungsbedingungen", "Eigene Daten herunterladen"]) ? (
        <>
        <Text style={styles.sectionLabel}>Privatsphäre</Text>
        <SettingsSection>
          {matches("Privatsphäre") ? (
            <SettingsRow icon="lock" label="Privatsphäre" onPress={() => navigation.navigate("Privacy")} />
          ) : null}
          {matches("Datenschutz & Nutzungsbedingungen") ? (
            <SettingsRow
              icon="document"
              label="Datenschutz & Nutzungsbedingungen"
              onPress={() => navigation.navigate("Legal")}
            />
          ) : null}
          {matches("Eigene Daten herunterladen") ? (
            <SettingsRow icon="document" label="Eigene Daten herunterladen" onPress={handleDataExport} />
          ) : null}
        </SettingsSection>
        </>
        ) : null}

        {anyMatch(["Benachrichtigungen ansehen", "Sound-Effekte im Chat", "Nicht-stören-Zeiten"]) ? (
        <>
        <Text style={styles.sectionLabel}>Benachrichtigungen</Text>
        <SettingsSection>
          {matches("Benachrichtigungen ansehen") ? (
            <SettingsRow
              icon="bell"
              label="Benachrichtigungen ansehen"
              onPress={() => navigation.navigate("Notifications")}
            />
          ) : null}
          {matches("Sound-Effekte im Chat") ? (
            <SettingsToggleRow
              icon="chat"
              label="Sound-Effekte im Chat"
              value={soundEnabled}
              onValueChange={handleToggleSound}
            />
          ) : null}
          {matches("Nicht-stören-Zeiten") ? (
            <SettingsToggleRow
              icon="bell"
              label="Nicht-stören-Zeiten"
              value={quietHours.enabled}
              onValueChange={(value) => updateQuietHours({ enabled: value })}
            />
          ) : null}
        </SettingsSection>
        </>
        ) : null}
        {quietHours.enabled && matches("Nicht-stören-Zeiten") ? (
          <View style={styles.quietHoursCard}>
            <Text style={styles.quietHoursText}>
              Stumm von {String(quietHours.startHour).padStart(2, "0")}:00 bis{" "}
              {String(quietHours.endHour).padStart(2, "0")}:00 Uhr
            </Text>
            <Text style={styles.quietHoursHint}>
              Gilt für In-App-Hinweise (Banner, Ton) - echte Push-Benachrichtigungen sind noch
              nicht aktiv, greifen aber automatisch mit, sobald es sie gibt.
            </Text>
            <View style={styles.quietHoursRow}>
              <HourStepper
                label="Von"
                value={quietHours.startHour}
                onChange={(h) => updateQuietHours({ startHour: h })}
              />
              <HourStepper
                label="Bis"
                value={quietHours.endHour}
                onChange={(h) => updateQuietHours({ endHour: h })}
              />
            </View>
          </View>
        ) : null}

        {anyMatch(["Sicherheitsmaßnahmen", "Support-Tickets", "Blockierte Nutzer", "Konto löschen"]) ? (
        <>
        <Text style={styles.sectionLabel}>Sicherheit</Text>
        <SettingsSection>
          {matches("Sicherheitsmaßnahmen") ? (
            <SettingsRow icon="shield" label="Sicherheitsmaßnahmen" onPress={() => navigation.navigate("Security")} />
          ) : null}
          {matches("Support-Tickets") ? (
            <SettingsRow icon="chat" label="Support-Tickets" onPress={() => navigation.navigate("Tickets")} />
          ) : null}
          {matches("Blockierte Nutzer") ? (
            <SettingsRow icon="block" label="Blockierte Nutzer" onPress={() => navigation.navigate("BlockedUsers")} />
          ) : null}
          {matches("Konto löschen") ? (
            <SettingsRow
              icon="trash"
              label="Konto löschen"
              onPress={() => navigation.navigate("DeleteAccount")}
              tint={colors.danger}
            />
          ) : null}
        </SettingsSection>
        </>
        ) : null}

        {user?.username === FOUNDER_USERNAME && matches("Gründer-Dashboard") ? (
          <>
            <Text style={styles.sectionLabel}>Gründer</Text>
            <SettingsSection>
              <SettingsRow
                icon="crown"
                label="Gründer-Dashboard"
                onPress={() => navigation.navigate("FounderDashboard")}
              />
            </SettingsSection>
          </>
        ) : null}

        {anyMatch(["Über Nata", "Roadmap", "Feedback geben", "Abmelden"]) ? (
        <>
        <Text style={styles.sectionLabel}>App</Text>
        <SettingsSection>
          {matches("Über Nata") ? (
            <SettingsRow icon="info" label="Über Nata" onPress={() => navigation.navigate("About")} />
          ) : null}
          {matches("Roadmap") ? (
            <SettingsRow icon="roadmap" label="Roadmap" onPress={() => navigation.navigate("Roadmap")} />
          ) : null}
          {matches("Feedback geben") ? (
            <SettingsRow
              icon="chat"
              label="Feedback geben"
              onPress={() => navigation.navigate("Feedback")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
          {matches("Abmelden") ? (
            <SettingsRow icon="logout" label="Abmelden" onPress={handleLogout} tint={colors.danger} />
          ) : null}
        </SettingsSection>
        </>
        ) : null}

        {q && !hasAnyResult ? (
          <Text style={styles.noResultsText}>Keine Einstellung gefunden für "{query}".</Text>
        ) : null}

        {!q ? (
          <Text style={styles.footerText}>
            Nata {APP_VERSION}
            {user?.betaTesterNumber ? ` · Beta-Tester #${user.betaTesterNumber}` : ""}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function HourStepper({ label, value, onChange }) {
  const step = (delta) => onChange((value + delta + 24) % 24);
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperButton} onPress={() => step(-1)} hitSlop={8}>
          <Text style={styles.stepperButtonText}>–</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{String(value).padStart(2, "0")}:00</Text>
        <TouchableOpacity style={styles.stepperButton} onPress={() => step(1)} hitSlop={8}>
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bigHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  bigTitle: {
    color: colors.text,
    ...typography.hero,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    padding: 0,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  profileAvatarText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "800",
  },
  profileTextBlock: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    ...typography.headline,
  },
  profileUsername: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 22,
    marginLeft: spacing.xs,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  feedbackBadge: {
    marginRight: spacing.sm,
  },
  footerText: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  noResultsText: {
    color: colors.textMuted,
    ...typography.subhead,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  quietHoursCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quietHoursText: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "700",
  },
  quietHoursHint: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  quietHoursRow: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  stepper: {
    flex: 1,
  },
  stepperLabel: {
    color: colors.textMuted,
    ...typography.caption,
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  stepperValue: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
});
