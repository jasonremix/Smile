import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { FEATURE_FLAG_KEYS, listenFeatureFlags, setFeatureFlag } from "../services/adminService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function FounderFeatureFlagsScreen({ navigation }) {
  const [flags, setFlags] = useState({});

  useEffect(() => {
    const unsubscribe = listenFeatureFlags(setFlags);
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Feature-Schalter" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Rein clientseitig ausgewertet (kein Server-Rollout) - steuert noch nicht die Sichtbarkeit
          jeder einzelnen Stelle in der App, dient aktuell als zentraler Statusüberblick für neue
          Beta-Features.
        </Text>
        {FEATURE_FLAG_KEYS.map((f) => {
          const enabled = flags[f.id] !== false;
          return (
            <View key={f.id} style={styles.row}>
              <Text style={styles.rowLabel}>{f.label}</Text>
              <Switch
                value={enabled}
                onValueChange={(v) => setFeatureFlag(f.id, v)}
                trackColor={{ false: colors.surfaceLight, true: colors.creator }}
                thumbColor={colors.text}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 19,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLabel: {
    color: colors.text,
    ...typography.subhead,
  },
});
