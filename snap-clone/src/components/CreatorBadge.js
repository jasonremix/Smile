import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

// Creator-Abzeichen - bewusst warm/gold statt violett und mit einem Stern
// statt Haken, damit es auf einen Blick von VerifiedBadge unterscheidbar
// bleibt. Das "isCreator"-Feld ist client-seitig nicht schreibbar (siehe
// firestore.rules), wird also nur nach Gruender-Pruefung ueber die
// Creator-Anfrage vergeben.
export default function CreatorBadge({ size = 16, style }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.star, { fontSize: size * 0.62 }]}>★</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.creator,
    justifyContent: "center",
    alignItems: "center",
  },
  star: {
    color: colors.background,
    fontWeight: "900",
  },
});
