import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BetaBadge from "../components/BetaBadge";
import ScreenHeader from "../components/ScreenHeader";
import SettingsRow from "../components/SettingsRow";
import SettingsSection from "../components/SettingsSection";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Eigener Screen statt eingebetteter Liste in ProfileScreen - Profil bleibt
// so eine reine Identitaets-/Beitraege-Ansicht, waehrend Einstellungen ihre
// eigene, uebersichtliche Gruppenliste im iOS-Stil bekommen.
export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

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
        <Text style={styles.sectionLabel}>Konto</Text>
        <SettingsSection>
          <SettingsRow icon="grid" label="Mein Nata-Code" onPress={() => navigation.navigate("QRCode")} />
          <SettingsRow icon="ticket" label="Einladungen" onPress={() => navigation.navigate("Referral")} />
        </SettingsSection>

        <Text style={styles.sectionLabel}>Verbindungen</Text>
        <SettingsSection>
          <SettingsRow icon="people" label="Connections verwalten" onPress={() => navigation.navigate("Friends")} />
          <SettingsRow icon="search" label="Entdecken" onPress={() => navigation.navigate("Discovery")} />
          <SettingsRow icon="block" label="Blockierte Nutzer" onPress={() => navigation.navigate("BlockedUsers")} />
        </SettingsSection>

        <Text style={styles.sectionLabel}>Privatsphäre & Rechtliches</Text>
        <SettingsSection>
          <SettingsRow icon="lock" label="Privatsphäre" onPress={() => navigation.navigate("Privacy")} />
          <SettingsRow
            icon="document"
            label="Datenschutz & Nutzungsbedingungen"
            onPress={() => navigation.navigate("Legal")}
          />
        </SettingsSection>

        <Text style={styles.sectionLabel}>Support</Text>
        <SettingsSection>
          <SettingsRow
            icon="chat"
            label="Feedback geben"
            onPress={() => navigation.navigate("Feedback")}
            badge={<BetaBadge style={styles.feedbackBadge} />}
          />
        </SettingsSection>

        <Text style={styles.sectionLabel}>Konto verwalten</Text>
        <SettingsSection>
          <SettingsRow icon="logout" label="Abmelden" onPress={handleLogout} tint={colors.danger} />
          <SettingsRow
            icon="trash"
            label="Konto löschen"
            onPress={() => navigation.navigate("DeleteAccount")}
            tint={colors.danger}
          />
        </SettingsSection>

        {user?.betaTesterNumber ? (
          <Text style={styles.footerText}>Beta-Tester #{user.betaTesterNumber} · Nata</Text>
        ) : null}
      </ScrollView>
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
});
