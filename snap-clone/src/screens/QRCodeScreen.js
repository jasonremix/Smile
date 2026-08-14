import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import QRCodeView from "../components/QRCodeView";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { shadow } from "../theme/shadow";

export default function QRCodeScreen({ navigation }) {
  const { user } = useAuth();
  const qrValue = `nata:user:${user.uid}`;

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
        <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.nameRow}>
        <Text style={styles.displayName}>{user?.displayName}</Text>
        {user?.verified ? <VerifiedBadge size={16} /> : null}
      </View>
      <Text style={styles.username}>@{user?.username}</Text>

      <View style={styles.qrWrapper}>
        <QRCodeView value={qrValue} size={230} />
      </View>
      <Text style={styles.hint}>Andere koennen diesen Code scannen, um sich direkt mit dir zu verbinden.</Text>

      <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate("ScanQR")}>
        <Icon name="camera" size={16} color={colors.text} style={styles.scanIcon} />
        <Text style={styles.scanButtonText}>Code scannen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#000",
    fontSize: 26,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  displayName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  username: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 32,
  },
  qrWrapper: {
    marginBottom: 20,
    ...shadow.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
});
