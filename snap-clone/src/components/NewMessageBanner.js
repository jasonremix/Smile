import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { navigationRef } from "../navigation/navigationRef";
import { listenChats } from "../services/chatService";
import { getActiveChatId } from "../state/activeChat";
import { colors } from "../theme/colors";

function toMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : 0;
}

const AUTO_HIDE_MS = 4000;

// Kurzer In-App-Banner fuer neue Chat-Nachrichten, solange man sich woanders
// in der App befindet - ein Ersatz fuer echte Push-Benachrichtigungen, die
// den kostenpflichtigen Firebase Blaze-Plan brauchen wuerden (noch nicht
// aktiviert).
export default function NewMessageBanner() {
  const { user } = useAuth();
  const [banner, setBanner] = useState(null);
  const knownUpdatedAt = useRef(new Map());
  const hasLoadedOnce = useRef(false);
  const hideTimeoutRef = useRef(null);
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenChats(user.uid, (chats) => {
      const previous = knownUpdatedAt.current;
      const next = new Map();

      for (const chat of chats) {
        const updatedMs = toMillis(chat.updatedAt);
        next.set(chat.id, updatedMs);

        if (!hasLoadedOnce.current) continue;
        if (!chat.lastSenderId || chat.lastSenderId === user.uid) continue;
        if (chat.id === getActiveChatId()) continue;
        if (updatedMs <= (previous.get(chat.id) || 0)) continue;

        const otherId = chat.participants.find((id) => id !== user.uid);
        showBanner({
          chatId: chat.id,
          otherUser: { id: otherId, name: chat.participantNames?.[otherId] || "Jemand" },
          message: chat.lastMessage,
        });
      }

      knownUpdatedAt.current = next;
      hasLoadedOnce.current = true;
    });

    return unsubscribe;
  }, [user?.uid]);

  const showBanner = (data) => {
    setBanner(data);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    hideTimeoutRef.current = setTimeout(hideBanner, AUTO_HIDE_MS);
  };

  const hideBanner = () => {
    Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }).start(() => {
      setBanner(null);
    });
  };

  const handlePress = () => {
    if (!banner) return;
    const { chatId, otherUser } = banner;
    hideBanner();
    if (navigationRef.isReady()) {
      navigationRef.navigate("Chat", { chatId, otherUser });
    }
  };

  if (!banner) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.banner} onPress={handlePress} activeOpacity={0.9}>
        <Text style={styles.name}>{banner.otherUser.name}</Text>
        <Text numberOfLines={1} style={styles.message}>
          {banner.message}
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
    marginHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    color: colors.text,
    fontSize: 14,
  },
});
