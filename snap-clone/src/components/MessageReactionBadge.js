import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";

// Kleine Reaktions-Pille unter einer Nachrichtenblase - ein einzelner
// Reaktionstyp (Herz) fuer die erste Version, bewusst einfach gehalten.
export default function MessageReactionBadge({ reactorUids, currentUid, onToggle, align }) {
  if (!reactorUids || reactorUids.length === 0) return null;
  const mine = reactorUids.includes(currentUid);

  return (
    <Pressable
      style={[styles.badge, align === "right" ? styles.alignRight : styles.alignLeft]}
      onPress={() => onToggle(!mine)}
    >
      <Icon name="heart" size={11} color={mine ? colors.primary : colors.textMuted} />
      <Text style={[styles.count, mine && styles.countActive]}>{reactorUids.length}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  alignLeft: {
    alignSelf: "flex-start",
  },
  alignRight: {
    alignSelf: "flex-end",
  },
  count: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  countActive: {
    color: colors.primary,
  },
});
