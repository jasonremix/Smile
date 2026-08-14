import React, { useEffect, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";
import ReportModal from "./ReportModal";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { blockUser, reportContent } from "../services/moderationService";
import {
  deletePost,
  likePost,
  listenIsLiked,
  listenIsSaved,
  savePost,
  unlikePost,
  unsavePost,
} from "../services/postService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";

export default function PostCard({ post, navigation }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reporting, setReporting] = useState(false);
  const isOwn = post.authorId === user.uid;

  useEffect(() => {
    const unsubLiked = listenIsLiked(post.id, user.uid, setLiked);
    const unsubSaved = listenIsSaved(user.uid, post.id, setSaved);
    return () => {
      unsubLiked();
      unsubSaved();
    };
  }, [post.id, user.uid]);

  const toggleLike = () => {
    if (liked) {
      unlikePost(post.id, user.uid);
    } else {
      likePost(post.id, user.uid);
    }
  };

  const toggleSave = () => {
    if (saved) {
      unsavePost(user.uid, post.id);
    } else {
      savePost(user.uid, post.id);
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
    <View style={styles.card}>
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
        <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
          <Text style={styles.menuDots}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>{post.text}</Text>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={toggleLike}>
          <Icon name="heart" size={16} color={liked ? colors.primary : colors.textMuted} />
          <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
            {post.likeCount || 0}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate("Comments", { postId: post.id })}
        >
          <Icon name="chat" size={16} color={colors.textMuted} />
          <Text style={styles.actionCount}>{post.commentCount || 0}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={toggleSave}>
          <Icon name="bookmark" size={16} color={saved ? colors.primary : colors.textMuted} />
        </Pressable>
        <Pressable style={[styles.actionButton, styles.shareAction]} onPress={handleShare}>
          <Icon name="send" size={15} color={colors.textMuted} />
        </Pressable>
      </View>

      <ReportModal
        visible={reporting}
        onClose={() => setReporting(false)}
        title="Beitrag melden"
        onSubmit={(reason) =>
          reportContent({
            reporterId: user.uid,
            targetType: "post",
            targetId: post.id,
            targetUserId: post.authorId,
            reason,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
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
});
