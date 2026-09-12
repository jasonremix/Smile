import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { listenFriendsStatuses } from "../services/userService";
import { colors } from "../theme/colors";

// "Was ist gerade los" - kurze Text-Status deiner Connections, kein
// Standort (dafuer waere ein natives Standort-Modul noetig, das die schon
// verteilte Standalone-App ohne neuen Build brechen wuerde). Blendet sich
// selbst aus, wenn gerade niemand einen aktiven Status hat.
export default function StatusStrip({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenFriendsStatuses(friends.map((f) => f.uid), setStatuses);
    return unsubscribe;
  }, [friends]);

  if (statuses.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Was ist gerade los</Text>
      <FlatList
        data={statuses}
        keyExtractor={(item) => item.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("UserProfile", { uid: item.uid })}
          >
            <View style={[styles.avatar, { backgroundColor: item.avatarColor || colors.primary }]}>
              <Text style={styles.avatarText}>{(item.displayName || "?").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.displayName}</Text>
              <Text style={styles.statusText} numberOfLines={1}>{item.status.text}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    width: 180,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
});
