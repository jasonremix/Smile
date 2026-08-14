import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import NataScoreCard from "../components/NataScoreCard";
import PostCard from "../components/PostCard";
import ScreenHeader from "../components/ScreenHeader";
import StatusEditor from "../components/StatusEditor";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { listenUserPosts } from "../services/postService";
import { clearStatus, isStatusActive, setStatus } from "../services/userService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const isModal = navigation.canGoBack();
  const [posts, setPosts] = useState([]);
  const [statusEditorVisible, setStatusEditorVisible] = useState(false);
  const activeStatus = isStatusActive(user?.status) ? user.status : null;

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenUserPosts(user.uid, setPosts);
    return unsubscribe;
  }, [user?.uid]);

  const settingsButton = (
    <TouchableOpacity
      style={styles.headerIconButton}
      onPress={() => navigation.navigate("Settings")}
      hitSlop={8}
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

      <FlatList
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
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
                  <Icon name="grid" size={12} color={colors.textMuted} />
                  <Text style={styles.locationText}>{user.location.city}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.statusRow} onPress={() => setStatusEditorVisible(true)}>
                <Icon name="sparkle" size={13} color={colors.primaryLight} />
                <Text style={styles.statusText} numberOfLines={1}>
                  {activeStatus ? activeStatus.text : "Was ist gerade los?"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Text style={styles.editButtonText}>Profil bearbeiten</Text>
              </TouchableOpacity>

              {user?.betaTesterNumber ? (
                <View style={styles.testerBadge}>
                  <Text style={styles.testerBadgeText}>Beta-Tester #{user.betaTesterNumber}</Text>
                </View>
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
        ListEmptyComponent={<Text style={styles.emptyText}>Noch keine Beiträge.</Text>}
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
  editButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.lg,
  },
  editButtonText: {
    color: colors.text,
    ...typography.subhead,
  },
  testerBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
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
});
