import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ReportModal from "../components/ReportModal";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import {
  acceptFriendRequest,
  declineFriendRequest,
  listenFriends,
  listenIncomingRequests,
} from "../services/friendService";
import { blockUser, listenBlockedUsers, reportContent } from "../services/moderationService";
import { hapticSuccess } from "../utils/haptics";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { avatarColorForUid } from "../theme/avatarPalette";

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

  const handleAccept = (req) => {
    hapticSuccess();
    acceptFriendRequest(req, currentUserForAccept);
  };

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
      <ScreenHeader
        title="Connections"
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate("Discovery")} style={styles.headerActionButton}>
              <Icon name="search" size={19} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("AddFriends")}>
              <Icon name="plus" size={19} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.content}>
      {visibleRequests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Anfragen {visibleRequests.length}
          </Text>
          {visibleRequests.map((req) => (
            <View key={req.id} style={styles.requestRow}>
              <View style={[styles.avatar, { backgroundColor: avatarColorForUid(req.from) }]}>
                <Text style={styles.avatarText}>{(req.fromDisplayName || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.requestTextBlock}>
                <Text style={styles.requestName}>{req.fromDisplayName}</Text>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(req)}
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
            <View style={[styles.avatar, { backgroundColor: avatarColorForUid(item.uid) }]}>
              <Text style={styles.avatarText}>{(item.displayName || "?").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.friendTextBlock}>
              <Text style={styles.friendName}>{item.displayName}</Text>
              <Text style={styles.friendUsername}>@{item.username}</Text>
            </View>
            <Icon name="chat" size={16} color={colors.textMuted} />
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
      </View>

      <ReportModal
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title={reportTarget ? `${reportTarget.displayName} melden` : "Melden"}
        targetDisplayName={reportTarget?.displayName}
        onSubmit={(report) =>
          reportContent({
            reporterId: user.uid,
            targetType: "user",
            targetUserId: reportTarget.uid,
            targetDisplayName: reportTarget.displayName,
            ...report,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  requestTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  requestActions: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  acceptText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  declineText: {
    color: colors.text,
    fontSize: 13,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendTextBlock: {
    flex: 1,
    marginLeft: 12,
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
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  emptyButtonText: {
    color: colors.primaryDark,
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
