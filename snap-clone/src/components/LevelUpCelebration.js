import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";
import { getLevelInfo } from "../utils/nataLevel";
import { colors } from "../theme/colors";

const SHOW_DURATION_MS = 2200;

// Feiert einen Level-Aufstieg mit einer kurzen, ueberall sichtbaren
// Overlay-Animation - beim allerersten Laden wird nichts gefeiert (nur der
// Ausgangslevel gemerkt), sonst wuerde jeder App-Start faelschlich "Level
// erreicht" anzeigen.
export default function LevelUpCelebration() {
  const { user } = useAuth();
  const [celebrationLevel, setCelebrationLevel] = useState(null);
  const knownLevel = useRef(null);
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) return;
    const { level } = getLevelInfo(user.nataScore ?? 0);

    if (knownLevel.current === null) {
      knownLevel.current = level;
      return;
    }
    if (level > knownLevel.current) {
      knownLevel.current = level;
      showCelebration(level);
    } else {
      knownLevel.current = level;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.nataScore]);

  const showCelebration = (level) => {
    setCelebrationLevel(level);
    scale.setValue(0.5);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setCelebrationLevel(null);
      });
    }, SHOW_DURATION_MS);
  };

  if (!celebrationLevel) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Icon name="sparkle" size={34} color={colors.primaryLight} style={styles.emoji} />
        <Text style={styles.title}>Level {celebrationLevel}!</Text>
        <Text style={styles.subtitle}>Weiter so</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 44,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  emoji: {
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});
