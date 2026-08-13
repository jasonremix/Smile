import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

export default function StoryCircle({ label, color, viewed, onPress, isSelf }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[
          styles.ring,
          { borderColor: viewed ? colors.border : colors.primary },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: color || colors.primary }]}>
          <Text style={styles.avatarText}>{(label || "?").charAt(0).toUpperCase()}</Text>
        </View>
        {isSelf ? (
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>+</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 72,
    marginRight: 4,
  },
  ring: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 18,
  },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 14,
  },
  label: {
    color: colors.text,
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
});
