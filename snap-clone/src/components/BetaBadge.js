import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

// Kleines Label fuer experimentelle Beta-Funktionen, damit Tester wissen,
// dass hier noch aktiv dran gearbeitet wird.
export default function BetaBadge({ style }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>BETA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
