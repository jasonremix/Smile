import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import NataScoreCard from "../components/NataScoreCard";
import PostCard from "../components/PostCard";
import SettingsRow from "../components/SettingsRow";
import StatusEditor from "../components/StatusEditor";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { listenUserPosts } from "../services/postService";
import { clearStatus, isStatusActive, setStatus } from "../services/userService";
import { colors } from "../theme/colors";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const isModal = navigation.canGoBack();
  const [posts, setPosts] = useState([]);
  const [statusEditorVisible, setStatusEditorVisible] = useState(false);
  const activeStatus = isStatusActive(user?.status) ? user.status : null;

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenUserPosts(user.uid, setPosts);
    return unsubscribe;
  }, [user?.uid]);

  const handleLogout = () => {
    Alert.alert("Abmelden", "Moechtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Abmelden", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {isModal ? (
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={16} color={colors.text} />
        </TouchableOpacity>
      ) : null}

      <FlatList
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <PostCard post={item} navigation={navigation} />
          </View>
        )}
        ListHeaderComponent={
          <View style={{ alignItems: "center" }}>
            <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
              <Text style={styles.avatarText}>{(user?.displayName || "?").charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{user?.displayName}</Text>
              {user?.verified ? <VerifiedBadge size={18} style={styles.verifiedBadge} /> : null}
            </View>
            <Text style={styles.username}>@{user?.username}</Text>

            <TouchableOpacity style={styles.statusRow} onPress={() => setStatusEditorVisible(true)}>
              <Icon name="sparkle" size={13} color={colors.primaryLight} />
              <Text style={styles.statusText} numberOfLines={1}>
                {activeStatus ? activeStatus.text : "Was ist gerade los?"}
              </Text>
            </TouchableOpacity>

            {user?.betaTesterNumber ? (
              <View style={styles.testerBadge}>
                <Text style={styles.testerBadgeText}>Beta-Tester #{user.betaTesterNumber}</Text>
              </View>
            ) : null}

            <NataScoreCard
              score={user?.nataScore ?? 0}
              onPress={() => navigation.navigate("ScoreHistory")}
            />
            <View style={{ height: 24 }} />

            <View style={{ width: "100%" }}>
              <SettingsRow icon="people" label="Connections verwalten" onPress={() => navigation.navigate("Friends")} />
              <SettingsRow icon="search" label="Entdecken" onPress={() => navigation.navigate("Discovery")} />
              <SettingsRow icon="grid" label="Mein Nata-Code" onPress={() => navigation.navigate("QRCode")} />
              <SettingsRow icon="ticket" label="Einladungen" onPress={() => navigation.navigate("Referral")} />
              <SettingsRow icon="lock" label="Privatsphäre" onPress={() => navigation.navigate("Privacy")} />
              <SettingsRow
                icon="document"
                label="Datenschutz & Nutzungsbedingungen"
                onPress={() => navigation.navigate("Legal")}
              />
              <SettingsRow
                icon="chat"
                label="Feedback geben"
                onPress={() => navigation.navigate("Feedback")}
                badge={<BetaBadge style={styles.feedbackBadge} />}
              />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Abmelden</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => navigation.navigate("DeleteAccount")}
            >
              <Text style={styles.deleteAccountText}>Konto löschen</Text>
            </TouchableOpacity>

            <Text style={styles.postsHeading}>Meine Beitraege</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Noch keine Beitraege.</Text>}
      />

      <StatusEditor
        visible={statusEditorVisible}
        onClose={() => setStatusEditorVisible(false)}
        currentText={activeStatus?.text}
        onSave={(text) => setStatus(user.uid, text)}
        onClear={() => clearStatus(user.uid)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  postWrapper: {
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    left: 16,
    zIndex: 1,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarText: {
    color: "#000",
    fontSize: 36,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  displayName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  verifiedBadge: {
    marginTop: 2,
  },
  username: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    maxWidth: "90%",
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  testerBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  testerBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "700",
  },
  feedbackBadge: {
    marginRight: 8,
  },
  logoutButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 15,
  },
  deleteAccountButton: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  deleteAccountText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  postsHeading: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginTop: 28,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
});
