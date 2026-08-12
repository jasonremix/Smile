import { Video } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isStory) return;
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid, isStory]);

  const toggleFriend = (uid) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSend = async () => {
    setSending(true);
    try {
      if (isStory) {
        await postStory({
          uid: user.uid,
          displayName: user.displayName,
          avatarColor: user.avatarColor,
          localUri: uri,
          mediaType,
        });
      } else {
        if (selected.length === 0) {
          setSending(false);
          return;
        }
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
    }
  };

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
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.sendButtonText}>An meine Story posten ➤</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.panelTitle}>An wen senden?</Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.uid}
              style={{ maxHeight: 260 }}
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

            <TouchableOpacity
              style={[styles.sendButton, selected.length === 0 && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={selected.length === 0 || sending}
            >
              {sending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.sendButtonText}>
                  Senden {selected.length > 0 ? `(${selected.length})` : ""} ➤
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
    color: "#000",
    fontWeight: "700",
  },
  recipientsPanel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
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
    color: "#000",
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
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
});
