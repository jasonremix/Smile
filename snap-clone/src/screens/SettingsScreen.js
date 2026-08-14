import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import SettingsRow from "../components/SettingsRow";
import SettingsSection from "../components/SettingsSection";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
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
});
