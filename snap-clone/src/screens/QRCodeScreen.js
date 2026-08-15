import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import QRCodeView from "../components/QRCodeView";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Drei Kontexte statt einer einzigen Nachricht - der native Share-Sheet
// deckt WhatsApp/Instagram/Messages/etc. ohnehin ab, hier geht es nur um den
// passenden Ton je nach Situation (spontan vor Ort vs. online vs. als
// "Visitenkarte" mit etwas mehr Kontext ueber die Person).
const SHARE_OPTIONS = [
  {
    id: "quick",
    icon: "send",
    title: "Schnell teilen",
    subtitle: "Kurzer Link zum Verbinden",
    buildMessage: (user) => `Verbinde dich mit mir auf Nata: @${user?.username} 💜`,
  },
  {
    id: "meetup",
    icon: "pin",
    title: "Für unterwegs",
    subtitle: "Wenn ihr euch gerade trefft",
    buildMessage: (user) =>
      `Schön, dich kennenzulernen! Verbinde dich mit mir auf Nata, dann bleiben wir in Kontakt: @${user?.username}`,
  },
  {
    id: "card",
    icon: "person",
    title: "Digitale Visitenkarte",
    subtitle: "Mit etwas mehr Kontext",
    buildMessage: (user) =>
      `${user?.displayName} (@${user?.username}) auf Nata${user?.bio ? ` - "${user.bio}"` : ""}. Verbinde dich, um in Kontakt zu bleiben.`,
  },
];

export default function QRCodeScreen({ navigation }) {
  const { user } = useAuth();
  const qrValue = `nata:user:${user.uid}`;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShareOption = (option) => {
    setShareMenuOpen(false);
    Share.share({ message: option.buildMessage(user) }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: "center", width: "100%" }}>
        <Text style={styles.eyebrow}>DEIN NATA CODE</Text>
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("ScanQR")}
            accessibilityRole="button"
            accessibilityLabel="Code scannen"
          >
            <Icon name="camera" size={16} color={colors.text} style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Scannen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShareMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Nata-Code teilen"
          >
            <Icon name="send" size={15} color={colors.text} style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Teilen</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={shareMenuOpen} transparent animationType="fade" onRequestClose={() => setShareMenuOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShareMenuOpen(false)}>
          <View style={styles.shareSheet}>
            <Text style={styles.shareSheetTitle}>Nata Code teilen</Text>
            {SHARE_OPTIONS.map((option) => (
              <TouchableOpacity key={option.id} style={styles.shareOptionRow} onPress={() => handleShareOption(option)}>
                <View style={styles.shareOptionIcon}>
                  <Icon name={option.icon} size={17} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shareOptionTitle}>{option.title}</Text>
                  <Text style={styles.shareOptionSubtitle}>{option.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.shareCancelButton} onPress={() => setShareMenuOpen(false)}>
              <Text style={styles.shareCancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  eyebrow: {
    color: colors.primaryLight,
    ...typography.sectionLabel,
    letterSpacing: 1.2,
    marginBottom: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  shareSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  shareSheetTitle: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.md,
  },
  shareOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  shareOptionTitle: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "700",
  },
  shareOptionSubtitle: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  shareCancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
  },
  shareCancelText: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "700",
  },
});
