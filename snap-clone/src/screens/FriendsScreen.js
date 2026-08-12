import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  acceptFriendRequest,
  declineFriendRequest,
  listenFriends,
  listenIncomingRequests,
} from "../services/friendService";
import { colors } from "../theme/colors";

export default function FriendsScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const unsubFriends = listenFriends(user.uid, setFriends);
    const unsubRequests = listenIncomingRequests(user.uid, setRequests);
    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [user.uid]);

  const currentUserForAccept = { uid: user.uid, displayName: user.displayName, username: user.username };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Freunde</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddFriends")}>
          <Text style={styles.addIcon}>➕ Hinzufuegen</Text>
        </TouchableOpacity>
      </View>

      {requests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Freundschaftsanfragen</Text>
          {requests.map((req) => (
            <View key={req.id} style={styles.requestRow}>
              <Text style={styles.requestName}>{req.fromDisplayName}</Text>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => acceptFriendRequest(req, currentUserForAccept)}
                >
                  <Text style={styles.acceptText}>Annehmen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => declineFriendRequest(req)}
                >
                  <Text style={styles.declineText}>Ablehnen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Meine Freunde</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendRow}
            onPress={() => navigation.navigate("Chat", { chatId: null, otherUser: { id: item.uid, name: item.displayName } })}
          >
            <Text style={styles.friendName}>{item.displayName}</Text>
            <Text style={styles.friendUsername}>@{item.username}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Du hast noch keine Freunde. Tippe auf "Hinzufuegen", um jemanden zu finden.
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
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  header: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  addIcon: {
    color: colors.primary,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  requestRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  requestName: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  acceptText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  declineText: {
    color: colors.text,
    fontSize: 13,
  },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  friendUsername: {
    color: colors.textMuted,
    fontSize: 13,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 20,
  },
});
