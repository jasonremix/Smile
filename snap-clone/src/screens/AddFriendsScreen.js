import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { searchUsersByUsername, sendFriendRequest } from "../services/friendService";
import { listenBlockedUsers } from "../services/moderationService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";

export default function AddFriendsScreen() {
  const { user } = useAuth();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState([]);
  const [blockedIds, setBlockedIds] = useState(new Set());

  useEffect(() => {
    const unsubscribe = listenBlockedUsers(user.uid, (blocked) =>
      setBlockedIds(new Set(blocked.map((b) => b.uid)))
    );
    return unsubscribe;
  }, [user.uid]);

  const handleSearch = async (value) => {
    setTerm(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const found = await searchUsersByUsername(value, user.uid);
      setResults(found.filter((u) => !blockedIds.has(u.uid)));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (target) => {
    await sendFriendRequest(user, target);
    setSentTo((prev) => [...prev, target.uid]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Anzeigename oder Benutzername suchen..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={term}
        onChangeText={handleSearch}
      />

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => {
          const alreadySent = sentTo.includes(item.uid);
          return (
            <View style={styles.row}>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  {item.verified ? <VerifiedBadge size={14} /> : null}
                </View>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, alreadySent && styles.addButtonDisabled]}
                onPress={() => handleAdd(item)}
                disabled={alreadySent}
              >
                <Text style={styles.addButtonText}>{alreadySent ? "Gesendet" : "Hinzufuegen"}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          term.trim().length >= 2 && !loading ? (
            <Text style={styles.emptyText}>Keine Nutzer gefunden.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    ...shadow.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: colors.text,
    fontWeight: "600",
  },
  username: {
    color: colors.textMuted,
    fontSize: 13,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
});
