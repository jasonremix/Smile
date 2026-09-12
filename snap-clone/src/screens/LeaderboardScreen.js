import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import CreatorBadge from "../components/CreatorBadge";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { getWeeklyLeaderboard } from "../services/leaderboardService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    getWeeklyLeaderboard(friends, user)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [friends.length, user.nataScore]);

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Leaderboard" />
      {entries === null ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.intro}>
            Punkte-Zuwachs deiner Connections seit dem letzten Schnappschuss (aktualisiert sich alle
            paar Tage automatisch beim Öffnen der App).
          </Text>

          {entries.length <= 1 ? (
            <View style={styles.emptyState}>
              <Icon name="star" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                Füge Connections hinzu, um dich mit ihnen zu vergleichen.
              </Text>
            </View>
          ) : (
            entries.map((e, i) => (
              <View key={e.uid} style={[styles.row, e.isMe && styles.rowMine]}>
                <Text style={styles.rank}>{MEDALS[i] || `${i + 1}.`}</Text>
                <View style={[styles.avatar, { backgroundColor: e.avatarColor || colors.primary }]}>
                  <Text style={styles.avatarText}>{(e.displayName || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.nameBlock}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {e.isMe ? "Du" : e.displayName}
                    </Text>
                    {e.verified ? <VerifiedBadge size={13} /> : null}
                    {e.isCreator ? <CreatorBadge size={13} /> : null}
                  </View>
                </View>
                <Text style={styles.delta}>+{e.weeklyDelta}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 19,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyState: { alignItems: "center", paddingVertical: spacing.xxxl },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowMine: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  rank: {
    width: 32,
    textAlign: "center",
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "800",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  avatarText: { color: "#000", fontWeight: "800", fontSize: 13 },
  nameBlock: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: colors.text, ...typography.subhead, flexShrink: 1 },
  delta: { color: colors.online, fontWeight: "800", fontSize: 15 },
});
