import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Wie SettingsRow, aber mit einem Switch statt Chevron/Navigation - fuer
// lokale An/Aus-Einstellungen ohne eigenen Folge-Screen.
export default function SettingsToggleRow({ icon, label, value, onValueChange, tint = colors.primary, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <View style={[styles.iconCircle, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceLight, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
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
});
