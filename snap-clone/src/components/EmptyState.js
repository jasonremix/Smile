import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Wiederverwendbarer Leerzustand mit dem Nata-Maskottchen statt generischer
// Icons - taucht ueberall dort auf, wo eine Liste (noch) nichts zu zeigen
// hat, damit auch diese Momente nach der Marke aussehen statt neutral zu wirken.
export default function EmptyState({ title, text, actionLabel, onAction, style }) {
  return (
    <View style={[styles.container, style]}>
      <Image source={require("../../assets/icon.png")} style={styles.mark} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  mark: {
    width: 52,
    height: 52,
    opacity: 0.32,
    marginBottom: spacing.md,
    borderRadius: 14,
  },
  title: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "700",
    textAlign: "center",
  },
  text: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  action: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  actionText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },
});
