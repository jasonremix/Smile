import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useBetaCountdown } from "../hooks/useBetaCountdown";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import Icon from "./Icon";

// Bewusst als schmale Pille statt grosser Karte - soll sofort auffallen,
// ohne den Home-Feed mit einem weiteren vollbreiten Block zuzustellen (der
// Gruender wollte den Feed insgesamt uebersichtlicher, nicht voller).
// Antippbar -> fuehrt zur Roadmap, wo ehrlich steht, was nach dem 24.09.
// mit Konten/Daten geplant ist (statt die Frage offen im Raum stehen zu
// lassen).
export default function BetaCountdownBanner() {
  const navigation = useNavigation();
  const { expired, days, hours, minutes } = useBetaCountdown();

  const pulse = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
  }, [enter]);

  useEffect(() => {
    if (expired) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.delay(1400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [expired, pulse]);

  const label = expired
    ? "Beta beendet"
    : days > 0
    ? `Noch ${days} ${days === 1 ? "Tag" : "Tage"} Beta`
    : hours > 0
    ? `Noch ${hours} ${hours === 1 ? "Stunde" : "Stunden"} Beta`
    : `Noch ${minutes} ${minutes === 1 ? "Minute" : "Minuten"} Beta`;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        alignSelf: "flex-start",
      }}
    >
      <Pressable
        style={styles.pill}
        onPress={() => navigation.navigate("Roadmap")}
        accessibilityRole="button"
        accessibilityLabel={
          expired
            ? "Die Beta ist beendet. Antippen für mehr Informationen."
            : `Beta endet in ${days} Tagen, ${hours} Stunden und ${minutes} Minuten, am 24. September 2026. Antippen für mehr Informationen.`
        }
      >
        <Animated.View style={{ transform: [{ scale: expired ? 1 : pulse }] }}>
          <Icon name="warning" size={13} color={colors.primaryLight} />
        </Animated.View>
        <Text style={styles.text}>{expired ? label : `${label} · endet 24.09.`}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(147, 51, 234, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.4)",
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 6,
  },
  text: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "700",
  },
});
