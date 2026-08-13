import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

// Modernisierter Haupt-Button: kraeftige Farbe, weicher Farb-Glow-Schatten
// statt harter Kanten, ein duenner Glanz-Streifen oben fuer etwas Tiefe ohne
// eine native Gradient-Library zu brauchen (die wuerde die schon gebaute
// Standalone-APK ohne neuen nativen Build kaputt machen), und ein deutlich
// spuerbares Press-Feedback.
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
      {!isOutline ? <View style={styles.sheen} /> : null}
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
    borderRadius: 32,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  solid: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  text: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  textOutline: {
    color: colors.primary,
  },
});
