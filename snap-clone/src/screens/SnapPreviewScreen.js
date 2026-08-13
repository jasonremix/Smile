import { Video } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { sendSnap } from "../services/snapService";
import { postStory } from "../services/storyService";
import { colors } from "../theme/colors";

const TIMER_OPTIONS = [1, 3, 5, 10];

export default function SnapPreviewScreen({ route, navigation }) {
  const { uri, mediaType, intent } = route.params;
  const isStory = intent === "story";
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [duration, setDuration] = useState(5);
  const [storyVisibility, setStoryVisibility] = useState("friends"); // "friends" | "custom"
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  const toggleFriend = (uid) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const showFriendPicker = !isStory || storyVisibility === "custom";

  const handleSend = async () => {
    if (isStory && storyVisibility === "custom" && selected.length === 0) return;
    if (!isStory && selected.length === 0) return;

    setSending(true);
    try {
      if (isStory) {
        await postStory({
          uid: user.uid,
          displayName: user.displayName,
          avatarColor: user.avatarColor,
          localUri: uri,
          mediaType,
          visibility: storyVisibility,
          visibleTo: storyVisibility === "custom" ? selected : [],
        });
      } else {
        await sendSnap({
          senderId: user.uid,
          senderName: user.displayName,
          recipientIds: selected,
          localUri: uri,
          mediaType,
          viewDuration: duration,
        });
      }
      navigation.popToTop();
    } catch (e) {
      setSending(false);
      Alert.alert(
        "Senden fehlgeschlagen",
        "Der Upload hat nicht geklappt. Bitte pruefe deine Internetverbindung und versuch's erneut."
      );
    }
  };

  const sendDisabled =
    sending || (isStory ? storyVisibility === "custom" && selected.length === 0 : selected.length === 0);

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        {mediaType === "video" ? (
          <Video source={{ uri }} style={styles.media} resizeMode="cover" shouldPlay isLooping />
        ) : (
          <Image source={{ uri }} style={styles.media} />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {isStory ? null : (
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((seconds) => (
              <TouchableOpacity
                key={seconds}
                style={[styles.timerChip, duration === seconds && styles.timerChipActive]}
                onPress={() => setDuration(seconds)}
              >
                <Text style={[styles.timerText, duration === seconds && styles.timerTextActive]}>
                  {seconds}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.recipientsPanel}>
        {isStory ? (
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[
                styles.visibilityChip,
                storyVisibility === "friends" && styles.visibilityChipActive,
              ]}
              onPress={() => setStoryVisibility("friends")}
            >
              <Text
                style={[
                  styles.visibilityText,
                  storyVisibility === "friends" && styles.visibilityTextActive,
                ]}
              >
                👥 Alle Freunde
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.visibilityChip,
                storyVisibility === "custom" && styles.visibilityChipActive,
              ]}
              onPress={() => setStoryVisibility("custom")}
            >
              <Text
                style={[
                  styles.visibilityText,
                  storyVisibility === "custom" && styles.visibilityTextActive,
                ]}
              >
                🔒 Nur ausgewählte
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showFriendPicker ? (
          <>
            <Text style={styles.panelTitle}>
              {isStory ? "Sichtbar für" : "An wen senden?"}
            </Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.uid}
              style={{ maxHeight: 220 }}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item.uid);
                return (
                  <TouchableOpacity style={styles.friendRow} onPress={() => toggleFriend(item.uid)}>
                    <Text style={styles.friendName}>{item.displayName}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Du hast noch keine Freunde hinzugefuegt.</Text>
              }
            />
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sendDisabled}
        >
          {sending ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.sendButtonText}>
              {isStory
                ? "An meine Story posten ➤"
                : `Senden ${selected.length > 0 ? `(${selected.length})` : ""} ➤`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mediaContainer: {
    flex: 1,
  },
  media: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 56,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
  },
  timerRow: {
    position: "absolute",
    top: 56,
    right: 16,
    flexDirection: "row",
  },
  timerChip: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 6,
  },
  timerChipActive: {
    backgroundColor: colors.primary,
  },
  timerText: {
    color: "#fff",
    fontSize: 12,
  },
  timerTextActive: {
    color: colors.text,
    fontWeight: "700",
  },
  recipientsPanel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  visibilityRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  visibilityChip: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginRight: 8,
  },
  visibilityChipActive: {
    backgroundColor: colors.primary,
  },
  visibilityText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  visibilityTextActive: {
    color: colors.text,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendName: {
    color: colors.text,
    fontSize: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textMuted,
    paddingVertical: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
});
