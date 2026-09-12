import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CreatorBadge from "../components/CreatorBadge";
import ScreenHeader from "../components/ScreenHeader";
import VerifiedBadge from "../components/VerifiedBadge";
import {
  MANUAL_RESTRICTION_PRESETS,
  listenAllUsers,
  setManualRestriction,
  toggleCreator,
  toggleVerified,
} from "../services/adminService";
import { formatRestrictionUntil, getRestrictionStatus } from "../services/moderationService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function FounderUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [expandedUid, setExpandedUid] = useState(null);
  const [busyUid, setBusyUid] = useState(null);

  useEffect(() => {
    const unsubscribe = listenAllUsers(setUsers);
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.displayNameLower?.includes(q) || u.username?.toLowerCase().includes(q)
    );
  }, [users, searchText]);

  const handleToggleVerified = async (u) => {
    setBusyUid(u.uid);
    try {
      await toggleVerified(u.uid, !u.verified);
    } catch (e) {
      Alert.alert("Fehler", "Konnte nicht geändert werden.");
    } finally {
      setBusyUid(null);
    }
  };

  const handleToggleCreator = async (u) => {
    setBusyUid(u.uid);
    try {
      await toggleCreator(u.uid, !u.isCreator);
    } catch (e) {
      Alert.alert("Fehler", "Konnte nicht geändert werden.");
    } finally {
      setBusyUid(null);
    }
  };

  const handleRestrict = (u, preset) => {
    Alert.alert(
      "Sperren",
      `${u.displayName} für ${preset.label} sperren?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Sperren",
          style: "destructive",
          onPress: async () => {
            setBusyUid(u.uid);
            try {
              await setManualRestriction(u.uid, preset.ms);
            } catch (e) {
              Alert.alert("Fehler", "Sperre konnte nicht gesetzt werden.");
            } finally {
              setBusyUid(null);
            }
          },
        },
      ]
    );
  };

  const handleLift = (u) => {
    setBusyUid(u.uid);
    setManualRestriction(u.uid, null)
      .catch(() => Alert.alert("Fehler", "Sperre konnte nicht aufgehoben werden."))
      .finally(() => setBusyUid(null));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Nutzer-Verwaltung" />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Nach Name oder @Benutzername suchen..."
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.map((u) => {
          const isExpanded = expandedUid === u.uid;
          const restriction = getRestrictionStatus(u);
          const busy = busyUid === u.uid;

          return (
            <TouchableOpacity
              key={u.uid}
              style={styles.card}
              onPress={() => setExpandedUid(isExpanded ? null : u.uid)}
              activeOpacity={0.8}
            >
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: u.avatarColor || colors.primary }]}>
                  <Text style={styles.avatarText}>{(u.displayName || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.textBlock}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{u.displayName}</Text>
                    {u.verified ? <VerifiedBadge size={13} style={styles.badge} /> : null}
                    {u.isCreator ? <CreatorBadge size={13} style={styles.badge} /> : null}
                  </View>
                  <Text style={styles.username}>@{u.username}</Text>
                  {restriction.restricted ? (
                    <Text style={styles.restrictedText}>
                      Gesperrt bis {formatRestrictionUntil(restriction.until)}
                    </Text>
                  ) : null}
                </View>
              </View>

              {isExpanded ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => handleToggleVerified(u)}
                    disabled={busy}
                  >
                    <Text style={styles.verifyButtonText}>
                      {u.verified ? "Verifizierung entfernen" : "Verifizieren"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.creatorButton}
                    onPress={() => handleToggleCreator(u)}
                    disabled={busy}
                  >
                    <Text style={styles.creatorButtonText}>
                      {u.isCreator ? "Creator-Modus entfernen" : "Zum Creator machen"}
                    </Text>
                  </TouchableOpacity>

                  {restriction.restricted ? (
                    <TouchableOpacity style={styles.liftButton} onPress={() => handleLift(u)} disabled={busy}>
                      <Text style={styles.liftButtonText}>Sperre aufheben</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.presetRow}>
                      {MANUAL_RESTRICTION_PRESETS.map((preset) => (
                        <TouchableOpacity
                          key={preset.id}
                          style={styles.presetChip}
                          onPress={() => handleRestrict(u, preset)}
                          disabled={busy}
                        >
                          <Text style={styles.presetChipText}>{preset.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    color: "#000",
    fontWeight: "800",
  },
  textBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    color: colors.text,
    ...typography.subhead,
  },
  badge: {
    marginLeft: 2,
  },
  username: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 1,
  },
  restrictedText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  verifyButtonText: {
    color: colors.onPrimary,
    ...typography.subhead,
  },
  creatorButton: {
    backgroundColor: colors.creator,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  creatorButtonText: {
    color: colors.background,
    ...typography.subhead,
  },
  liftButton: {
    backgroundColor: colors.online,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  liftButtonText: {
    color: colors.onPrimary,
    ...typography.subhead,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  presetChip: {
    backgroundColor: `${colors.danger}22`,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  presetChipText: {
    color: colors.danger,
    ...typography.caption,
    fontWeight: "700",
  },
});
