import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import { listenUserPosts } from "../services/postService";
import { listenScoreEventsSince } from "../services/userService";
import { getWrappedTheme } from "../theme/wrappedThemes";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";

const SAMPLE_SIZE = 300;

// Nata Wrapped: einmal jaehrlich ab dem 25. September (siehe HomeScreen.js
// fuer den Ausloese-Check), aus echten, bereits vorhandenen Daten (Beitraege,
// Punkte-Historie) - keine erfundenen/geschaetzten Werte, dieselbe Ehrlichkeits-
// Regel wie bei MyStatsScreen. Jedes Jahr ein anderer, fest kuratierter Stil
// (siehe theme/wrappedThemes.js), damit es sich wirklich wie ein neues,
// einmaliges Ereignis anfuehlt statt einer Wiederholung.
export default function WrappedScreen({ navigation }) {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const theme = getWrappedTheme(year);
  const [posts, setPosts] = useState([]);
  const [scoreEvents, setScoreEvents] = useState([]);

  const startOfYear = useMemo(() => new Date(year, 0, 1), [year]);

  useEffect(() => {
    const unsubscribe = listenUserPosts(user.uid, setPosts, SAMPLE_SIZE);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenScoreEventsSince(user.uid, startOfYear, setScoreEvents);
    return unsubscribe;
  }, [user.uid, startOfYear]);

  const postsThisYear = useMemo(
    () => posts.filter((p) => (p.createdAt?.toDate?.() || new Date(0)) >= startOfYear),
    [posts, startOfYear]
  );
  const totalReactions = useMemo(
    () => postsThisYear.reduce((sum, p) => sum + (p.likeCount || 0), 0),
    [postsThisYear]
  );
  const totalComments = useMemo(
    () => postsThisYear.reduce((sum, p) => sum + (p.commentCount || 0), 0),
    [postsThisYear]
  );
  const topPost = useMemo(
    () =>
      postsThisYear.reduce((best, p) => ((p.likeCount || 0) > (best?.likeCount || 0) ? p : best), null),
    [postsThisYear]
  );
  const totalPoints = useMemo(
    () => scoreEvents.reduce((sum, e) => sum + (e.amount || 0), 0),
    [scoreEvents]
  );

  const handleFinish = () => {
    updateDoc(doc(db, "users", user.uid), { wrappedSeenYear: year }).catch(() => {});
    navigation.goBack();
  };

  const handleShare = () => {
    Share.share({
      message: `Mein Nata Wrapped ${year}: ${postsThisYear.length} Beiträge, ${totalReactions} Reaktionen, ${totalPoints} Punkte gesammelt. 🎉`,
    }).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeButton} onPress={handleFinish}>
          <Icon name="close" size={16} color={theme.heading} />
        </TouchableOpacity>

        <Text style={[styles.eyebrow, { color: theme.accent }]}>NATA WRAPPED</Text>
        <Text style={[styles.title, { color: theme.heading }]}>Dein Jahr {year}</Text>
        <Text style={[styles.subtitle, { color: theme.heading }]}>
          {user.displayName} · Stil „{theme.name}"
        </Text>

        <View style={[styles.statCard, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[styles.statValue, { color: theme.heading }]}>{postsThisYear.length}</Text>
          <Text style={[styles.statLabel, { color: theme.accent }]}>Beiträge geteilt</Text>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCardSmall, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <Text style={[styles.statValueSmall, { color: theme.heading }]}>{totalReactions}</Text>
            <Text style={[styles.statLabelSmall, { color: theme.accent }]}>Reaktionen</Text>
          </View>
          <View style={[styles.statCardSmall, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <Text style={[styles.statValueSmall, { color: theme.heading }]}>{totalComments}</Text>
            <Text style={[styles.statLabelSmall, { color: theme.accent }]}>Kommentare</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[styles.statValue, { color: theme.heading }]}>{totalPoints}</Text>
          <Text style={[styles.statLabel, { color: theme.accent }]}>Nata-Punkte gesammelt</Text>
        </View>

        {topPost?.text ? (
          <View style={[styles.quoteCard, { borderColor: theme.accent }]}>
            <Text style={[styles.quoteLabel, { color: theme.accent }]}>Dein meistbeachteter Beitrag</Text>
            <Text style={[styles.quoteText, { color: theme.heading }]} numberOfLines={5}>
              „{topPost.text}"
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.accent }]}
          onPress={handleShare}
        >
          <Icon name="send" size={15} color={theme.bg} />
          <Text style={[styles.shareButtonText, { color: theme.bg }]}>Teilen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={[styles.finishButtonText, { color: theme.heading }]}>Fertig</Text>
        </TouchableOpacity>

        <Text style={[styles.footnote, { color: theme.accent }]}>
          Berechnet aus deinen letzten {SAMPLE_SIZE} Beiträgen und deiner Punkte-Historie seit dem 1.
          Januar {year} - keine geschätzten Werte.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
    paddingBottom: spacing.xxxl,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: spacing.xl,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: 40,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    marginBottom: spacing.md,
  },
  statCardSmall: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: "900",
  },
  statLabelSmall: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  quoteCard: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  quoteLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 22,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  shareButtonText: {
    fontWeight: "800",
    fontSize: 15,
  },
  finishButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  finishButtonText: {
    fontWeight: "700",
    fontSize: 14,
    opacity: 0.8,
  },
  footnote: {
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.xl,
    lineHeight: 15,
    opacity: 0.7,
  },
});
