import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

export default function ChatListItem({ name, avatarColor, lastMessage, isMine, streakCount, unread, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: avatarColor || colors.primary }]}>
        <Text style={styles.avatarText}>{(name || "?").charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.textContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, unread && styles.nameUnread]}>{name}</Text>
          {streakCount > 0 ? (
            <Text style={styles.streak}>
              🔥 {streakCount}
            </Text>
          ) : null}
        </View>
        <Text numberOfLines={1} style={[styles.preview, unread && styles.previewUnread]}>
          {isMine ? "Du: " : ""}
          {lastMessage || "Sag Hallo 👋"}
        </Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  nameUnread: {
    fontWeight: "800",
  },
  streak: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  preview: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: "600",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
});
