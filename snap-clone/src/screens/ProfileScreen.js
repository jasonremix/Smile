import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BetaBadge from "../components/BetaBadge";
import NataScoreCard from "../components/NataScoreCard";
import SettingsRow from "../components/SettingsRow";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Abmelden", "Moechtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Abmelden", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          {user?.verified ? <VerifiedBadge size={18} style={styles.verifiedBadge} /> : null}
        </View>
        <Text style={styles.username}>@{user?.username}</Text>

        <NataScoreCard
          score={user?.nataScore ?? 0}
          onPress={() => navigation.navigate("ScoreHistory")}
        />
        <View style={{ height: 24 }} />

        <SettingsRow icon="👥" label="Freunde verwalten" onPress={() => navigation.navigate("Friends")} />
        <SettingsRow icon="🔒" label="Privatsphäre" onPress={() => navigation.navigate("Privacy")} />
        <SettingsRow
          icon="📄"
          label="Datenschutz & Nutzungsbedingungen"
          onPress={() => navigation.navigate("Legal")}
        />
        <SettingsRow
          icon="💬"
          label="Feedback geben"
          onPress={() => navigation.navigate("Feedback")}
          badge={<BetaBadge style={styles.feedbackBadge} />}
        />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Abmelden</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => navigation.navigate("DeleteAccount")}
        >
          <Text style={styles.deleteAccountText}>Konto löschen</Text>
        </TouchableOpacity>
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
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  closeButton: {
    position: "absolute",
    top: 56,
    left: 16,
    zIndex: 1,
  },
  closeText: {
    color: colors.text,
    fontSize: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarText: {
    color: "#000",
    fontSize: 36,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  displayName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  verifiedBadge: {
    marginTop: 2,
  },
  username: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 24,
  },
  feedbackBadge: {
    marginRight: 8,
  },
  logoutButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 15,
  },
  deleteAccountButton: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  deleteAccountText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
