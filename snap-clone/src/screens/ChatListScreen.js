import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ChatListItem from "../components/ChatListItem";
import { useAuth } from "../context/AuthContext";
import { listenChats } from "../services/chatService";
import { listenBlockedUsers } from "../services/moderationService";
import { listenIncomingSnaps } from "../services/snapService";
import { colors } from "../theme/colors";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [incomingSnaps, setIncomingSnaps] = useState([]);
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    const unsubChats = listenChats(user.uid, setChats);
    const unsubSnaps = listenIncomingSnaps(user.uid, setIncomingSnaps);
    const unsubBlocked = listenBlockedUsers(user.uid, setBlocked);
    return () => {
      unsubChats();
      unsubSnaps();
      unsubBlocked();
    };
  }, [user.uid]);

  const blockedIds = useMemo(() => new Set(blocked.map((b) => b.uid)), [blocked]);

  const otherParticipant = (chat) => {
    const otherId = chat.participants.find((id) => id !== user.uid);
    return { id: otherId, name: chat.participantNames?.[otherId] || "Unbekannt" };
  };

  const visibleChats = chats.filter((chat) => {
    const other = otherParticipant(chat);
    return !blockedIds.has(other.id);
  });
  const visibleSnaps = incomingSnaps.filter((snap) => !blockedIds.has(snap.senderId));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Chat</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddFriends")}>
          <Text style={styles.addFriendIcon}>➕</Text>
        </TouchableOpacity>
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
        data={visibleChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const other = otherParticipant(item);
          return (
            <ChatListItem
              name={other.name}
              lastMessage={item.lastMessage}
              isMine={item.lastSenderId === user.uid}
              onPress={() =>
                navigation.navigate("Chat", { chatId: item.id, otherUser: other })
              }
            />
          );
        }}
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
  addFriendIcon: {
    fontSize: 20,
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
