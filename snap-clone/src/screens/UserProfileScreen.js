import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GradientView from "../components/GradientView";
import Icon from "../components/Icon";
import ChallengeBadgeChips from "../components/ChallengeBadgeChips";
import InterestChips from "../components/InterestChips";
import PostCard from "../components/PostCard";
import { PostCardSkeletonList } from "../components/PostCardSkeleton";
import ReportModal from "../components/ReportModal";
import ScreenHeader from "../components/ScreenHeader";
import CreatorBadge from "../components/CreatorBadge";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { getChatId } from "../services/chatService";
import { hasPendingRequest, listenFriends, sendFriendRequest } from "../services/friendService";
import { blockUser, reportContent } from "../services/moderationService";
import { fetchMoreUserPosts, getUserPostCount, listenUserPosts, POSTS_PAGE_SIZE } from "../services/postService";
import { getUserProfile } from "../services/userService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";

export default function UserProfileScreen({ route, navigation }) {
  const { uid } = route.params;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [livePosts, setLivePosts] = useState([]);
  const [morePosts, setMorePosts] = useState([]);
  const [postsLastDoc, setPostsLastDoc] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    getUserProfile(uid).then(setProfile);
  }, [uid]);

  useEffect(() => {
    setPostsLoading(true);
    setMorePosts([]);
    setHasMore(true);
    const unsubscribe = listenUserPosts(uid, (newPosts, lastDoc) => {
      setLivePosts(newPosts);
      setPostsLastDoc(lastDoc);
      if (newPosts.length < POSTS_PAGE_SIZE) setHasMore(false);
      setPostsLoading(false);
      getUserPostCount(uid)
        .then(setPostCount)
        .catch(() => {});
    });
    return unsubscribe;
  }, [uid]);

  const posts = useMemo(() => {
    const seen = new Set(livePosts.map((p) => p.id));
    return [...livePosts, ...morePosts.filter((p) => !seen.has(p.id))];
  }, [livePosts, morePosts]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !postsLastDoc || postsLoading) return;
    setLoadingMore(true);
    try {
      const result = await fetchMoreUserPosts(uid, postsLastDoc);
      setMorePosts((prev) => [...prev, ...result.posts]);
      if (result.lastDoc) setPostsLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    hasPendingRequest(currentUser.uid, uid).then(setRequestSent);
  }, [uid, currentUser.uid]);

  useEffect(() => {
    const unsubscribe = listenFriends(currentUser.uid, (friends) => {
      setIsFriend(friends.some((f) => f.uid === uid));
    });
    return unsubscribe;
  }, [uid, currentUser.uid]);

  const handleConnect = async () => {
    if (!profile || requestSent) return;
    await sendFriendRequest(currentUser, profile);
    setRequestSent(true);
  };

  const handleMessage = () => {
    navigation.navigate("Chat", {
      chatId: getChatId(currentUser.uid, uid),
      otherUser: { id: uid, name: profile?.displayName },
    });
  };

  const handleCall = () => {
    navigation.navigate("Call", {
      role: "caller",
      otherUser: { uid, displayName: profile?.displayName, avatarColor: profile?.avatarColor },
    });
  };

  const openMenu = () => {
    Alert.alert(profile?.displayName || "", "Was moechtest du tun?", [
      { text: "Melden", onPress: () => setReporting(true) },
      {
        text: "Blockieren",
        style: "destructive",
        onPress: () => {
          blockUser(currentUser.uid, { uid, displayName: profile?.displayName });
          navigation.goBack();
        },
      },
      { text: "Abbrechen", style: "cancel" },
    ]);
  };

  if (!profile) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
    <ScreenHeader
      onBack={() => navigation.goBack()}
      title={profile.username ? `@${profile.username}` : ""}
      right={
        <TouchableOpacity onPress={openMenu} style={styles.iconButton}>
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
      }
    />
    <FlatList
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
      ListHeaderComponent={
        <View>
          <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.avatarRing}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: profile.avatarColor || colors.primary }]}>
                <Text style={styles.avatarText}>{(profile.displayName || "?").charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </GradientView>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            {profile.verified ? <VerifiedBadge size={18} style={{ marginTop: 2 }} /> : null}
            {profile.isCreator ? <CreatorBadge size={18} style={{ marginTop: 2 }} /> : null}
          </View>
          <Text style={styles.username}>@{profile.username}</Text>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <InterestChips interests={profile.interests} style={styles.interestChips} />
          <ChallengeBadgeChips badges={profile.seasonalBadges} style={styles.interestChips} />

          {profile.location?.city ? (
            <View style={styles.locationRow}>
              <Icon name="pin" size={12} color={colors.textMuted} />
              <Text style={styles.locationText}>{profile.location.city}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{postCount}</Text>
              <Text style={styles.statLabel}>Beiträge</Text>
            </View>
          </View>

          {isFriend ? (
            <View style={styles.connectedPill}>
              <Icon name="check" size={11} color={colors.primaryLight} />
              <Text style={styles.connectedPillText}>Verbunden</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            {isFriend ? (
              <>
                <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                  <Text style={styles.messageButtonText}>Nachricht</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.callIconButton}
                  onPress={handleCall}
                  accessibilityRole="button"
                  accessibilityLabel={`${profile?.displayName} anrufen`}
                >
                  <Icon name="call" size={17} color={colors.text} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, requestSent && styles.connectButtonDisabled]}
                onPress={handleConnect}
                disabled={requestSent}
              >
                <Text style={styles.connectButtonText}>
                  {requestSent ? "Angefragt" : "Verbinden"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.postsHeading}>Beitraege</Text>
        </View>
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator color={colors.primary} style={styles.loadMoreSpinner} /> : null
      }
      ListEmptyComponent={
        postsLoading ? (
          <PostCardSkeletonList />
        ) : (
          <Text style={styles.emptyText}>Noch keine Beitraege.</Text>
        )
      }
      showsVerticalScrollIndicator={false}
    />
    <ReportModal
      visible={reporting}
      onClose={() => setReporting(false)}
      title={`${profile.displayName} melden`}
      targetDisplayName={profile.displayName}
      onSubmit={(report) =>
        reportContent({
          reporterId: currentUser.uid,
          targetType: "user",
          targetUserId: uid,
          targetDisplayName: profile.displayName,
          ...report,
        })
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: "center",
  },
  menuDots: {
    color: colors.text,
    fontSize: 20,
    textAlign: "center",
  },
  avatarRing: {
    width: 94,
    height: 94,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontSize: 32,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  displayName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  username: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: colors.text,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    maxWidth: "85%",
  },
  interestChips: {
    justifyContent: "center",
    marginTop: 8,
    maxWidth: "90%",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  connectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.primary}1f`,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  connectedPillText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 12,
    ...shadow.sm,
  },
  connectButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  connectButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  messageButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  messageButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  callIconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  postsHeading: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    marginTop: 28,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
  loadMoreSpinner: {
    marginVertical: 24,
  },
});
