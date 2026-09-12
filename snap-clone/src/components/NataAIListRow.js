import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GradientView from "./GradientView";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

// Eigene, auffaelligere Zeile statt der generischen ChatListItem-Komponente
// (nur Farbkreis + Initiale) - der Gruender wollte den KI-Assistenten
// "viel sichtbarer und schoener". Verlaufs-Avatar mit Funken-Icon statt
// Buchstabe, dezenter Glow-Rahmen um die ganze Zeile.
export default function NataAIListRow({ onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.avatar}>
        <Icon name="sparkle" size={20} color={colors.onPrimary} />
      </GradientView>
      <View style={styles.textContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>Nata AI</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>KI</Text>
          </View>
        </View>
        <Text style={styles.preview}>Frag mich einfach etwas</Text>
      </View>
      <Icon name="back" size={14} color={colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.35)",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "rgba(147, 51, 234, 0.25)",
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  badgeText: {
    color: colors.primaryLight,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  preview: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    transform: [{ rotate: "180deg" }],
    marginLeft: spacing.xs,
  },
});
