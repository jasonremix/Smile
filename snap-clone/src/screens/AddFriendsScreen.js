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
import { useAuth } from "../context/AuthContext";
import { searchUsersByUsername, sendFriendRequest } from "../services/friendService";
import { listenBlockedUsers } from "../services/moderationService";
import { colors } from "../theme/colors";

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
        placeholder="Nach Benutzername suchen..."
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
                <Text style={styles.name}>{item.displayName}</Text>
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
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
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
  username: {
    color: colors.textMuted,
    fontSize: 13,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceLight,
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
  },
});
