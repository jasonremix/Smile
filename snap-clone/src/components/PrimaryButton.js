import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

// Flacher, iOS-naeher gestalteter Haupt-Button: kraeftige Fuellfarbe, kein
// Glanz-Streifen/starker Farb-Glow mehr, nur ein dezenter Schatten und ein
// einfaches Press-Dimming statt Scale-Animation - naeher an einem nativen
// UIButton, ohne dabei den Lila-Ton zu veraendern.
export default function PrimaryButton({ title, onPress, disabled, loading, style, variant = "solid" }) {
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outline : styles.solid,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.text} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    paddingVertical: spacing.lg - 1,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 17,
  },
  textOutline: {
    color: colors.primary,
  },
});
