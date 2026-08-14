import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { listenAnnouncements } from "../services/adminService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const STORAGE_KEY = "nata:lastSeenAnnouncementId";
const AUTO_HIDE_MS = 6000;

// Gleiches Prinzip wie UpdateAnnouncementBanner.js: rein lokal per
// AsyncStorage gemerkt, welche Ankuendigung schon gezeigt wurde - es gibt
// KEINE Push-/E-Mail-Benachrichtigung, der Banner erscheint nur, wenn
// jemand die App gerade offen hat/oeffnet.
export default function FounderAnnouncementBanner() {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef(null);
  const translateY = useRef(new Animated.Value(-140)).current;
  const shownIdRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenAnnouncements(async (items) => {
      const latest = items[0];
      if (!latest || shownIdRef.current === latest.id) return;
      try {
        const lastSeenId = await AsyncStorage.getItem(STORAGE_KEY);
        if (lastSeenId === latest.id) return;
        shownIdRef.current = latest.id;
        setCurrent(latest);
        show();
        await AsyncStorage.setItem(STORAGE_KEY, latest.id);
      } catch {
        // Reiner Komfort-Hinweis - bei einem Speicherfehler passiert sonst nichts.
      }
    });
    return unsubscribe;
  }, []);

  const show = () => {
    setVisible(true);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    hideTimeoutRef.current = setTimeout(hide, AUTO_HIDE_MS);
  };

  const hide = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    Animated.timing(translateY, { toValue: -140, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };

  if (!visible || !current) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.banner} onPress={hide} activeOpacity={0.9}>
        <Text style={styles.title} numberOfLines={1}>
          {current.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={3}>
          {current.message}
        </Text>
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
    borderColor: colors.primary,
  },
  title: {
    color: colors.primary,
    ...typography.subhead,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 17,
  },
});
