import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

      <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
        <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.displayName}>{user?.displayName}</Text>
      <Text style={styles.username}>@{user?.username}</Text>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Snap-Score</Text>
        <Text style={styles.scoreValue}>{user?.snapScore ?? 0}</Text>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("Friends")}
      >
        <Text style={styles.actionButtonText}>👥 Freunde verwalten</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Abmelden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: "absolute",
    top: 56,
    left: 16,
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
  },
  avatarText: {
    color: "#000",
    fontSize: 36,
    fontWeight: "800",
  },
  displayName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  username: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  scoreValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: "800",
  },
  actionButton: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 15,
  },
  logoutButton: {
    marginTop: "auto",
    marginBottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 15,
  },
});
