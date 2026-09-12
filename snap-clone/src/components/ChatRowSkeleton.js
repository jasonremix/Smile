import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

// Platzhalter-Zeile waehrend die erste Chat-Liste laedt - gleiches
// Puls-Prinzip wie PostCardSkeleton (reine View-Animation, kein
// Shimmer-Paket noetig), nur im schlanken Zeilen-Format der Chat-Liste.
function Block({ style }) {
  return <View style={style} />;
}

function ChatRowSkeleton() {
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
    <Animated.View style={[styles.row, { opacity }]}>
      <Block style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Block style={styles.lineShort} />
        <Block style={styles.lineLong} />
      </View>
    </Animated.View>
  );
}

export function ChatRowSkeletonList({ count = 6 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <ChatRowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.md,
  },
  lineShort: {
    width: "36%",
    height: 13,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    marginBottom: 8,
  },
  lineLong: {
    width: "62%",
    height: 11,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
  },
});
