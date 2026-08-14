import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getInterestById } from "../utils/interests";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

// Rein informative Anzeige der selbst gewaehlten Interessen (siehe
// EditProfileScreen) - unbekannte/veraltete IDs werden stillschweigend
// uebersprungen statt einen leeren Chip zu zeigen.
export default function InterestChips({ interests, style }) {
  if (!interests || interests.length === 0) return null;
  const resolved = interests.map(getInterestById).filter(Boolean);
  if (resolved.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      {resolved.map((interest) => (
        <View key={interest.id} style={styles.chip}>
          <Text style={styles.chipText}>
            {interest.emoji} {interest.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
});
