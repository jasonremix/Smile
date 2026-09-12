import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GradientView from "./GradientView";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

export default function StoryCircle({ label, color, viewed, onPress, isSelf }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.ringOuter}>
        {viewed ? (
          <View style={[styles.ring, { borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: color || colors.primary }]}>
              <Text style={styles.avatarText}>{(label || "?").charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <GradientView
            colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
            style={styles.gradientRing}
          >
            <View style={styles.ringInnerBg}>
              <View style={[styles.avatar, { backgroundColor: color || colors.primary }]}>
                <Text style={styles.avatarText}>{(label || "?").charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          </GradientView>
        )}
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
  ringOuter: {
    width: 62,
    height: 62,
  },
  ring: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientRing: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  ringInnerBg: {
    width: "100%",
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
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
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: colors.onPrimary,
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
