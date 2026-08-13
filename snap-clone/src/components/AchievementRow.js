import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";
import { getAchievementsProgress } from "../utils/nataLevel";
import { colors } from "../theme/colors";

export default function AchievementRow({ score }) {
  const achievements = getAchievementsProgress(score);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Erfolge</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {achievements.map((a) => (
          <View key={a.id} style={[styles.badge, !a.unlocked && styles.badgeLocked]}>
            <Icon name={a.icon} size={22} color={a.unlocked ? colors.primaryLight : colors.textMuted} style={styles.icon} />
            <Text style={[styles.badgeTitle, !a.unlocked && styles.textLocked]}>{a.title}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  row: {
    gap: 10,
    paddingRight: 8,
  },
  badge: {
    width: 84,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  icon: {
    marginBottom: 6,
  },
  badgeTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  textLocked: {
    color: colors.textMuted,
  },
});
