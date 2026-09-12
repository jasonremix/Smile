import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Wie SettingsRow, aber mit einem Switch statt Chevron/Navigation - fuer
// lokale An/Aus-Einstellungen ohne eigenen Folge-Screen. Schlichtes
// einfarbiges Icon statt farbigem Kreis, passend zu SettingsRow.
export default function SettingsToggleRow({ icon, label, value, onValueChange, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <Icon name={icon} size={19} color={colors.textMuted} style={styles.icon} />
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
  icon: {
    marginRight: spacing.md,
    width: 22,
  },
  label: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    fontWeight: "500",
  },
});
