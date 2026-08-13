import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

// Verifizierungs-Haken - das "verified"-Feld wird nirgends in den Firestore-
// Regeln als client-schreibbar gefuehrt, kann also nur von Hand ueber die
// Admin-API vergeben werden, nie von Nutzern selbst.
export default function VerifiedBadge({ size = 16, style }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.check, { fontSize: size * 0.65 }]}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  check: {
    color: colors.text,
    fontWeight: "900",
  },
});
