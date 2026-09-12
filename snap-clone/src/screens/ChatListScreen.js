import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ChatListItem from "../components/ChatListItem";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import NataAIListRow from "../components/NataAIListRow";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { deleteChat, isStreakActive } from "../services/chatService";
import { leaveGroup, listenGroups } from "../services/groupService";
import { listenBlockedUsers } from "../services/moderationService";
import { listenIncomingSnaps } from "../services/snapService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { isChatUnread, useUnreadChats } from "../hooks/useUnreadChats";
import { getPinnedChatIds, togglePinnedChat } from "../utils/pinnedChats";

function toMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : 0;
}

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const { chats } = useUnreadChats();
  const [groups, setGroups] = useState([]);
  const [incomingSnaps, setIncomingSnaps] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);

  useEffect(() => {
    const unsubGroups = listenGroups(user.uid, setGroups);
    const unsubSnaps = listenIncomingSnaps(user.uid, setIncomingSnaps);
    const unsubBlocked = listenBlockedUsers(user.uid, setBlocked);
    getPinnedChatIds().then(setPinnedIds);
    return () => {
      unsubGroups();
      unsubSnaps();
      unsubBlocked();
    };
  }, [user.uid]);

  const handleTogglePin = (pinKey) => {
    togglePinnedChat(pinKey).then(setPinnedIds);
  };

  const handleDelete = (item) => {
    const isGroup = item.type === "group";
    Alert.alert(
      isGroup ? "Gruppe verlassen" : "Unterhaltung löschen",
      isGroup
        ? `Möchtest du "${item.name}" wirklich verlassen?`
        : `Möchtest du die Unterhaltung mit ${item.name} wirklich löschen? Das kann nicht rückgängig gemacht werden.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: isGroup ? "Verlassen" : "Löschen",
          style: "destructive",
          onPress: () => {
            const action = isGroup ? leaveGroup(item.groupId, user.uid) : deleteChat(item.id);
            action.catch(() =>
              Alert.alert("Fehler", "Das hat gerade nicht geklappt. Bitte erneut versuchen.")
            );
          },
        },
      ]
    );
  };

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
          unread: isChatUnread(chat, user.uid),
        };
      });

    const groupItems = groups.map((group) => ({
      type: "group",
      id: group.id,
      name: group.name,
      groupId: group.id,
      groupName: group.name,
      lastMessage: group.lastMessage,
      isMine: group.lastSenderId === user.uid,
      updatedAtMs: toMillis(group.updatedAt),
    }));

    // Angepinnte Unterhaltungen (rein lokale Geraete-Praeferenz, siehe
    // utils/pinnedChats.js) zuerst, jeweils intern weiter nach Aktivitaet
    // sortiert - kein Firestore-Feld, deshalb kein Regel-Update noetig.
    const withPin = [...dmItems, ...groupItems].map((item) => ({
      ...item,
      pinKey: `${item.type}:${item.id}`,
      pinned: pinnedIds.includes(`${item.type}:${item.id}`),
    }));

    return withPin.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAtMs - a.updatedAtMs;
    });
  }, [chats, groups, blockedIds, pinnedIds, user.uid]);

  const openNewGroup = () => navigation.navigate("CreateGroup");

  return (
    <View style={styles.container}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        title="Nachrichten"
        right={
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={openNewGroup} style={styles.headerIconButton}>
              <Icon name="people" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("AddFriends")} style={styles.headerIconButton}>
              <Icon name="plus" size={19} color={colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <NataAIListRow onPress={() => navigation.navigate("NataAI")} />

      {visibleSnaps.length > 0 ? (
        <View style={styles.snapsSection}>
          <Text style={styles.sectionTitle}>Neue Snaps</Text>
          {visibleSnaps.map((snap) => (
            <TouchableOpacity
              key={snap.id}
              style={styles.snapRow}
              onPress={() => navigation.navigate("SnapViewer", { snap })}
            >
              <Icon name={snap.mediaType === "video" ? "video" : "camera"} size={17} color={colors.primaryLight} style={styles.snapIcon} />
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
            unread={item.unread}
            pinned={item.pinned}
            onPress={() =>
              item.type === "group"
                ? navigation.navigate("GroupChat", { groupId: item.groupId, groupName: item.groupName })
                : navigation.navigate("Chat", { chatId: item.id, otherUser: item.otherUser })
            }
            onTogglePin={() => handleTogglePin(item.pinKey)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Noch keine Nachrichten"
            text="Deine Unterhaltungen erscheinen hier."
            actionLabel="Menschen entdecken"
            onAction={() => navigation.navigate("Tabs", { screen: "Discovery" })}
          />
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
  headerIcons: {
    flexDirection: "row",
  },
  headerIconButton: {
    marginLeft: 16,
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
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  snapIcon: {
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
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  emptyButtonText: {
    color: colors.primaryLight,
    fontWeight: "700",
    fontSize: 13,
  },
});
