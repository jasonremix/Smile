import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BetaCountdownBanner from "../components/BetaCountdownBanner";
import Icon from "../components/Icon";
import MomentsTray from "../components/MomentsTray";
import NataScoreCard from "../components/NataScoreCard";
import PostCard from "../components/PostCard";
import { PostCardSkeletonList } from "../components/PostCardSkeleton";
import StatusStrip from "../components/StatusStrip";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { useUnreadChats } from "../hooks/useUnreadChats";
import { useUnseenAnnouncementCount } from "../hooks/useUnseenAnnouncementCount";
import { listenFriends, listenIncomingRequests } from "../services/friendService";
import { listenUnreadNotificationCount } from "../services/notificationService";
import {
  fetchMoreFollowingPosts,
  fetchMorePosts,
  listenFeed,
  listenFollowingFeed,
  POSTS_PAGE_SIZE,
} from "../services/postService";
import { listenScoreEventsSince } from "../services/userService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { unreadCount } = useUnreadChats();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [weeklyEvents, setWeeklyEvents] = useState([]);
  const [friends, setFriends] = useState([]);
  const [feedTab, setFeedTab] = useState("forYou"); // "forYou" | "following"
  const [livePosts, setLivePosts] = useState([]);
  const [morePosts, setMorePosts] = useState([]);
  const [postsLastDoc, setPostsLastDoc] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const unseenAnnouncementCount = useUnseenAnnouncementCount();
  const bellBadgeCount = unreadNotifications + unseenAnnouncementCount;

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
    const unsubscribe = listenUnreadNotificationCount(user.uid, setUnreadNotifications);
    return unsubscribe;
  }, [user.uid]);

  // Stabiler Schluessel statt der rohen friends-Liste als Abhaengigkeit:
  // listenFriends() liefert bei jeder Aenderung (auch z.B. nur Anzeigename
  // oder Status einer Connection) ein neues Array-Objekt. Mit friends direkt
  // als Dependency riss das den kompletten Feed-Listener bei jeder solchen
  // Nebensaechlichkeit ab und neu auf - inklusive kurzem Skeleton-Aufblitzen -
  // sogar im "Fuer dich"-Tab, wo friends gar nicht verwendet wird.
  const friendIdsKey = useMemo(
    () => friends.map((f) => f.uid).sort().join(","),
    [friends]
  );

  useEffect(() => {
    setPostsLoading(true);
    setMorePosts([]);
    setHasMore(true);
    const handlePage = (newPosts, lastDoc) => {
      setLivePosts(newPosts);
      setPostsLastDoc(lastDoc);
      if (newPosts.length < POSTS_PAGE_SIZE) setHasMore(false);
      setPostsLoading(false);
    };
    const unsubscribe =
      feedTab === "forYou"
        ? listenFeed(handlePage)
        : listenFollowingFeed(friendIdsKey ? friendIdsKey.split(",") : [], handlePage);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedTab, friendIdsKey]);

  // Live erste Seite + einmalig nachgeladene aeltere Seiten getrennt halten,
  // damit ein Realtime-Update der ersten Seite (z.B. neuer Beitrag) nicht die
  // schon nachgeladenen aelteren Beitraege ueberschreibt.
  const posts = useMemo(() => {
    const seen = new Set(livePosts.map((p) => p.id));
    return [...livePosts, ...morePosts.filter((p) => !seen.has(p.id))];
  }, [livePosts, morePosts]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !postsLastDoc || postsLoading) return;
    setLoadingMore(true);
    try {
      const result =
        feedTab === "forYou"
          ? await fetchMorePosts(postsLastDoc)
          : await fetchMoreFollowingPosts(friends.map((f) => f.uid), postsLastDoc);
      setMorePosts((prev) => [...prev, ...result.posts]);
      if (result.lastDoc) setPostsLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate("NataAI")}
            accessibilityRole="button"
            accessibilityLabel="Nata AI oeffnen"
          >
            <Icon name="sparkle" size={17} color={colors.primaryLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => navigation.navigate("Notifications")}
            accessibilityRole="button"
            accessibilityLabel={
              bellBadgeCount > 0
                ? `Benachrichtigungen, ${bellBadgeCount} ungelesen`
                : "Benachrichtigungen"
            }
          >
            <Icon name="bell" size={20} color={colors.text} />
            {bellBadgeCount > 0 ? (
              <View style={styles.messagesBadge}>
                <Text style={styles.messagesBadgeText}>
                  {bellBadgeCount > 9 ? "9+" : bellBadgeCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => navigation.navigate("Chats")}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Nachrichten, ${unreadCount} ungelesen` : "Nachrichten"}
          >
            <Icon name="chat" size={20} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={styles.messagesBadge}>
                <Text style={styles.messagesBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <BetaCountdownBanner />

      <View style={styles.greetingRow}>
        <View style={styles.greetingTextBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.greeting}>Hey, {user?.displayName || "du"}</Text>
            {user?.verified ? <VerifiedBadge size={16} /> : null}
          </View>
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

      <View style={styles.scoreCardWrap}>
        <NataScoreCard
          score={user?.nataScore ?? 0}
          weeklyPoints={weeklyPoints}
          onPress={() => navigation.navigate("ScoreHistory")}
        />
      </View>

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

      <View style={styles.divider} />

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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
      ListHeaderComponent={ListHeader}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator color={colors.primary} style={styles.loadMoreSpinner} /> : null
      }
      ListEmptyComponent={
        postsLoading ? (
          <PostCardSkeletonList />
        ) : (
          <View style={styles.feedEmpty}>
            <Icon name="document" size={26} color={colors.textMuted} />
            <Text style={styles.feedEmptyText}>
              {feedTab === "forYou"
                ? "Noch keine Beitraege."
                : "Deine Connections haben noch nichts gepostet."}
            </Text>
          </View>
        )
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  brand: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagesButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  aiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(147, 51, 234, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.4)",
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
    marginBottom: spacing.lg,
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
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  highlightIcon: {
    marginRight: spacing.md + 2,
  },
  highlightTextBlock: {
    flex: 1,
  },
  highlightTitle: {
    color: colors.text,
    ...typography.subhead,
  },
  highlightSubtitle: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: 2,
  },
  scoreCardWrap: {
    marginTop: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
  },
  feedTabRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  feedTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
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
  loadMoreSpinner: {
    marginVertical: spacing.xl,
  },
  feedEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});
