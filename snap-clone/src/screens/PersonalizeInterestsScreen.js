import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { updateProfileFields } from "../services/userService";
import { hapticSelection } from "../utils/haptics";
import { INTEREST_OPTIONS, MAX_INTERESTS, MIN_INTERESTS_ONBOARDING } from "../utils/interests";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Erster Personalisierungs-Schritt direkt nach dem Onboarding (siehe
// RootNavigator.js) - beeinflusst spaeter Nata Match/Discover. Bewusst kein
// "Überspringen": eine Auswahl aus vorhandenen Chips kostet nur ein paar
// Sekunden und macht den ersten Home-Start sofort persoenlicher.
export default function PersonalizeInterestsScreen({ onDone }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(() => new Set(user?.interests || []));
  const [saving, setSaving] = useState(false);

  const toggle = (id) => {
    hapticSelection();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_INTERESTS) {
        next.add(id);
      }
      return next;
    });
  };

  const canContinue = selected.size >= MIN_INTERESTS_ONBOARDING;

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    try {
      await updateProfileFields(user.uid, { interests: [...selected] });
    } catch (e) {
      // Personalisierung ist ein netter Zusatz, kein Blocker - bei einem
      // Fehler trotzdem weiter in die App lassen, statt jemanden hier
      // festzuhalten.
    } finally {
      setSaving(false);
      onDone();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.title}>Was interessiert dich?</Text>
      <Text style={styles.subtitle}>
        Wähle mindestens {MIN_INTERESTS_ONBOARDING} Interessen - hilft dir bei Nata Match und beim Entdecken.
      </Text>

      <View style={styles.chipWrap}>
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(option.id)}
            >
              <Text style={styles.chipEmoji}>{option.emoji}</Text>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.counter}>
          {selected.size}/{MAX_INTERESTS} ausgewählt
        </Text>
        <PrimaryButton title="Weiter" onPress={handleContinue} disabled={!canContinue} loading={saving} />
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
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  chipLabelSelected: {
    color: colors.text,
  },
  footer: {
    marginTop: "auto",
  },
  counter: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
