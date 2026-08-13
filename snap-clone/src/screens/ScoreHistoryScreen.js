import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import AchievementRow from "../components/AchievementRow";
import { useAuth } from "../context/AuthContext";
import { listenScoreEventsSince } from "../services/userService";
import { colors } from "../theme/colors";

const HISTORY_WINDOW_DAYS = 90;

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function ScoreHistoryScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const since = new Date(Date.now() - HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const unsubscribe = listenScoreEventsSince(user.uid, since, setEvents);
    return unsubscribe;
  }, [user.uid]);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<AchievementRow score={user?.nataScore ?? 0} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.reason}>{item.reason}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.amount}>+{item.amount}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Noch keine Punkte gesammelt. Sobald du Snaps sendest oder ansiehst, taucht das hier auf.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  reason: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
