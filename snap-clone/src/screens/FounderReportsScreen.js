import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { listenAllFeedback, listenAllReports } from "../services/adminService";
import { FEEDBACK_CATEGORIES } from "../services/feedbackService";
import { INCIDENT_TIMINGS, REPORT_REASONS } from "../services/moderationService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const TABS = [
  { id: "reports", label: "Meldungen" },
  { id: "feedback", label: "Feedback" },
];

export default function FounderReportsScreen({ navigation }) {
  const [tab, setTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const unsubscribe = listenAllReports(setReports);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = listenAllFeedback(setFeedback);
    return unsubscribe;
  }, []);

  const items = tab === "reports" ? reports : feedback;

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Meldungen & Feedback" />
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label} ({t.id === "reports" ? reports.length : feedback.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>
            {tab === "reports" ? "Keine Meldungen." : "Kein Feedback."}
          </Text>
        ) : tab === "reports" ? (
          reports.map((r) => {
            const reasonLabel = REPORT_REASONS.find((x) => x.id === r.reason)?.label || r.reason;
            const timingLabel = INCIDENT_TIMINGS.find((x) => x.id === r.incidentTiming)?.label;
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{reasonLabel}</Text>
                  <Text style={styles.cardTime}>
                    {r.createdAt?.toDate ? timeAgo(r.createdAt.toDate()) : ""}
                  </Text>
                </View>
                <Text style={styles.cardMeta}>
                  Zieltyp: {r.targetType || "-"}
                  {r.targetDisplayName ? ` · ${r.targetDisplayName}` : ""}
                  {timingLabel ? ` · ${timingLabel}` : ""}
                </Text>
                {r.description ? <Text style={styles.cardBody}>{r.description}</Text> : null}
              </View>
            );
          })
        ) : (
          feedback.map((f) => {
            const categoryLabel = FEEDBACK_CATEGORIES.find((x) => x.id === f.category)?.label || f.category;
            return (
              <View key={f.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{categoryLabel || "Feedback"}</Text>
                  <Text style={styles.cardTime}>
                    {f.createdAt?.toDate ? timeAgo(f.createdAt.toDate()) : ""}
                  </Text>
                </View>
                <Text style={styles.cardMeta}>{f.displayName || "Unbekannt"}</Text>
                <Text style={styles.cardBody}>{f.message}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    ...typography.subhead,
  },
  tabTextActive: {
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    ...typography.subhead,
  },
  cardTime: {
    color: colors.textMuted,
    ...typography.caption,
  },
  cardMeta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  cardBody: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
