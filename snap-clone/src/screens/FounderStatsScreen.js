import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { getAppStats } from "../services/adminService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const STAT_META = [
  { key: "userCount", label: "Nutzer:innen" },
  { key: "postCount", label: "Beiträge" },
  { key: "openTicketCount", label: "Offene Tickets" },
  { key: "reportCount", label: "Meldungen (gesamt)" },
  { key: "feedbackCount", label: "Feedback (gesamt)" },
  { key: "activeRestrictionCount", label: "Aktive Sperren" },
];

// Zahlen per getCountFromServer() (siehe adminService.js) - kein
// Herunterladen aller Dokumente, daher schnell und unabhaengig von der
// tatsaechlichen Datenmenge. Kein Live-Listener, da Aggregations-Queries
// das nicht unterstuetzen - stattdessen Pull-to-Refresh.
export default function FounderStatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const s = await getAppStats();
      setStats(s);
    } catch (e) {
      // Bleibt bei den zuletzt bekannten Werten (oder null), kein Absturz.
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Statistiken" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.grid}>
            {STAT_META.map((meta) => (
              <View key={meta.key} style={styles.card}>
                <Text style={styles.value}>{stats?.[meta.key] ?? "-"}</Text>
                <Text style={styles.label}>{meta.label}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footnote}>Zum Aktualisieren nach unten ziehen.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  card: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  value: {
    color: colors.primaryLight,
    fontSize: 28,
    fontWeight: "800",
  },
  label: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 4,
  },
  footnote: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
