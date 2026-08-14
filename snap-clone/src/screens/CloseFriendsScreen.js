import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { setCloseFriends } from "../services/userService";
import { hapticSelection } from "../utils/haptics";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Dauerhafte Liste statt jedes Mal einzeln auszuwaehlen: wer hier
// aktiviert ist, wird beim Teilen eines Moments in SnapPreviewScreen.js
// automatisch als Empfaenger vorausgewaehlt (ueber die bereits bestehende
// "custom"-Sichtbarkeit - technisch identisch, nur bequemer).
export default function CloseFriendsScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(() => new Set(user?.closeFriends || []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  const toggle = async (uid) => {
    hapticSelection();
    const next = new Set(selected);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelected(next);
    setSaving(true);
    try {
      await setCloseFriends(user.uid, [...next]);
    } finally {
      setSaving(false);
    }
  };

  const count = selected.size;

  return (
    <View style={styles.container}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        title="Enge Freunde"
        right={
          <TouchableOpacity onPress={() => navigation.navigate("CloseFriendsLocation")}>
            <Icon name="pin" size={18} color={colors.primaryLight} />
          </TouchableOpacity>
        }
      />
      <Text style={styles.intro}>
        {count > 0
          ? `${count} enge ${count === 1 ? "Freund:in" : "Freund:innen"} - werden beim Teilen eines Moments automatisch vorausgewählt.`
          : "Noch niemand ausgewählt. Aktiviere Connections unten, um sie beim Teilen eines Moments automatisch vorauszuwählen."}
      </Text>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.uid);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => toggle(item.uid)}
              disabled={saving}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.avatar, { backgroundColor: item.avatarColor || colors.primary }]}>
                <Text style={styles.avatarText}>{(item.displayName || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.name}>{item.displayName}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected ? <Icon name="check" size={11} color={colors.text} /> : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Du hast noch keine Connections hinzugefügt.</Text>
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
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
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
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
