import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "../components/Icon";
import NataScoreCard from "../components/NataScoreCard";
import PostCard from "../components/PostCard";
import ScreenHeader from "../components/ScreenHeader";
import StatusEditor from "../components/StatusEditor";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { PostCardSkeletonList } from "../components/PostCardSkeleton";
import { listenFriends } from "../services/friendService";
import {
  fetchMoreUserPosts,
  getUserPostCount,
  listenUserPosts,
  POSTS_PAGE_SIZE,
} from "../services/postService";
import { clearStatus, isStatusActive, setStatus } from "../services/userService";
import { colors } from "../theme/colors";
import { getLevelInfo } from "../utils/nataLevel";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isModal = navigation.canGoBack();
  const [livePosts, setLivePosts] = useState([]);
  const [morePosts, setMorePosts] = useState([]);
  const [postsLastDoc, setPostsLastDoc] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [statusEditorVisible, setStatusEditorVisible] = useState(false);
  const activeStatus = isStatusActive(user?.status) ? user.status : null;

  // Collapsing Header: die grosse Identitaets-Sektion scrollt normal mit,
  // eine schmale Leiste mit Mini-Avatar + Name blendet sich erst ein, wenn
  // sie aus dem Blick gescrollt ist - wie bei einem nativen Large-Title, der
  // beim Scrollen zu einem kompakten Titel wird.
  const scrollY = useRef(new Animated.Value(0)).current;
  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [70, 130],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!user?.uid) return;
    setPostsLoading(true);
    setMorePosts([]);
    setHasMore(true);
    const unsubscribe = listenUserPosts(user.uid, (newPosts, lastDoc) => {
      setLivePosts(newPosts);
      setPostsLastDoc(lastDoc);
      if (newPosts.length < POSTS_PAGE_SIZE) setHasMore(false);
      setPostsLoading(false);
      getUserPostCount(user.uid)
        .then(setPostCount)
        .catch(() => {});
    });
    return unsubscribe;
  }, [user?.uid]);

  // Live erste Seite + einmalig nachgeladene aeltere Seiten getrennt halten,
  // siehe HomeScreen fuer den gleichen Ansatz beim "Fuer dich"-Feed.
  const posts = useMemo(() => {
    const seen = new Set(livePosts.map((p) => p.id));
    return [...livePosts, ...morePosts.filter((p) => !seen.has(p.id))];
  }, [livePosts, morePosts]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !postsLastDoc || postsLoading) return;
    setLoadingMore(true);
    try {
      const result = await fetchMoreUserPosts(user.uid, postsLastDoc);
      setMorePosts((prev) => [...prev, ...result.posts]);
      if (result.lastDoc) setPostsLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user?.uid]);

  const handleShare = () => {
    Share.share({
      message: `Ich bin auf Nata - schreib mir: @${user?.username}`,
    }).catch(() => {});
  };

  const handleBetaBadgePress = () => {
    Alert.alert(
      "Beta-Tester",
      "Du gehörst zu den ersten Menschen, die Nata testen."
    );
  };

  const settingsButton = (
    <TouchableOpacity
      style={styles.headerIconButton}
      onPress={() => navigation.navigate("Settings")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Einstellungen"
    >
      <Icon name="settings" size={18} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isModal ? (
        <ScreenHeader
          onBack={() => navigation.goBack()}
          backIcon="close"
          title="Profil"
          right={settingsButton}
        />
      ) : (
        <ScreenHeader title="Profil" right={settingsButton} />
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.compactHeader,
          { paddingTop: insets.top + spacing.sm, opacity: compactHeaderOpacity },
        ]}
      >
        <View style={[styles.compactAvatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
          <Text style={styles.compactAvatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.compactName} numberOfLines={1}>
          {user?.displayName}
        </Text>
      </Animated.View>

      <Animated.FlatList
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <PostCard post={item} navigation={navigation} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.identitySection}>
              <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
                <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{user?.displayName}</Text>
                {user?.verified ? <VerifiedBadge size={18} style={styles.verifiedBadge} /> : null}
              </View>
              <Text style={styles.username}>@{user?.username}</Text>

              {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

              {user?.location?.city ? (
                <View style={styles.locationRow}>
                  <Icon name="pin" size={12} color={colors.textMuted} />
                  <Text style={styles.locationText}>{user.location.city}</Text>
                </View>
              ) : null}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{postCount}</Text>
                  <Text style={styles.statLabel}>Beiträge</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{friends.length}</Text>
                  <Text style={styles.statLabel}>Connections</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{getLevelInfo(user?.nataScore ?? 0).score}</Text>
                  <Text style={styles.statLabel}>Score</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.statusRow} onPress={() => setStatusEditorVisible(true)}>
                <Icon name="sparkle" size={13} color={colors.primaryLight} />
                <Text style={styles.statusText} numberOfLines={1}>
                  {activeStatus ? activeStatus.text : "Was ist gerade los?"}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate("EditProfile")}
                  accessibilityRole="button"
                  accessibilityLabel="Profil bearbeiten"
                >
                  <Text style={styles.editButtonText}>Profil bearbeiten</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Profil teilen"
                >
                  <Icon name="send" size={15} color={colors.text} />
                </TouchableOpacity>
              </View>

              {user?.betaTesterNumber ? (
                <TouchableOpacity style={styles.testerBadge} onPress={handleBetaBadgePress}>
                  <Icon name="sparkle" size={11} color={colors.primaryLight} />
                  <Text style={styles.testerBadgeText}>Beta-Tester #{user.betaTesterNumber}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.scoreSection}>
              <NataScoreCard
                score={user?.nataScore ?? 0}
                onPress={() => navigation.navigate("ScoreHistory")}
              />
            </View>

            <Text style={styles.postsHeading}>Meine Beiträge</Text>
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
            <Text style={styles.emptyText}>Noch keine Beiträge.</Text>
          )
        }
      />

      <StatusEditor
        visible={statusEditorVisible}
        onClose={() => setStatusEditorVisible(false)}
        currentText={activeStatus?.text}
        onSave={(text) => setStatus(user.uid, text)}
        onClear={() => clearStatus(user.uid)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  compactAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  compactAvatarText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "800",
  },
  compactName: {
    color: colors.text,
    ...typography.headline,
  },
  identitySection: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarText: {
    color: "#000",
    fontSize: 36,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  displayName: {
    color: colors.text,
    ...typography.title,
  },
  verifiedBadge: {
    marginTop: 2,
  },
  username: {
    color: colors.textMuted,
    ...typography.body,
    marginTop: 2,
  },
  bio: {
    color: colors.text,
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.md,
    maxWidth: "90%",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  locationText: {
    color: colors.textMuted,
    ...typography.footnote,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    color: colors.text,
    ...typography.headline,
  },
  statLabel: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: colors.border,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
    maxWidth: "90%",
  },
  statusText: {
    color: colors.text,
    ...typography.footnote,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  editButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm + 2,
  },
  editButtonText: {
    color: colors.text,
    ...typography.subhead,
  },
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  testerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.lg,
  },
  testerBadgeText: {
    color: colors.primaryLight,
    ...typography.caption,
  },
  scoreSection: {
    marginBottom: spacing.xxl,
  },
  postWrapper: {
    width: "100%",
  },
  postsHeading: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
  loadMoreSpinner: {
    marginVertical: spacing.xl,
  },
});
