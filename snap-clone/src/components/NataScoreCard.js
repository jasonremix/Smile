import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getLevelInfo } from "../utils/nataLevel";
import { colors } from "../theme/colors";

const WEEKLY_GOAL = 20;

// Score als Fortschritt darstellen statt als nackte Zahl - Level, Balken bis
// zum naechsten Level, Wochenziel. Bewusst immer auf die Aktion bezogen
// ("X Punkte gesammelt"), nie auf den Menschen ("du bist Level X wert").
export default function NataScoreCard({ score, weeklyPoints = 0, onPress }) {
  const { level, pointsToNext, progress } = getLevelInfo(score);
  const weeklyProgress = Math.max(0, Math.min(1, weeklyPoints / WEEKLY_GOAL));
  const weeklyGoalReached = weeklyPoints >= WEEKLY_GOAL;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Nata Score</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level {level}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {pointsToNext > 0 ? `Noch ${pointsToNext} Punkte bis Level ${level + 1}` : "Naechstes Level fast geschafft"}
      </Text>

      <View style={styles.divider} />

      <View style={styles.weeklyRow}>
        <Text style={styles.weeklyText}>
          {weeklyGoalReached
            ? "Wochenziel erreicht"
            : `Diese Woche ${weeklyPoints} von ${WEEKLY_GOAL} Punkten`}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            styles.progressFillMuted,
            { width: `${weeklyProgress * 100}%` },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },
  score: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
  },
  levelBadge: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  levelText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressFillMuted: {
    backgroundColor: colors.primaryLight,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  weeklyRow: {
    marginBottom: 8,
  },
  weeklyText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
