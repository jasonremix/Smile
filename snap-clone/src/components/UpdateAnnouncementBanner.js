import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const STORAGE_KEY = "nata:lastSeenUpdateId";
const AUTO_HIDE_MS = 4000;

// Zeigt einmalig einen kurzen Hinweis, wenn die App gerade auf einem neuen
// OTA-Update laeuft (Updates.updateId hat sich seit dem letzten Start
// geaendert) - unabhaengig davon, ob das Update ueber den proaktiven Check
// in App.js oder erst beim naechsten normalen Start angewendet wurde. Beim
// allerersten jemals gespeicherten Start wird nichts gezeigt (kein
// "Update" beim Erstinstallieren).
export default function UpdateAnnouncementBanner() {
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    (async () => {
      const currentId = Updates.updateId;
      if (!currentId) return; // Entwicklungs-Build oder noch nie ein Update geladen.

      try {
        const lastSeenId = await AsyncStorage.getItem(STORAGE_KEY);
        if (lastSeenId && lastSeenId !== currentId) {
          show();
        }
        await AsyncStorage.setItem(STORAGE_KEY, currentId);
      } catch {
        // Reiner Komfort-Hinweis - bei einem Speicherfehler passiert sonst nichts.
      }
    })();
  }, []);

  const show = () => {
    setVisible(true);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    hideTimeoutRef.current = setTimeout(hide, AUTO_HIDE_MS);
  };

  const hide = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.banner} onPress={hide} activeOpacity={0.9}>
        <Text style={styles.title}>Nata wurde aktualisiert</Text>
        <Text style={styles.subtitle}>Du nutzt jetzt die neueste Version.</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  banner: {
    marginTop: 56,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.primary,
    ...typography.subhead,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.text,
    ...typography.footnote,
  },
});
