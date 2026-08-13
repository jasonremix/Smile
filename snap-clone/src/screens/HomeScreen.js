import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AchievementRow from "../components/AchievementRow";
import NataScoreCard from "../components/NataScoreCard";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { listenIncomingRequests } from "../services/friendService";
import { listenScoreEventsSince } from "../services/userService";
import { colors } from "../theme/colors";

function startOfWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sonntag
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { unreadCount } = useUnreadChats();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [weeklyEvents, setWeeklyEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = listenIncomingRequests(user.uid, setIncomingRequests);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenScoreEventsSince(user.uid, startOfWeek(), setWeeklyEvents);
    return unsubscribe;
  }, [user.uid]);

  const weeklyPoints = useMemo(
    () => weeklyEvents.reduce((sum, e) => sum + (e.amount || 0), 0),
    [weeklyEvents]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingTextBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.greeting}>Hey, {user?.displayName || "du"} 👻</Text>
            {user?.verified ? <VerifiedBadge size={16} /> : null}
          </View>
          <Text style={styles.subGreeting}>Schoen, dass du da bist.</Text>
        </View>
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <NataScoreCard
        score={user?.nataScore ?? 0}
        weeklyPoints={weeklyPoints}
        onPress={() => navigation.navigate("ScoreHistory")}
      />

      <AchievementRow score={user?.nataScore ?? 0} />

      {incomingRequests.length > 0 ? (
        <TouchableOpacity style={styles.highlightCard} onPress={() => navigation.navigate("Friends")}>
          <Text style={styles.highlightIcon}>👥</Text>
          <View style={styles.highlightTextBlock}>
            <Text style={styles.highlightTitle}>
              {incomingRequests.length === 1
                ? "1 neue Freundschaftsanfrage"
                : `${incomingRequests.length} neue Freundschaftsanfragen`}
            </Text>
            <Text style={styles.highlightSubtitle}>Antippen zum Ansehen</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {unreadCount > 0 ? (
        <TouchableOpacity style={styles.highlightCard} onPress={() => navigation.navigate("Chats")}>
          <Text style={styles.highlightIcon}>💬</Text>
          <View style={styles.highlightTextBlock}>
            <Text style={styles.highlightTitle}>
              {unreadCount === 1 ? "1 ungelesener Chat" : `${unreadCount} ungelesene Chats`}
            </Text>
            <Text style={styles.highlightSubtitle}>Antippen zum Ansehen</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("AddFriends")}>
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Freunde{"\n"}hinzufuegen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("Camera")}>
          <Text style={styles.quickActionIcon}>⭐️</Text>
          <Text style={styles.quickActionText}>Story{"\n"}posten</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("Feedback")}>
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>Feedback{"\n"}geben</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greetingTextBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greeting: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  subGreeting: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 17,
  },
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  highlightIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  highlightTextBlock: {
    flex: 1,
  },
  highlightTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  highlightSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});
