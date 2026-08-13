import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// iOS-Gruppenlisten-Zeile: flach, keine eigene Karte/Schatten - wird
// innerhalb einer SettingsSection gerendert, die die durchgehende
// abgerundete Umrandung uebernimmt. isLast (von SettingsSection gesetzt)
// blendet die Trennlinie der letzten Zeile aus.
export default function SettingsRow({ icon, label, onPress, badge, tint = colors.primary, isLast }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      {badge}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceLight,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    fontWeight: "500",
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 19,
    marginLeft: spacing.xs,
  },
});
