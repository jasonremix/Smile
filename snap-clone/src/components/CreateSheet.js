import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";

const OPTIONS = [
  { id: "post", label: "Beitrag", subtitle: "Text mit deinen Connections teilen", icon: "document", screen: "CreatePost" },
  { id: "camera", label: "Kamera", subtitle: "Foto oder Video an Connections senden", icon: "camera", screen: "Camera" },
  { id: "moment", label: "Moment teilen", subtitle: "24 Stunden sichtbar", icon: "moment", screen: "Camera", intent: "story" },
];

// Zentraler Erstellen-Einstieg als Bottom-Sheet statt mehrerer verstreuter
// Buttons - haelt die Hauptnavigation ruhig.
export default function CreateSheet({ visible, onClose, navigation }) {
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 60 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 300, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleSelect = (option) => {
    onClose();
    navigation.navigate(option.screen, option.intent ? { intent: option.intent } : undefined);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        {OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => handleSelect(option)}
          >
            <View style={styles.iconCircle}>
              <Icon name={option.icon} size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{option.label}</Text>
              <Text style={styles.rowSubtitle}>{option.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  rowPressed: {
    backgroundColor: colors.surfaceLight,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}22`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
