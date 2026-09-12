import React, { useEffect, useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { createCircle, deleteCircle, MAX_CIRCLE_NAME_LENGTH, updateCircle } from "../services/circleService";
import { listenFriends } from "../services/friendService";
import { hapticSelection } from "../utils/haptics";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const EMOJI_OPTIONS = ["💜", "👨‍👩‍👧‍👦", "🎉", "💼", "🎮", "🎵", "⚽", "📚", "✨", "🏡"];

export default function CircleEditScreen({ navigation, route }) {
  const { user } = useAuth();
  const existing = route.params?.circle || null;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name || "");
  const [emoji, setEmoji] = useState(existing?.emoji || EMOJI_OPTIONS[0]);
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(() => new Set(existing?.memberUids || []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  const toggleFriend = (uid) => {
    hapticSelection();
    const next = new Set(selected);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelected(next);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      if (isEditing) {
        await updateCircle(user.uid, existing.id, { name: trimmed, emoji, memberUids: [...selected] });
      } else {
        await createCircle(user.uid, { name: trimmed, emoji, memberUids: [...selected] });
      }
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert("Fehler", "Der Kreis konnte nicht gespeichert werden. Versuch's noch mal.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Kreis löschen?", `"${existing.name}" wird dauerhaft entfernt.`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteCircle(user.uid, existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title={isEditing ? "Kreis bearbeiten" : "Neuer Kreis"} />
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.nameInput}
          placeholder="Name des Kreises (z.B. Familie)"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={(t) => setName(t.slice(0, MAX_CIRCLE_NAME_LENGTH))}
          maxLength={MAX_CIRCLE_NAME_LENGTH}
        />

        <Text style={styles.sectionLabel}>Symbol</Text>
        <View style={styles.emojiRow}>
          {EMOJI_OPTIONS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiChip, emoji === e && styles.emojiChipActive]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.emojiChipText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Wer ist in diesem Kreis?</Text>
        <FlatList
          data={friends}
          keyExtractor={(item) => item.uid}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.uid);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => toggleFriend(item.uid)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.avatar, { backgroundColor: item.avatarColor || colors.primary }]}>
                  <Text style={styles.avatarText}>{(item.displayName || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{item.displayName}</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected ? <Icon name="check" size={11} color={colors.onPrimary} /> : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>Du hast noch keine Connections hinzugefügt.</Text>}
        />

        <PrimaryButton
          title={isEditing ? "Speichern" : "Kreis erstellen"}
          onPress={handleSave}
          disabled={!name.trim() || saving}
          loading={saving}
          style={styles.saveButton}
        />

        {isEditing ? (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Kreis löschen</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  nameInput: {
    color: colors.text,
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiChipActive: {
    borderColor: colors.primary,
  },
  emojiChipText: {
    fontSize: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
  },
  name: {
    flex: 1,
    color: colors.text,
    ...typography.body,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  deleteButtonText: {
    color: colors.danger,
    ...typography.subhead,
    fontWeight: "600",
  },
});
