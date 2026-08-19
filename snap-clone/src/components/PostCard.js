import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FilteredMedia from "./FilteredMedia";
import Icon from "./Icon";
import ReportModal from "./ReportModal";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { blockUser, reportContent } from "../services/moderationService";
import {
  deletePost,
  getPost,
  listenIsSaved,
  listenMyReaction,
  savePost,
  setReaction,
  unsavePost,
} from "../services/postService";
import { hapticLight } from "../utils/haptics";
import { REACTION_TYPES, getReactionEmoji } from "../utils/postReactions";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { shadow } from "../theme/shadow";

export default function PostCard({ post, navigation }) {
  const { user } = useAuth();
  const [myReaction, setMyReaction] = useState(null);
  const [saved, setSaved] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quotedPost, setQuotedPost] = useState(undefined);

  useEffect(() => {
    if (!post.quotedPostId) return;
    getPost(post.quotedPostId).then(setQuotedPost).catch(() => {});
  }, [post.quotedPostId]);
  const isOwn = post.authorId === user.uid;

  // Sanftes Einblenden statt hartem Pop-in beim Scrollen - laeuft nur einmal
  // pro gemountetem Card-Exemplar, nicht bei jedem Re-Render.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [enter]);

  useEffect(() => {
    const unsubReaction = listenMyReaction(post.id, user.uid, setMyReaction);
    const unsubSaved = listenIsSaved(user.uid, post.id, setSaved);
    return () => {
      unsubReaction();
      unsubSaved();
    };
  }, [post.id, user.uid]);

  const actor = {
    uid: user.uid,
    displayName: user.displayName,
    username: user.username,
    avatarColor: user.avatarColor,
  };

  const applyReaction = (type) => {
    hapticLight();
    setPickerOpen(false);
    setReaction(post.id, user.uid, type, myReaction, post.authorId, actor).catch(() => {});
  };

  // Kurzer Tap: vorhandene Reaktion (egal welcher Typ) entfernen, sonst
  // Standard-Herz setzen - wie bisheriges "liken". Waehrend die
  // Emoji-Auswahl offen ist, schliesst ein Tap sie nur wieder, statt eine
  // Reaktion auszuloesen (Escape-Hatch ohne Auswahl).
  const handleTapReact = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    applyReaction(myReaction || "heart");
  };

  const handleLongPressReact = () => {
    hapticLight();
    setPickerOpen((open) => !open);
  };

  const toggleSave = () => {
    if (saved) {
      unsavePost(user.uid, post.id).catch(() => {});
    } else {
      savePost(user.uid, post.id).catch(() => {});
    }
  };

  const handleShare = () => {
    Share.share({
      message: `${post.authorName} auf Nata: ${post.text}`,
    }).catch(() => {});
  };

  const openMenu = () => {
    if (isOwn) {
      Alert.alert(post.authorName, "Was moechtest du tun?", [
        { text: "Beitrag loeschen", style: "destructive", onPress: () => deletePost(post.id) },
        { text: "Abbrechen", style: "cancel" },
      ]);
    } else {
      Alert.alert(post.authorName, "Was moechtest du tun?", [
        { text: "Melden", onPress: () => setReporting(true) },
        {
          text: "Blockieren",
          style: "destructive",
          onPress: () =>
            blockUser(user.uid, { uid: post.authorId, displayName: post.authorName }),
        },
        { text: "Abbrechen", style: "cancel" },
      ]);
    }
  };

  const createdAtDate = post.createdAt?.toDate ? post.createdAt.toDate() : null;

  const openAuthorProfile = () => {
    if (isOwn) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("UserProfile", { uid: post.authorId });
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTappable} onPress={openAuthorProfile}>
          <View style={[styles.avatar, { backgroundColor: post.authorAvatarColor || colors.primary }]}>
            <Text style={styles.avatarText}>{(post.authorName || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{post.authorName}</Text>
              {post.authorVerified ? <VerifiedBadge size={13} /> : null}
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {post.authorUsername ? `@${post.authorUsername} · ` : ""}
              {createdAtDate ? timeAgo(createdAtDate) : ""}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openMenu}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Weitere Optionen"
        >
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>{post.text}</Text>
      {post.quotedPostId && quotedPost ? (
        <TouchableOpacity
          style={styles.quoteCard}
          onPress={() => navigation.navigate("UserProfile", { uid: quotedPost.authorId })}
          activeOpacity={0.8}
        >
          <Text style={styles.quoteAuthor}>{quotedPost.authorName}</Text>
          <Text style={styles.quoteText} numberOfLines={3}>{quotedPost.text}</Text>
        </TouchableOpacity>
      ) : null}
      {post.quotedPostId && quotedPost === null ? (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteDeletedText}>Ursprünglicher Beitrag wurde gelöscht.</Text>
        </View>
      ) : null}
      {post.mediaUrl ? (
        <View>
          <FilteredMedia
            uri={post.mediaUrl}
            mediaType="photo"
            filterId={post.filter}
            style={styles.media}
          />
          {post.musicSticker ? (
            <View style={styles.musicStickerOverlay}>
              <Icon name="sparkle" size={11} color="#fff" />
              <Text style={styles.musicStickerText} numberOfLines={1}>{post.musicSticker}</Text>
            </View>
          ) : null}
          {post.textStickers?.length > 0 ? (
            <View style={styles.textStickersOverlay}>
              {post.textStickers.map((s, i) => (
                <View key={i} style={styles.textStickerChip}>
                  <Text style={styles.textStickerChipText}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <View style={styles.reactionWrapper}>
          {pickerOpen ? (
            <View style={styles.reactionPicker}>
              {REACTION_TYPES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.reactionOption}
                  onPress={() => applyReaction(r.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mit ${r.label} reagieren`}
                >
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <Pressable
            style={styles.actionButton}
            onPress={handleTapReact}
            onLongPress={handleLongPressReact}
            accessibilityRole="button"
            accessibilityLabel={myReaction ? "Reaktion entfernen" : "Reagieren"}
            accessibilityState={{ selected: !!myReaction }}
          >
            {myReaction ? (
              <Text style={styles.reactionActiveEmoji}>{getReactionEmoji(myReaction)}</Text>
            ) : (
              <Icon name="heart" size={16} color={colors.textMuted} />
            )}
            <Text style={[styles.actionCount, myReaction && styles.actionCountActive]}>
              {post.likeCount || 0}
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate("Comments", { postId: post.id, postAuthorId: post.authorId })}
          accessibilityRole="button"
          accessibilityLabel="Kommentare ansehen"
        >
          <Icon name="chat" size={16} color={colors.textMuted} />
          <Text style={styles.actionCount}>{post.commentCount || 0}</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={toggleSave}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Beitrag nicht mehr merken" : "Beitrag merken"}
          accessibilityState={{ selected: saved }}
        >
          <Icon name="bookmark" size={16} color={saved ? colors.primary : colors.textMuted} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.shareAction]}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Beitrag teilen"
        >
          <Icon name="send" size={15} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("CreatePost", {
              quotedPostId: post.id,
              quotedPostPreview: { text: post.text, authorName: post.authorName },
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Beitrag zitieren"
        >
          <Icon name="repeat" size={15} color={colors.textMuted} />
        </Pressable>
      </View>

      <ReportModal
        visible={reporting}
        onClose={() => setReporting(false)}
        title="Beitrag melden"
        targetDisplayName={post.authorName}
        onSubmit={(report) =>
          reportContent({
            reporterId: user.uid,
            targetType: "post",
            targetId: post.id,
            targetUserId: post.authorId,
            targetDisplayName: post.authorName,
            ...report,
          })
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTappable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuDots: {
    color: colors.textMuted,
    fontSize: 18,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  musicStickerOverlay: {
    position: "absolute",
    top: 20,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: "70%",
  },
  musicStickerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  textStickersOverlay: {
    position: "absolute",
    bottom: 12,
    left: 10,
    gap: 6,
  },
  textStickerChip: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  textStickerChipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  quoteCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 10,
  },
  quoteAuthor: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12.5,
    marginBottom: 3,
  },
  quoteText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  quoteDeletedText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontStyle: "italic",
  },
  media: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    marginTop: 10,
    backgroundColor: colors.surfaceLight,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 22,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareAction: {
    marginLeft: "auto",
  },
  actionCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  actionCountActive: {
    color: colors.primary,
  },
  reactionWrapper: {
    position: "relative",
  },
  reactionActiveEmoji: {
    fontSize: 15,
  },
  reactionPicker: {
    position: "absolute",
    bottom: "100%",
    left: -spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: "row",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    ...shadow.sm,
    zIndex: 10,
  },
  reactionOption: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  reactionEmoji: {
    fontSize: 22,
  },
});
