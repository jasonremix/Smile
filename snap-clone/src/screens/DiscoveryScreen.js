import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { getFriendSuggestions } from "../services/discoveryService";
import { listenFriends, sendFriendRequest } from "../services/friendService";
import { listenBlockedUsers } from "../services/moderationService";
import { colors } from "../theme/colors";

export default function DiscoveryScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState([]);

  useEffect(() => {
    const unsubFriends = listenFriends(user.uid, setFriends);
    const unsubBlocked = listenBlockedUsers(user.uid, (b) => setBlocked(b.map((x) => x.uid)));
    return () => {
      unsubFriends();
      unsubBlocked();
    };
  }, [user.uid]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFriendSuggestions(user.uid, friends)
      .then((results) => {
        if (!cancelled) setSuggestions(results);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid, friends]);

  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => !blocked.includes(s.uid)),
    [suggestions, blocked]
  );

  const handleAdd = async (target) => {
    await sendFriendRequest(user, target);
    setSentTo((prev) => [...prev, target.uid]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Entdecken" />
      <View style={styles.content}>

      <TouchableOpacity style={styles.qrRow} onPress={() => navigation.navigate("QRCode")}>
        <Icon name="grid" size={20} color={colors.primary} style={styles.qrIcon} />
        <View style={styles.qrTextBlock}>
          <Text style={styles.qrTitle}>Mein Nata-Code</Text>
          <Text style={styles.qrSubtitle}>Zeigen oder scannen, um sich sofort zu vernetzen</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Vielleicht kennst du diese Person</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={visibleSuggestions}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => {
            const alreadySent = sentTo.includes(item.uid);
            return (
              <View style={styles.row}>
                <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { uid: item.uid })}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Text style={styles.mutual}>
                    {item.mutualCount} gemeinsame Connection{item.mutualCount === 1 ? "" : "s"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, alreadySent && styles.addButtonDisabled]}
                  onPress={() => handleAdd(item)}
                  disabled={alreadySent}
                >
                  <Text style={styles.addButtonText}>{alreadySent ? "Gesendet" : "Verbinden"}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Noch keine Vorschlaege. Sobald deine Connections mehr Connections haben, tauchen hier Empfehlungen auf.
            </Text>
          }
        />
      )}
      </View>
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
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  qrIcon: {
    marginRight: 14,
  },
  qrTextBlock: {
    flex: 1,
  },
  qrTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  qrSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    color: colors.text,
    fontWeight: "600",
  },
  mutual: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});
