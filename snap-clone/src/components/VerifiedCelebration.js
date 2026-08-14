import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { markVerifiedSeen } from "../services/userService";
import { colors } from "../theme/colors";

const SHOW_DURATION_MS = 2600;

// "verified" wird ausschliesslich per Admin-Zugriff gesetzt (siehe
// firestore.rules), nie durch eine eigene Aktion waehrend der laufenden
// Session - anders als beim Level-Aufstieg reicht hier also kein Vergleich
// mit einem vorherigen In-Memory-Wert. Stattdessen ein persistenter
// "verifiedSeen"-Flag: verified && !verifiedSeen loest die Feier genau
// einmal aus, danach quittiert der Client selbst mit markVerifiedSeen.
export default function VerifiedCelebration() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const triggeredRef = useRef(false);
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.uid || !user.verified || user.verifiedSeen) return;
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    markVerifiedSeen(user.uid).catch(() => {});

    setVisible(true);
    scale.setValue(0.5);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setVisible(false);
      });
    }, SHOW_DURATION_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.verified, user?.verifiedSeen]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <VerifiedBadge size={40} style={styles.badge} />
        <Text style={styles.title}>Herzlichen Glückwunsch!</Text>
        <Text style={styles.subtitle}>Dein Konto ist jetzt verifiziert</Text>
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
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  badge: {
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
