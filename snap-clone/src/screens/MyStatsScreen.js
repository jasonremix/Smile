import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenChats } from "../services/chatService";
import { listenUserPosts } from "../services/postService";
import { listenScoreEventsSince } from "../services/userService";
import { generateYearRecapPdf } from "../utils/yearRecapPdf";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Alles hier wird ausschliesslich aus echten, bereits vorhandenen Daten
// berechnet (Streaks, Beitraege, Punkte-Historie) - keine erfundenen oder
// geschaetzten Werte.
const STATS_HISTORY_START = new Date(2024, 0, 1);
const RECENT_POSTS_SAMPLE = 100;

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(monday) {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
  return `${fmt(monday)} - ${fmt(end)}`;
}

export default function MyStatsScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [scoreEvents, setScoreEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = listenChats(user.uid, setChats);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenUserPosts(user.uid, setPosts, RECENT_POSTS_SAMPLE);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenScoreEventsSince(user.uid, STATS_HISTORY_START, setScoreEvents);
    return unsubscribe;
  }, [user.uid]);

  const longestStreak = useMemo(
    () => chats.reduce((max, c) => Math.max(max, c.streakCount || 0), 0),
    [chats]
  );

  const mostReactedPost = useMemo(
    () => posts.reduce((best, p) => ((p.likeCount || 0) > (best?.likeCount || 0) ? p : best), null),
    [posts]
  );

  const totalReactionsReceived = useMemo(
    () => posts.reduce((sum, p) => sum + (p.likeCount || 0), 0),
    [posts]
  );

  const bestWeek = useMemo(() => {
    const sums = {};
    scoreEvents.forEach((e) => {
      const date = e.createdAt?.toDate ? e.createdAt.toDate() : null;
      if (!date) return;
      const key = mondayOf(date).toISOString();
      sums[key] = (sums[key] || 0) + (e.amount || 0);
    });
    let bestKey = null;
    let bestSum = 0;
    Object.entries(sums).forEach(([key, sum]) => {
      if (sum > bestSum) {
        bestSum = sum;
        bestKey = key;
      }
    });
    return bestKey ? { monday: new Date(bestKey), points: bestSum } : null;
  }, [scoreEvents]);

  const totalPoints = useMemo(
    () => scoreEvents.reduce((sum, e) => sum + (e.amount || 0), 0),
    [scoreEvents]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Meine Statistik" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Ein Überblick über deine Aktivität auf Nata - berechnet aus deinen echten Daten.
        </Text>

        <View style={styles.grid}>
          <StatCard
            icon="flame"
            value={longestStreak > 0 ? `${longestStreak}` : "–"}
            unit={longestStreak > 0 ? "Tage" : ""}
            label="Längster aktiver Streak"
          />
          <StatCard
            icon="heart"
            value={mostReactedPost ? `${mostReactedPost.likeCount || 0}` : "–"}
            unit="Reaktionen"
            label="Bester einzelner Beitrag"
          />
          <StatCard
            icon="star"
            value={bestWeek ? `${bestWeek.points}` : "–"}
            unit="Punkte"
            label={bestWeek ? `Beste Woche (${formatWeekLabel(bestWeek.monday)})` : "Aktivste Woche"}
          />
          <StatCard
            icon="grid"
            value={`${totalPoints}`}
            unit="Punkte"
            label="Punkte-Historie insgesamt"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reaktionen auf deine letzten {posts.length} Beiträge</Text>
          <Text style={styles.cardBig}>{totalReactionsReceived}</Text>
        </View>

        {mostReactedPost?.text ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dein meistbeachteter Beitrag</Text>
            <Text style={styles.quoteText} numberOfLines={4}>
              „{mostReactedPost.text}"
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.recapButton} onPress={() => generateYearRecapPdf(user)}>
          <Icon name="sparkle" size={16} color={colors.primaryLight} />
          <Text style={styles.recapButtonText}>Jahresrückblick {new Date().getFullYear()} als PDF teilen</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Punkte-Historie berücksichtigt bis zu 20 gespeicherte Ereignisse pro Woche · Beiträge:
          letzte {RECENT_POSTS_SAMPLE}.
        </Text>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, unit, label }) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={18} color={colors.primaryLight} />
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 19,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  statUnit: {
    color: colors.textMuted,
    ...typography.caption,
  },
  statLabel: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 4,
    lineHeight: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.textMuted,
    ...typography.footnote,
    marginBottom: spacing.sm,
  },
  cardBig: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  quoteText: {
    color: colors.text,
    ...typography.body,
    fontStyle: "italic",
    lineHeight: 21,
  },
  footnote: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  recapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.35)",
  },
  recapButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
});
