import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { listenBlockedUsers, unblockUser } from "../services/moderationService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

export default function BlockedUsersScreen() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    const unsubscribe = listenBlockedUsers(user.uid, setBlocked);
    return unsubscribe;
  }, [user.uid]);

  const handleUnblock = (target) => {
    Alert.alert(
      "Entsperren",
      `${target.displayName || "Diese Person"} wieder entsperren?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entsperren",
          onPress: () => unblockUser(user.uid, target.uid),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={blocked}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.displayName}</Text>
              {item.username ? <Text style={styles.username}>@{item.username}</Text> : null}
            </View>
            <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblock(item)}>
              <Text style={styles.unblockText}>Entsperren</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Du hast noch niemanden blockiert.</Text>
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
    fontSize: 15,
  },
  username: {
    color: colors.textMuted,
    fontSize: 13,
  },
  unblockButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  unblockText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
});
