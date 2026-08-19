import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import CreatorBadge from "../components/CreatorBadge";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenUserPosts } from "../services/postService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Alles hier wird ausschliesslich aus echten, bereits vorhandenen
// Post-Daten berechnet (Beitraege, Reaktionen, Kommentare) - keine
// erfundenen oder simulierten Werte. Eine echte Inhalts-Planung/
// Terminierung braucht serverseitige, geplante Ausfuehrung (Cloud
// Functions) - dafuer fehlt aktuell die Infrastruktur (siehe Roadmap),
// deshalb ist das bewusst nicht Teil dieses Screens.
const RECENT_POSTS_SAMPLE = 100;

export default function CreatorStudioScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = listenUserPosts(user.uid, setPosts, RECENT_POSTS_SAMPLE);
    return unsubscribe;
  }, [user.uid]);

  const totalLikes = useMemo(() => posts.reduce((sum, p) => sum + (p.likeCount || 0), 0), [posts]);
  const totalComments = useMemo(
    () => posts.reduce((sum, p) => sum + (p.commentCount || 0), 0),
    [posts]
  );
  const avgEngagement = useMemo(() => {
    if (posts.length === 0) return 0;
    return Math.round(((totalLikes + totalComments) / posts.length) * 10) / 10;
  }, [posts, totalLikes, totalComments]);
  const topPost = useMemo(
    () =>
      posts.reduce((best, p) => {
        const score = (p.likeCount || 0) + (p.commentCount || 0);
        const bestScore = best ? (best.likeCount || 0) + (best.commentCount || 0) : -1;
        return score > bestScore ? p : best;
      }, null),
    [posts]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Creator-Studio" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <CreatorBadge size={32} />
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusTitle}>Du bist Creator</Text>
            <Text style={styles.statusSubtitle}>
              Dein Abzeichen ist auf deinem Profil sichtbar.
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <StatCard icon="grid" value={`${posts.length}`} label="Beiträge" />
          <StatCard icon="heart" value={`${totalLikes}`} label="Reaktionen insgesamt" />
          <StatCard icon="chat" value={`${totalComments}`} label="Kommentare insgesamt" />
          <StatCard icon="star" value={`${avgEngagement}`} label="Ø Interaktionen / Beitrag" />
        </View>

        {topPost?.text ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dein meistbeachteter Beitrag</Text>
            <Text style={styles.quoteText} numberOfLines={4}>
              „{topPost.text}"
            </Text>
            <Text style={styles.quoteMeta}>
              {topPost.likeCount || 0} Reaktionen · {topPost.commentCount || 0} Kommentare
            </Text>
          </View>
        ) : null}

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="grid" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Sobald du Beiträge postest, siehst du hier echte Statistiken dazu.
            </Text>
          </View>
        ) : null}

        <Text style={styles.footnote}>
          Berechnet aus deinen letzten {RECENT_POSTS_SAMPLE} Beiträgen. Es gibt (noch) keine
          Inhalts-Planung/Terminierung - das braucht eine serverseitige Infrastruktur, die aktuell
          nicht verfügbar ist.
        </Text>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={18} color={colors.creator} />
      <Text style={styles.statValue}>{value}</Text>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.creatorSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusTitle: {
    color: colors.text,
    ...typography.subhead,
  },
  statusSubtitle: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
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
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: spacing.sm,
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
  quoteText: {
    color: colors.text,
    ...typography.body,
    fontStyle: "italic",
    lineHeight: 21,
  },
  quoteMeta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: 30,
    lineHeight: 19,
  },
  footnote: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
