import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";
import { getLevelIcon, getLevelInfo } from "../utils/nataLevel";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const WEEKLY_GOAL = 20;

// Score als Fortschritt darstellen statt als nackte Zahl - Level, Balken bis
// zum naechsten Level, Wochenziel. Bewusst immer auf die Aktion bezogen
// ("X Punkte gesammelt"), nie auf den Menschen ("du bist Level X wert").
export default function NataScoreCard({ score, weeklyPoints = 0, onPress }) {
  const [infoVisible, setInfoVisible] = useState(false);
  const { level, pointsToNext, progress } = getLevelInfo(score);
  const weeklyProgress = Math.max(0, Math.min(1, weeklyPoints / WEEKLY_GOAL));
  const weeklyGoalReached = weeklyPoints >= WEEKLY_GOAL;

  return (
    <>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.topRow}>
          <View style={styles.levelIconCircle}>
            <Icon name={getLevelIcon(level)} size={20} color={colors.primary} />
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.label}>Nata Score · Level {level}</Text>
            <Text style={styles.score}>{score}</Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setInfoVisible(true)}
            hitSlop={8}
          >
            <Icon name="info" size={18} color={colors.textMuted} />
          </TouchableOpacity>
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

      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setInfoVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dein Nata Score</Text>
            <Text style={styles.modalText}>
              Dein Score wächst durch echte Aktivität in deiner Community: neue Connections,
              hilfreiche Nachrichten, Beiträge und positives Verhalten.
            </Text>
            <Text style={styles.modalText}>
              Es geht um Qualität, nicht Quantität - Nata belohnt keine Massen-Aktionen.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setInfoVisible(false)}>
              <Text style={styles.modalButtonText}>Verstanden</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  pressed: {
    backgroundColor: colors.surfaceLight,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  levelIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: `${colors.primary}22`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  scoreBlock: {
    flex: 1,
  },
  infoButton: {
    padding: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    ...typography.footnote,
    marginBottom: 2,
  },
  score: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLight,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressFillMuted: {
    backgroundColor: colors.primaryLight,
  },
  progressLabel: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  weeklyRow: {
    marginBottom: spacing.sm,
  },
  weeklyText: {
    color: colors.text,
    ...typography.footnote,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
  },
  modalTitle: {
    color: colors.text,
    ...typography.title,
    marginBottom: spacing.md,
  },
  modalText: {
    color: colors.textMuted,
    ...typography.body,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  modalButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  modalButtonText: {
    color: colors.text,
    ...typography.subhead,
  },
});
