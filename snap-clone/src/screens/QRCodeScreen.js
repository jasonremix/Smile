import React, { useEffect, useRef } from "react";
import { Animated, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import QRCodeView from "../components/QRCodeView";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function QRCodeScreen({ navigation }) {
  const { user } = useAuth();
  const qrValue = `nata:user:${user.uid}`;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShare = () => {
    Share.share({
      message: `Verbinde dich mit mir auf Nata: @${user?.username}`,
    }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: "center", width: "100%" }}>
        <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          {user?.verified ? <VerifiedBadge size={16} /> : null}
        </View>
        <Text style={styles.username}>@{user?.username}</Text>

        <View style={styles.qrWrapper}>
          <QRCodeView value={qrValue} size={220} />
        </View>
        <Text style={styles.hint}>Andere können diesen Code scannen, um sich direkt mit dir zu verbinden.</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("ScanQR")}>
            <Icon name="camera" size={16} color={colors.text} style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Scannen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Icon name="send" size={15} color={colors.text} style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Teilen</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    color: "#000",
    fontSize: 26,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  displayName: {
    color: colors.text,
    ...typography.title,
  },
  username: {
    color: colors.textMuted,
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  qrWrapper: {
    marginBottom: spacing.xl,
    ...shadow.md,
  },
  hint: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md + 2,
  },
  actionIcon: {
    marginRight: spacing.sm,
  },
  actionButtonText: {
    color: colors.text,
    ...typography.subhead,
  },
});
