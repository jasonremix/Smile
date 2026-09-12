import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";
import { hapticSuccess } from "../utils/haptics";
import { getLevelIcon, getLevelInfo, getLevelName } from "../utils/nataLevel";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const SHOW_DURATION_MS = 2000;

// Feiert einen Level-Aufstieg mit einer kurzen, ruhigen Overlay-Anzeige -
// bewusst ohne Feder-/Bounce-Animation und ohne farbigen Glow-Schatten
// (wirkte vorher sehr verspielt/game-artig). Ein dezentes Einblenden statt
// ein "Pop" passt besser zu einem ruhigen, hochwertigen Gesamtbild. Beim
// allerersten Laden wird nichts gefeiert (nur der Ausgangslevel gemerkt),
// sonst wuerde jeder App-Start faelschlich "Level erreicht" anzeigen.
export default function LevelUpCelebration() {
  const { user } = useAuth();
  const [celebrationLevel, setCelebrationLevel] = useState(null);
  const knownLevel = useRef(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

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
    hapticSuccess();
    setCelebrationLevel(level);
    opacity.setValue(0);
    translateY.setValue(6);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setCelebrationLevel(null);
      });
    }, SHOW_DURATION_MS);
  };

  if (!celebrationLevel) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
        <Icon name={getLevelIcon(celebrationLevel)} size={24} color={colors.primary} style={styles.icon} />
        <Text style={styles.title}>Level {celebrationLevel}</Text>
        <Text style={styles.subtitle}>{getLevelName(celebrationLevel)}</Text>
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
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
    alignItems: "center",
    ...shadow.md,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.title,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
