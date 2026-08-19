import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { computeRetentionCohorts, getAppStats } from "../services/adminService";
import { getRecentCallStats } from "../services/callService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const STAT_META = [
  { key: "userCount", label: "Nutzer:innen" },
  { key: "postCount", label: "Beiträge" },
  { key: "creatorCount", label: "Creator" },
  { key: "openTicketCount", label: "Offene Tickets" },
  { key: "reportCount", label: "Meldungen (gesamt)" },
  { key: "feedbackCount", label: "Feedback (gesamt)" },
  { key: "activeRestrictionCount", label: "Aktive Sperren" },
];

// Zahlen per getCountFromServer() (siehe adminService.js) - kein
// Herunterladen aller Dokumente, daher schnell und unabhaengig von der
// tatsaechlichen Datenmenge. Kein Live-Listener, da Aggregations-Queries
// das nicht unterstuetzen - stattdessen Pull-to-Refresh.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function FounderStatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [callStats, setCallStats] = useState(null);
  const [cohorts, setCohorts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const s = await getAppStats();
      setStats(s);
    } catch (e) {
      // Bleibt bei den zuletzt bekannten Werten (oder null), kein Absturz.
    }
    try {
      const c = await getRecentCallStats(new Date(Date.now() - SEVEN_DAYS_MS));
      setCallStats(c);
    } catch (e) {
      // Sprachanrufe (Beta) - Statistik ist ein Zusatz, kein Blocker.
    }
    try {
      const r = await computeRetentionCohorts();
      setCohorts(r);
    } catch (e) {
      // Kohorten-Analyse ist ein Zusatz, kein Blocker.
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

        {callStats ? (
          <>
            <Text style={styles.sectionLabel}>Anrufe (Beta) · letzte 7 Tage</Text>
            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.value}>{callStats.total}</Text>
                <Text style={styles.label}>Anrufe gesamt</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.value}>{callStats.completed}</Text>
                <Text style={styles.label}>Angenommen</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.value}>{callStats.missed}</Text>
                <Text style={styles.label}>Verpasst/abgelehnt</Text>
              </View>
            </View>
          </>
        ) : null}

        {cohorts && cohorts.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Kohorten-Rückkehrquote (nach Registrierungswoche)</Text>
            <Text style={styles.cohortNote}>
              Basiert nur auf Aktivität seit Einführung dieser Funktion - keine rückwirkenden Daten
              für Konten, die sich seitdem nicht erneut angemeldet haben.
            </Text>
            {cohorts.map((c) => (
              <View key={c.week.toISOString()} style={styles.cohortRow}>
                <Text style={styles.cohortWeek}>
                  {c.week.toLocaleDateString("de-DE")} · {c.total} neu
                </Text>
                <View style={styles.cohortPctRow}>
                  <Text style={styles.cohortPct}>Tag 1: {c.day1Pct}%</Text>
                  <Text style={styles.cohortPct}>Tag 7: {c.day7Pct}%</Text>
                  <Text style={styles.cohortPct}>Tag 30: {c.day30Pct}%</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

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
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
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
  cohortNote: {
    color: colors.textMuted,
    ...typography.caption,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  cohortRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cohortWeek: {
    color: colors.text,
    ...typography.subhead,
    marginBottom: 6,
  },
  cohortPctRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cohortPct: {
    color: colors.creator,
    fontSize: 12.5,
    fontWeight: "700",
  },
  footnote: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
