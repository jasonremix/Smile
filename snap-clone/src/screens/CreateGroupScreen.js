import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { createGroup } from "../services/groupService";
import { getRestrictionAlert, getRestrictionStatus, recordStrike } from "../services/moderationService";
import { checkContent, getBlockAlert } from "../utils/contentFilter";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

export default function CreateGroupScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  const toggleFriend = (uid) => {
    setSelected((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]));
  };

  const canCreate = name.trim().length > 0 && selected.length >= 1 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    const restriction = getRestrictionStatus(user);
    if (restriction.restricted) {
      const alertInfo = getRestrictionAlert(restriction);
      Alert.alert(alertInfo.title, alertInfo.message);
      return;
    }
    const check = checkContent(name.trim());
    if (check.blocked) {
      const alertInfo = getBlockAlert(check.reason);
      Alert.alert(alertInfo.title, alertInfo.message);
      if (check.reason !== "self_harm") recordStrike(user, check.reason);
      return;
    }
    setCreating(true);
    try {
      const members = friends.filter((f) => selected.includes(f.uid));
      const groupId = await createGroup({
        creatorUid: user.uid,
        creatorName: user.displayName,
        name: name.trim(),
        members,
      });
      navigation.replace("GroupChat", { groupId, groupName: name.trim() });
    } catch (e) {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Gruppenname"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.sectionTitle}>Mitglieder auswählen</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.uid);
          return (
            <TouchableOpacity style={styles.friendRow} onPress={() => toggleFriend(item.uid)}>
              <Text style={styles.friendName}>{item.displayName}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Du hast noch keine Connections hinzugefuegt.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={!canCreate}
      >
        {creating ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.createButtonText}>
            Gruppe erstellen {selected.length > 0 ? `(${selected.length + 1})` : ""}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendName: {
    color: colors.text,
    fontSize: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 12,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
});
