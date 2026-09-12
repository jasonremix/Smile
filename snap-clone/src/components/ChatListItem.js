import React, { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

// Nach links wischen zeigt Anpinnen/Loeschen statt eines zusaetzlichen
// Long-Press-Gestus - eine Geste statt zwei sich ueberschneidende, und naeher
// an dem, was man aus anderen Messaging-Apps bereits kennt ("modern/klarer").
export default function ChatListItem({
  name,
  avatarColor,
  lastMessage,
  isMine,
  streakCount,
  unread,
  pinned,
  onPress,
  onTogglePin,
  onDelete,
}) {
  const swipeableRef = useRef(null);

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          swipeableRef.current?.close();
          onTogglePin?.();
        }}
      >
        <Icon name="pin" size={17} color={colors.text} />
        <Text style={styles.actionText}>{pinned ? "Lösen" : "Anpinnen"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.danger }]}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.();
        }}
      >
        <Icon name="trash" size={17} color={colors.text} />
        <Text style={styles.actionText}>Löschen</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.avatar, { backgroundColor: avatarColor || colors.primary }]}>
          <Text style={styles.avatarText}>{(name || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            {pinned ? <Icon name="pin" size={11} color={colors.textMuted} /> : null}
            <Text style={[styles.name, unread && styles.nameUnread]}>{name}</Text>
            {streakCount > 0 ? (
              <View style={styles.streakRow}>
                <Icon name="flame" size={12} color={colors.textMuted} />
                <Text style={styles.streak}>{streakCount}</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={[styles.preview, unread && styles.previewUnread]}>
            {isMine ? "Du: " : ""}
            {lastMessage || "Neue Unterhaltung"}
          </Text>
        </View>
        {unread ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    </Swipeable>
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
    backgroundColor: colors.background,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
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
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
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
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
  },
  actionButton: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
});
