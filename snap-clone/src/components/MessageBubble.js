import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MessageReactionBadge from "./MessageReactionBadge";
import VoiceMessageBubble from "./VoiceMessageBubble";
import { colors } from "../theme/colors";

// Wiederverwendbare Nachrichtenblase fuer 1:1- und Gruppen-Chats -
// listenReactions/toggleReaction werden injiziert, damit dieselbe
// Komponente beide Backends (chats/… und groups/…) bedienen kann.
export default function MessageBubble({
  message,
  isMine,
  senderName,
  currentUid,
  onLongPress,
  listenReactions,
  toggleReaction,
}) {
  const [reactorUids, setReactorUids] = useState([]);

  useEffect(() => {
    const unsubscribe = listenReactions(message.id, setReactorUids);
    return unsubscribe;
  }, [message.id]);

  return (
    <View style={[styles.bubbleRow, isMine ? styles.rowRight : styles.rowLeft]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPress(message)}
        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
      >
        {!isMine && senderName ? <Text style={styles.senderName}>{senderName}</Text> : null}
        {message.voiceUrl ? (
          <VoiceMessageBubble voiceUrl={message.voiceUrl} durationMs={message.voiceDurationMs} />
        ) : (
          <Text style={styles.bubbleText}>{message.text}</Text>
        )}
        {message.edited ? <Text style={styles.editedLabel}>bearbeitet</Text> : null}
      </TouchableOpacity>
      <MessageReactionBadge
        reactorUids={reactorUids}
        currentUid={currentUid}
        onToggle={(isReacting) => toggleReaction(message.id, currentUid, isReacting)}
        align={isMine ? "right" : "left"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: {
    marginBottom: 8,
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleMine: {
    backgroundColor: colors.bubbleMine,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: colors.bubbleTheirs,
    borderBottomLeftRadius: 6,
  },
  senderName: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 15,
  },
  editedLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    marginTop: 2,
  },
});
