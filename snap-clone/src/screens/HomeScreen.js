import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AchievementRow from "../components/AchievementRow";
import Icon from "../components/Icon";
import MomentsTray from "../components/MomentsTray";
import NataScoreCard from "../components/NataScoreCard";
import PostCard from "../components/PostCard";
import StatusStrip from "../components/StatusStrip";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { listenFriends, listenIncomingRequests } from "../services/friendService";
import { listenFeed, listenFollowingFeed } from "../services/postService";
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
  const [friends, setFriends] = useState([]);
  const [feedTab, setFeedTab] = useState("forYou"); // "forYou" | "following"
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = listenIncomingRequests(user.uid, setIncomingRequests);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenScoreEventsSince(user.uid, startOfWeek(), setWeeklyEvents);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe =
      feedTab === "forYou"
        ? listenFeed(setPosts)
        : listenFollowingFeed(friends.map((f) => f.uid), setPosts);
    return unsubscribe;
  }, [feedTab, friends]);

  const weeklyPoints = useMemo(
    () => weeklyEvents.reduce((sum, e) => sum + (e.amount || 0), 0),
    [weeklyEvents]
  );

  // Kleines, unaufdringliches Easter Egg - laenger auf den Avatar druecken.
  const [booVisible, setBooVisible] = useState(false);
  const avatarScale = useRef(new Animated.Value(1)).current;
  const booOpacity = useRef(new Animated.Value(0)).current;

  const handleAvatarLongPress = () => {
    setBooVisible(true);
    Animated.sequence([
      Animated.spring(avatarScale, { toValue: 1.25, useNativeDriver: true, friction: 3 }),
      Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();
    Animated.sequence([
      Animated.timing(booOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(booOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setBooVisible(false));
  };

  const ListHeader = (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.brand}>Nata</Text>
        <TouchableOpacity style={styles.messagesButton} onPress={() => navigation.navigate("Chats")}>
          <Icon name="chat" size={20} color={colors.text} />
          {unreadCount > 0 ? (
            <View style={styles.messagesBadge}>
              <Text style={styles.messagesBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.greetingRow}>
        <View style={styles.greetingTextBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.greeting}>Hey, {user?.displayName || "du"}</Text>
            {user?.verified ? <VerifiedBadge size={16} /> : null}
          </View>
          <Text style={styles.subGreeting}>Schoen, dass du da bist.</Text>
        </View>
        <View>
          {booVisible ? (
            <Animated.Text style={[styles.booText, { opacity: booOpacity }]}>Boo!</Animated.Text>
          ) : null}
          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            <TouchableOpacity
              style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}
              onPress={() => navigation.navigate("Profile")}
              onLongPress={handleAvatarLongPress}
            >
              <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <MomentsTray navigation={navigation} />
      <StatusStrip navigation={navigation} />

      <NataScoreCard
        score={user?.nataScore ?? 0}
        weeklyPoints={weeklyPoints}
        onPress={() => navigation.navigate("ScoreHistory")}
      />

      <AchievementRow score={user?.nataScore ?? 0} />

      {incomingRequests.length > 0 ? (
        <TouchableOpacity style={styles.highlightCard} onPress={() => navigation.navigate("Friends")}>
          <Icon name="people" size={20} color={colors.primaryLight} style={styles.highlightIcon} />
          <View style={styles.highlightTextBlock}>
            <Text style={styles.highlightTitle}>
              {incomingRequests.length === 1
                ? "1 neue Verbindungsanfrage"
                : `${incomingRequests.length} neue Verbindungsanfragen`}
            </Text>
            <Text style={styles.highlightSubtitle}>Antippen zum Ansehen</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("AddFriends")}>
          <Icon name="plus" size={20} color={colors.primaryLight} style={styles.quickActionIcon} />
          <Text style={styles.quickActionText}>Verbinden</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Camera", { intent: "story" })}
        >
          <Icon name="moment" size={20} color={colors.primaryLight} style={styles.quickActionIcon} />
          <Text style={styles.quickActionText}>Moment{"\n"}teilen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate("Feedback")}>
          <Icon name="bulb" size={20} color={colors.primaryLight} style={styles.quickActionIcon} />
          <Text style={styles.quickActionText}>Feedback{"\n"}geben</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedTabRow}>
        <TouchableOpacity
          style={[styles.feedTab, feedTab === "forYou" && styles.feedTabActive]}
          onPress={() => setFeedTab("forYou")}
        >
          <Text style={[styles.feedTabText, feedTab === "forYou" && styles.feedTabTextActive]}>
            Fuer dich
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedTab, feedTab === "following" && styles.feedTabActive]}
          onPress={() => setFeedTab("following")}
        >
          <Text style={[styles.feedTabText, feedTab === "following" && styles.feedTabTextActive]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.feedEmpty}>
          <Icon name="document" size={26} color={colors.textMuted} />
          <Text style={styles.feedEmptyText}>
            {feedTab === "forYou"
              ? "Noch keine Beitraege."
              : "Deine Connections haben noch nichts gepostet."}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  messagesButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  messagesBadgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "800",
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
  booText: {
    position: "absolute",
    top: -26,
    right: 0,
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "800",
    zIndex: 2,
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
    marginBottom: 8,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  feedTabRow: {
    flexDirection: "row",
    marginTop: 28,
    marginBottom: 14,
    gap: 8,
  },
  feedTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  feedTabActive: {
    backgroundColor: colors.primary,
  },
  feedTabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  feedTabTextActive: {
    color: colors.text,
  },
  feedEmpty: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  feedEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});
