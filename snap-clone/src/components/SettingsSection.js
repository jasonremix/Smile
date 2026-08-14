import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

// Fasst mehrere SettingsRow-Elemente zu einer durchgehenden, abgerundeten
// iOS-Gruppenliste zusammen (statt jeder Zeile ihre eigene schwebende,
// beschattete Karte zu geben) - reicht "isLast" an die letzte Zeile weiter,
// damit nur dort die Trennlinie wegfaellt.
export default function SettingsSection({ children }) {
  const items = React.Children.toArray(children);
  return (
    <View style={styles.section}>
      {items.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { isLast: index === items.length - 1 })
          : child
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
