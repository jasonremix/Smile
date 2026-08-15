import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { updateProfileFields } from "../services/userService";
import { hapticSelection } from "../utils/haptics";
import { GOAL_OPTIONS } from "../utils/goals";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Zweiter Personalisierungs-Schritt (siehe PersonalizeInterestsScreen.js) -
// rein informativ gespeichert, kein hartes Feed-Ranking-Signal (dafuer
// braeuchte es echte Nutzungsdaten statt einer einmaligen Selbstauskunft).
export default function PersonalizeGoalsScreen({ onDone }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(() => new Set(user?.goals || []));
  const [saving, setSaving] = useState(false);

  const toggle = (id) => {
    hapticSelection();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfileFields(user.uid, { goals: [...selected] });
    } catch (e) {
      // Wie bei den Interessen: netter Zusatz, kein Blocker.
    } finally {
      setSaving(false);
      onDone();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.title}>Was möchtest du auf Nata?</Text>
      <Text style={styles.subtitle}>Mehrfachauswahl möglich - hilft uns, dir Relevantes zu zeigen.</Text>

      <View style={styles.list}>
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => toggle(option.id)}
            >
              <Text style={styles.rowEmoji}>{option.emoji}</Text>
              <Text style={styles.rowLabel}>{option.label}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected ? <Icon name="check" size={11} color={colors.text} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PrimaryButton title="NATA entdecken" onPress={handleContinue} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
  },
  title: {
    color: colors.text,
    ...typography.title,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.body,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  rowEmoji: {
    fontSize: 18,
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    fontWeight: "600",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    marginTop: "auto",
  },
});
