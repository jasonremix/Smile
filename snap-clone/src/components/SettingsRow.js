import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// iOS-Gruppenlisten-Zeile: flach, keine eigene Karte/Schatten - wird
// innerhalb einer SettingsSection gerendert, die die durchgehende
// abgerundete Umrandung uebernimmt. isLast (von SettingsSection gesetzt)
// blendet die Trennlinie der letzten Zeile aus.
//
// Schlichtes einfarbiges Icon statt farbigem Kreis dahinter (vorheriger
// Stil) - naeher an den durchgehend grauen/schwarzen Zeilen-Icons echter
// Einstellungen-Bildschirme. "tint" bleibt fuer bewusst rote Zeilen
// (Konto loeschen, Abmelden) erhalten, faerbt jetzt aber direkt das Icon.
export default function SettingsRow({ icon, label, onPress, badge, tint, isLast }) {
  const iconColor = tint || colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
    >
      <Icon name={icon} size={19} color={iconColor} style={styles.icon} />
      <Text style={[styles.label, tint && { color: tint }]}>{label}</Text>
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
  chevron: {
    color: colors.textMuted,
    fontSize: 19,
    marginLeft: spacing.xs,
  },
});
