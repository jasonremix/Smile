import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilteredMedia from "../components/FilteredMedia";
import FilterPickerRow from "../components/FilterPickerRow";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { listenCircles } from "../services/circleService";
import { listenFriends } from "../services/friendService";
import { sendSnap } from "../services/snapService";
import { postStory } from "../services/storyService";
import { colors } from "../theme/colors";

const TIMER_OPTIONS = [1, 3, 5, 10];

export default function SnapPreviewScreen({ route, navigation }) {
  const { uri, mediaType, intent, filter: initialFilter } = route.params;
  const isStory = intent === "story";
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [circles, setCircles] = useState([]);
  const [activeCircleId, setActiveCircleId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [duration, setDuration] = useState(5);
  const [storyVisibility, setStoryVisibility] = useState("friends"); // "friends" | "custom" | "close"
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState(initialFilter || "none");
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenCircles(user.uid, setCircles);
    return unsubscribe;
  }, [user.uid]);

  const toggleFriend = (uid) => {
    setActiveCircleId(null);
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // "Enge Freunde" ist technisch dieselbe "custom"-Sichtbarkeit wie "Nur
  // ausgewaehlte" - nur wird die Auswahl aus der in CloseFriendsScreen.js
  // gepflegten Liste vorausgefuellt. Die Person kann sie danach noch anpassen.
  const selectCloseFriends = () => {
    setStoryVisibility("close");
    setActiveCircleId(null);
    setSelected(user?.closeFriends || []);
  };

  // Eigene Kreise (CirclesScreen.js) sind genau dasselbe Prinzip wie "Enge
  // Freunde" oben, nur mit beliebig vielen, selbst benannten Listen statt
  // einer einzigen festen - technisch weiterhin "custom"-Sichtbarkeit mit
  // visibleTo, nur die Vorauswahl kommt aus dem gewaehlten Kreis.
  const selectCircle = (circle) => {
    setStoryVisibility("custom");
    setActiveCircleId(circle.id);
    setSelected(circle.memberUids || []);
  };

  const isCustomVisibility = storyVisibility === "custom" || storyVisibility === "close";
  const showFriendPicker = !isStory || isCustomVisibility;

  const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
  const pollPayload =
    showPoll && pollQuestion.trim() && validPollOptions.length >= 2
      ? { question: pollQuestion.trim().slice(0, 100), options: validPollOptions.slice(0, 4) }
      : null;

  const handleSend = async () => {
    if (isStory && isCustomVisibility && selected.length === 0) return;
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
          visibility: isCustomVisibility ? "custom" : storyVisibility,
          visibleTo: isCustomVisibility ? selected : [],
          filter,
          poll: pollPayload,
        });
      } else {
        await sendSnap({
          senderId: user.uid,
          senderName: user.displayName,
          recipientIds: selected,
          localUri: uri,
          mediaType,
          viewDuration: duration,
          filter,
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
    sending || (isStory ? isCustomVisibility && selected.length === 0 : selected.length === 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.mediaContainer}>
        <FilteredMedia
          uri={uri}
          mediaType={mediaType}
          filterId={filter}
          style={styles.media}
          videoProps={{ shouldPlay: true, isLooping: true }}
        />

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={16} color="#fff" />
        </TouchableOpacity>

        <FilterPickerRow value={filter} onChange={setFilter} style={styles.filterRow} />

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
                Alle Connections
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
                Nur ausgewählte
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.visibilityChip,
                storyVisibility === "close" && styles.visibilityChipActive,
              ]}
              onPress={selectCloseFriends}
            >
              <Text
                style={[
                  styles.visibilityText,
                  storyVisibility === "close" && styles.visibilityTextActive,
                ]}
              >
                Enge Freunde
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isStory ? (
          <TouchableOpacity style={styles.pollToggle} onPress={() => setShowPoll((v) => !v)}>
            <Icon name="chat" size={14} color={colors.creator} />
            <Text style={styles.pollToggleText}>
              {showPoll ? "Umfrage entfernen" : "Umfrage hinzufügen"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {isStory && showPoll ? (
          <View style={styles.pollBox}>
            <TextInput
              style={styles.pollInput}
              placeholder="Frage (z.B. Pizza oder Pasta?)"
              placeholderTextColor={colors.textMuted}
              value={pollQuestion}
              onChangeText={(t) => setPollQuestion(t.slice(0, 100))}
            />
            {pollOptions.map((opt, i) => (
              <TextInput
                key={i}
                style={styles.pollInput}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={colors.textMuted}
                value={opt}
                onChangeText={(t) =>
                  setPollOptions((prev) => prev.map((o, idx) => (idx === i ? t.slice(0, 40) : o)))
                }
              />
            ))}
            {pollOptions.length < 4 ? (
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={() => setPollOptions((prev) => [...prev, ""])}
              >
                <Text style={styles.addOptionText}>+ Weitere Option</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {isStory && circles.length > 0 ? (
          <FlatList
            data={circles}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.circleRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.circleChip, activeCircleId === item.id && styles.circleChipActive]}
                onPress={() => selectCircle(item)}
              >
                <Text
                  style={[
                    styles.circleChipText,
                    activeCircleId === item.id && styles.circleChipTextActive,
                  ]}
                >
                  {item.emoji || "💜"} {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
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
                <Text style={styles.emptyText}>Du hast noch keine Connections hinzugefuegt.</Text>
              }
            />
          </>
        ) : null}

        <PrimaryButton
          title={
            isStory
              ? "Als Moment teilen"
              : `Senden ${selected.length > 0 ? `(${selected.length})` : ""}`
          }
          onPress={handleSend}
          disabled={sendDisabled}
          loading={sending}
          style={styles.sendButton}
        />
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
  filterRow: {
    position: "absolute",
    bottom: 16,
    width: "100%",
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
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
    color: colors.onPrimary,
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
    borderRadius: 18,
    paddingVertical: 12,
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
    color: colors.onPrimary,
  },
  pollToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  pollToggleText: {
    color: colors.creator,
    fontSize: 13,
    fontWeight: "700",
  },
  pollBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  pollInput: {
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  addOptionButton: {
    alignSelf: "flex-start",
  },
  addOptionText: {
    color: colors.creator,
    fontSize: 12,
    fontWeight: "600",
  },
  circleRow: {
    marginBottom: 12,
  },
  circleChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
  },
  circleChipActive: {
    backgroundColor: colors.primary,
  },
  circleChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  circleChipTextActive: {
    color: colors.onPrimary,
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
    marginTop: 12,
  },
});
