import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import GradientView from "./GradientView";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";
import { spacing } from "../theme/spacing";

// Flacher, iOS-naeher gestalteter Haupt-Button: dezenter Farbverlauf statt
// platter Flaeche fuer etwas mehr Tiefe, aber bewusst weiterhin kein
// Glanz-Streifen/starker Glow und kein Scale-Pop beim Druecken - nur
// Press-Dimming, naeher an einem nativen UIButton als an einem auffaelligen
// Marketing-Button.
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
      {isOutline ? null : (
        <GradientView
          colors={[colors.primaryLight, colors.primaryDark]}
          style={StyleSheet.absoluteFill}
        />
      )}
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
    overflow: "hidden",
  },
  solid: {
    ...shadow.sm,
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
