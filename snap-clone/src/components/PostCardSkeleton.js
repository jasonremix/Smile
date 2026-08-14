import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

// Platzhalter waehrend die erste Seite eines Feeds laedt - reine
// View-Animation (kein Gradient-/Shimmer-Paket, um kein neues natives
// Modul zu brauchen), pulsiert sanft zwischen zwei Opacity-Werten.
function Block({ style }) {
  return <View style={style} />;
}

export default function PostCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.header}>
        <Block style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Block style={styles.lineShort} />
          <Block style={styles.lineTiny} />
        </View>
      </View>
      <Block style={styles.lineFull} />
      <Block style={styles.lineMedium} />
    </Animated.View>
  );
}

export function PostCardSkeletonList({ count = 3 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.md,
  },
  lineShort: {
    width: "40%",
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginBottom: 6,
  },
  lineTiny: {
    width: "24%",
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.surfaceLight,
  },
  lineFull: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginBottom: 8,
  },
  lineMedium: {
    width: "70%",
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
  },
});
