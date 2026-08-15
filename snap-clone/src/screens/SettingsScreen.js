import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietHours, setQuietHoursState] = useState({ enabled: false, startHour: 22, endHour: 8 });

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
      <ScreenHeader title="Einstellungen" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.sectionLabel}>Konto</Text>
        <SettingsSection>
          <SettingsRow icon="grid" label="Mein Nata-Code" onPress={() => navigation.navigate("QRCode")} />
          <SettingsRow icon="ticket" label="Einladungen" onPress={() => navigation.navigate("Referral")} />
          <SettingsRow icon="people" label="Connections verwalten" onPress={() => navigation.navigate("Friends")} />
          <SettingsRow icon="star" label="Enge Freunde" onPress={() => navigation.navigate("CloseFriends")} />
          <SettingsRow icon="people" label="Meine Kreise" onPress={() => navigation.navigate("Circles")} />
          <SettingsRow icon="search" label="Entdecken" onPress={() => navigation.navigate("Discovery")} />
          <SettingsRow icon="bookmark" label="Gespeicherte Beiträge" onPress={() => navigation.navigate("SavedPosts")} />
          <SettingsRow icon="grid" label="Meine Statistik" onPress={() => navigation.navigate("MyStats")} />
          <SettingsRow icon="moment" label="Momente-Archiv" onPress={() => navigation.navigate("MomentsArchive")} />
          {!user?.verified ? (
            <SettingsRow
              icon="shield"
              label="Verifizierung beantragen"
              onPress={() => navigation.navigate("VerificationRequest")}
              badge={<BetaBadge style={styles.feedbackBadge} />}
            />
          ) : null}
        </SettingsSection>

        <Text style={styles.sectionLabel}>Privatsphäre</Text>
        <SettingsSection>
          <SettingsRow icon="lock" label="Privatsphäre" onPress={() => navigation.navigate("Privacy")} />
          <SettingsRow
            icon="document"
            label="Datenschutz & Nutzungsbedingungen"
            onPress={() => navigation.navigate("Legal")}
          />
          <SettingsRow icon="document" label="Eigene Daten herunterladen" onPress={handleDataExport} />
        </SettingsSection>

        <Text style={styles.sectionLabel}>Benachrichtigungen</Text>
        <SettingsSection>
          <SettingsRow
            icon="bell"
            label="Benachrichtigungen ansehen"
            onPress={() => navigation.navigate("Notifications")}
          />
          <SettingsToggleRow
            icon="chat"
            label="Sound-Effekte im Chat"
            value={soundEnabled}
            onValueChange={handleToggleSound}
          />
          <SettingsToggleRow
            icon="bell"
            label="Nicht-stören-Zeiten"
            value={quietHours.enabled}
            onValueChange={(value) => updateQuietHours({ enabled: value })}
          />
        </SettingsSection>
        {quietHours.enabled ? (
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

        <Text style={styles.sectionLabel}>Sicherheit</Text>
        <SettingsSection>
          <SettingsRow icon="shield" label="Sicherheitsmaßnahmen" onPress={() => navigation.navigate("Security")} />
          <SettingsRow icon="chat" label="Support-Tickets" onPress={() => navigation.navigate("Tickets")} />
          <SettingsRow icon="block" label="Blockierte Nutzer" onPress={() => navigation.navigate("BlockedUsers")} />
          <SettingsRow
            icon="trash"
            label="Konto löschen"
            onPress={() => navigation.navigate("DeleteAccount")}
            tint={colors.danger}
          />
        </SettingsSection>

        {user?.username === FOUNDER_USERNAME ? (
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

        <Text style={styles.sectionLabel}>App</Text>
        <SettingsSection>
          <SettingsRow icon="info" label="Über Nata" onPress={() => navigation.navigate("About")} />
          <SettingsRow icon="roadmap" label="Roadmap" onPress={() => navigation.navigate("Roadmap")} />
          <SettingsRow
            icon="chat"
            label="Feedback geben"
            onPress={() => navigation.navigate("Feedback")}
            badge={<BetaBadge style={styles.feedbackBadge} />}
          />
          <SettingsRow icon="logout" label="Abmelden" onPress={handleLogout} tint={colors.danger} />
        </SettingsSection>

        <Text style={styles.footerText}>
          Nata {APP_VERSION}
          {user?.betaTesterNumber ? ` · Beta-Tester #${user.betaTesterNumber}` : ""}
        </Text>
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
