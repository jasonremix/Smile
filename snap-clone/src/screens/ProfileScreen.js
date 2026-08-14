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
      style={styles.settingsButton}
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
          <View style={{ alignItems: "center" }}>
            <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
              <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{user?.displayName}</Text>
              {user?.verified ? <VerifiedBadge size={18} style={styles.verifiedBadge} /> : null}
            </View>
            <Text style={styles.username}>@{user?.username}</Text>

            <TouchableOpacity style={styles.statusRow} onPress={() => setStatusEditorVisible(true)}>
              <Icon name="sparkle" size={13} color={colors.primaryLight} />
              <Text style={styles.statusText} numberOfLines={1}>
                {activeStatus ? activeStatus.text : "Was ist gerade los?"}
              </Text>
            </TouchableOpacity>

            {user?.betaTesterNumber ? (
              <View style={styles.testerBadge}>
                <Text style={styles.testerBadgeText}>Beta-Tester #{user.betaTesterNumber}</Text>
              </View>
            ) : null}

            <NataScoreCard
              score={user?.nataScore ?? 0}
              onPress={() => navigation.navigate("ScoreHistory")}
            />

            <Text style={styles.postsHeading}>Meine Beitraege</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Noch keine Beitraege.</Text>}
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
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  postWrapper: {
    width: "100%",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#000",
    fontSize: 36,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  displayName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  verifiedBadge: {
    marginTop: 2,
  },
  username: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    maxWidth: "90%",
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  testerBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  testerBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "700",
  },
  postsHeading: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginTop: 28,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
});
