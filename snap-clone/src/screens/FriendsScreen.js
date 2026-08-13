import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../context/AuthContext";
import {
  acceptFriendRequest,
  declineFriendRequest,
  listenFriends,
  listenIncomingRequests,
} from "../services/friendService";
import { blockUser, listenBlockedUsers, reportContent } from "../services/moderationService";
import { colors } from "../theme/colors";

export default function FriendsScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    const unsubFriends = listenFriends(user.uid, setFriends);
    const unsubRequests = listenIncomingRequests(user.uid, setRequests);
    const unsubBlocked = listenBlockedUsers(user.uid, setBlocked);
    return () => {
      unsubFriends();
      unsubRequests();
      unsubBlocked();
    };
  }, [user.uid]);

  const blockedIds = useMemo(() => new Set(blocked.map((b) => b.uid)), [blocked]);
  const visibleRequests = requests.filter((r) => !blockedIds.has(r.from));

  const currentUserForAccept = { uid: user.uid, displayName: user.displayName, username: user.username };

  const handleLongPressFriend = (friend) => {
    Alert.alert(friend.displayName, "Was möchtest du tun?", [
      { text: "Melden", onPress: () => setReportTarget(friend) },
      {
        text: "Blockieren",
        style: "destructive",
        onPress: () => confirmBlock(friend),
      },
      { text: "Abbrechen", style: "cancel" },
    ]);
  };

  const confirmBlock = (friend) => {
    Alert.alert(
      "Blockieren",
      `${friend.displayName} blockieren? Ihr seid danach keine Connections mehr und seht euch gegenseitig nicht mehr.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Blockieren",
          style: "destructive",
          onPress: () => blockUser(user.uid, friend),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Connections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate("Discovery")} style={styles.headerActionButton}>
            <Icon name="search" size={19} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addRow} onPress={() => navigation.navigate("AddFriends")}>
            <Icon name="plus" size={16} color={colors.primary} />
            <Text style={styles.addIcon}>Hinzufuegen</Text>
          </TouchableOpacity>
        </View>
      </View>

      {visibleRequests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verbindungsanfragen</Text>
          {visibleRequests.map((req) => (
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

      <Text style={styles.sectionTitle}>Meine Connections</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendRow}
            onPress={() => navigation.navigate("Chat", { chatId: null, otherUser: { id: item.uid, name: item.displayName } })}
            onLongPress={() => handleLongPressFriend(item)}
          >
            <Text style={styles.friendName}>{item.displayName}</Text>
            <Text style={styles.friendUsername}>@{item.username}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people" size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Noch keine Connections</Text>
            <Text style={styles.emptyText}>Finde Menschen, mit denen du dich verbinden moechtest.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate("Discovery")}>
              <Text style={styles.emptyButtonText}>Menschen entdecken</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.blockedLink}
        onPress={() => navigation.navigate("BlockedUsers")}
      >
        <Text style={styles.blockedLinkText}>Blockierte Nutzer verwalten</Text>
      </TouchableOpacity>

      <ReportModal
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title={reportTarget ? `${reportTarget.displayName} melden` : "Melden"}
        onSubmit={(reason) =>
          reportContent({
            reporterId: user.uid,
            targetType: "user",
            targetUserId: reportTarget.uid,
            reason,
          })
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    marginRight: 18,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addIcon: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
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
    color: colors.text,
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
  emptyState: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  emptyButtonText: {
    color: colors.primaryLight,
    fontWeight: "700",
    fontSize: 13,
  },
  blockedLink: {
    paddingVertical: 16,
    alignItems: "center",
  },
  blockedLinkText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
