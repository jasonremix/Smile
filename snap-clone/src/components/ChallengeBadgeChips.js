import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

function prettify(tag) {
  return tag.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Teilnahme-Abzeichen an Challenges (siehe challengeService.js
// awardChallengeBadge) - der Tag selbst ist bereits ein lesbarer Slug,
// deshalb kein zusaetzlicher Read pro Badge fuer den vollen Titel noetig.
export default function ChallengeBadgeChips({ badges, style }) {
  if (!badges || badges.length === 0) return null;
  return (
    <View style={[styles.wrap, style]}>
      {badges.map((tag) => (
        <View key={tag} style={styles.chip}>
          <Icon name="flame" size={11} color={colors.creator} />
          <Text style={styles.chipText}>{prettify(tag)}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.creatorSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.creator,
    fontSize: 12,
    fontWeight: "700",
  },
});
