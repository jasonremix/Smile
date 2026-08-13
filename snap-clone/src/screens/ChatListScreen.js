import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ChatListItem from "../components/ChatListItem";
import { useAuth } from "../context/AuthContext";
import { isStreakActive, listenChats } from "../services/chatService";
import { listenGroups } from "../services/groupService";
import { listenBlockedUsers } from "../services/moderationService";
import { listenIncomingSnaps } from "../services/snapService";
import { colors } from "../theme/colors";

function toMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : 0;
}

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [incomingSnaps, setIncomingSnaps] = useState([]);
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    const unsubChats = listenChats(user.uid, setChats);
    const unsubGroups = listenGroups(user.uid, setGroups);
    const unsubSnaps = listenIncomingSnaps(user.uid, setIncomingSnaps);
    const unsubBlocked = listenBlockedUsers(user.uid, setBlocked);
    return () => {
      unsubChats();
      unsubGroups();
      unsubSnaps();
      unsubBlocked();
    };
  }, [user.uid]);

  const blockedIds = useMemo(() => new Set(blocked.map((b) => b.uid)), [blocked]);

  const otherParticipant = (chat) => {
    const otherId = chat.participants.find((id) => id !== user.uid);
    return { id: otherId, name: chat.participantNames?.[otherId] || "Unbekannt" };
  };

  const visibleSnaps = incomingSnaps.filter((snap) => !blockedIds.has(snap.senderId));

  const conversations = useMemo(() => {
    const dmItems = chats
      .filter((chat) => !blockedIds.has(otherParticipant(chat).id))
      .map((chat) => {
        const other = otherParticipant(chat);
        return {
          type: "dm",
          id: chat.id,
          name: other.name,
          otherUser: other,
          lastMessage: chat.lastMessage,
          isMine: chat.lastSenderId === user.uid,
          updatedAtMs: toMillis(chat.updatedAt),
          streakCount: isStreakActive(chat.streakLastDate) ? chat.streakCount || 0 : 0,
        };
      });

    const groupItems = groups.map((group) => ({
      type: "group",
      id: group.id,
      name: `👥 ${group.name}`,
      groupId: group.id,
      groupName: group.name,
      lastMessage: group.lastMessage,
      isMine: group.lastSenderId === user.uid,
      updatedAtMs: toMillis(group.updatedAt),
    }));

    return [...dmItems, ...groupItems].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [chats, groups, blockedIds, user.uid]);

  const openNewGroup = () => navigation.navigate("CreateGroup");

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Chat</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={openNewGroup} style={styles.headerIconButton}>
            <Text style={styles.headerIcon}>👥➕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("AddFriends")} style={styles.headerIconButton}>
            <Text style={styles.headerIcon}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {visibleSnaps.length > 0 ? (
        <View style={styles.snapsSection}>
          <Text style={styles.sectionTitle}>Neue Snaps</Text>
          {visibleSnaps.map((snap) => (
            <TouchableOpacity
              key={snap.id}
              style={styles.snapRow}
              onPress={() => navigation.navigate("SnapViewer", { snap })}
            >
              <Text style={styles.snapIcon}>{snap.mediaType === "video" ? "🎥" : "📷"}</Text>
              <Text style={styles.snapSender}>{snap.senderName}</Text>
              <Text style={styles.snapCta}>Antippen zum Ansehen</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <FlatList
        data={conversations}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <ChatListItem
            name={item.name}
            lastMessage={item.lastMessage}
            isMine={item.isMine}
            streakCount={item.streakCount}
            onPress={() =>
              item.type === "group"
                ? navigation.navigate("GroupChat", { groupId: item.groupId, groupName: item.groupName })
                : navigation.navigate("Chat", { chatId: item.id, otherUser: item.otherUser })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Noch keine Unterhaltungen. Fuege Freunde hinzu, um loszulegen!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  headerIcons: {
    flexDirection: "row",
  },
  headerIconButton: {
    marginLeft: 16,
  },
  headerIcon: {
    fontSize: 18,
  },
  snapsSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  snapRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  snapIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  snapSender: {
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  snapCta: {
    color: colors.primary,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 32,
  },
});
