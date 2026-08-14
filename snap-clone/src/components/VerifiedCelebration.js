import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "./PrimaryButton";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { markVerifiedSeen } from "../services/userService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// "verified" wird ausschliesslich per Admin-Zugriff gesetzt (siehe
// firestore.rules), nie durch eine eigene Aktion waehrend der laufenden
// Session - anders als beim Level-Aufstieg reicht hier also kein Vergleich
// mit einem vorherigen In-Memory-Wert. Ein persistenter "verifiedSeen"-Flag
// (verified && !verifiedSeen) entscheidet, ob die Feier noch aussteht.
//
// WICHTIG: verifiedSeen wird erst gesetzt, wenn die Person den Dialog aktiv
// wegtippt - NICHT schon beim blossen Anzeigen-Versuch. Grund: ein
// automatischer Reload (z.B. durch den OTA-Update-Check in App.js) kann
// diese Komponente im Hintergrund neu mounten, ohne dass die Person gerade
// hinschaut. Wuerde man dort sofort "gesehen" markieren, waere die einmalige
// Glueckwunsch-Chance fuer immer verloren, ohne dass sie je sichtbar war
// (genau das ist der Vorgaenger-Bug gewesen). Ein echtes Modal mit
// Pflicht-Tap ist dafuer robuster als ein zeitgesteuertes Overlay.
export default function VerifiedCelebration() {
  const { user } = useAuth();
  const [dismissing, setDismissing] = useState(false);

  const pending = !!user?.uid && !!user.verified && !user.verifiedSeen;
  const visible = pending && !dismissing;

  useEffect(() => {
    if (!pending) setDismissing(false);
  }, [pending]);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await markVerifiedSeen(user.uid);
    } catch {
      // Schlaegt das Quittieren fehl (z.B. kein Netz), bleibt verifiedSeen
      // unset - der Dialog kommt dann beim naechsten Start einfach wieder,
      // was hier das sicherere Verhalten ist als ihn fuer immer zu verlieren.
      setDismissing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <VerifiedBadge size={44} style={styles.badge} />
          <Text style={styles.title}>Herzlichen Glückwunsch!</Text>
          <Text style={styles.subtitle}>Dein Konto ist jetzt verifiziert.</Text>
          <PrimaryButton title="Super!" onPress={handleDismiss} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
  },
  badge: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.title,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  button: {
    width: "100%",
  },
});
