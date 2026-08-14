import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GradientView from "./GradientView";
import MessageReactionBadge from "./MessageReactionBadge";
import VoiceMessageBubble from "./VoiceMessageBubble";
import { colors } from "../theme/colors";

// Wiederverwendbare Nachrichtenblase fuer 1:1- und Gruppen-Chats -
// listenReactions/toggleReaction werden injiziert, damit dieselbe
// Komponente beide Backends (chats/… und groups/…) bedienen kann.
function formatVisibleAt(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `heute, ${time} Uhr` : `${date.toLocaleDateString("de-DE")}, ${time} Uhr`;
}

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
  // Zeitkapsel-Nachricht: fuer alle ausser die sendende Person clientseitig
  // gesperrt, bis visibleAt erreicht ist. Ein Tick alle 15s reicht, damit die
  // Nachricht sichtbar wird, ohne auf eine neue Firestore-Aenderung warten
  // zu muessen (reines Zeit-Ereignis, kein Datenwechsel).
  const visibleAtMs = message.visibleAt?.toMillis ? message.visibleAt.toMillis() : null;
  const [nowMs, setNowMs] = useState(Date.now());
  const isLocked = !isMine && visibleAtMs && visibleAtMs > nowMs;

  useEffect(() => {
    if (!visibleAtMs || isMine) return;
    const interval = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(interval);
  }, [visibleAtMs, isMine]);

  useEffect(() => {
    const unsubscribe = listenReactions(message.id, setReactorUids);
    return unsubscribe;
  }, [message.id]);

  return (
    <View style={[styles.bubbleRow, isMine ? styles.rowRight : styles.rowLeft]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPress(message)}
        style={[styles.bubble, isMine ? styles.bubbleMineWrap : styles.bubbleTheirs]}
      >
        {isMine ? (
          <GradientView
            colors={[colors.bubbleMine, colors.primaryDark]}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {!isMine && senderName ? <Text style={styles.senderName}>{senderName}</Text> : null}
        {isLocked ? (
          <Text style={styles.bubbleText}>🕐 Zeitkapsel-Nachricht - sichtbar ab {formatVisibleAt(message.visibleAt)}</Text>
        ) : message.voiceUrl ? (
          <VoiceMessageBubble voiceUrl={message.voiceUrl} durationMs={message.voiceDurationMs} />
        ) : (
          <Text style={styles.bubbleText}>{message.text}</Text>
        )}
        {isMine && visibleAtMs && visibleAtMs > Date.now() ? (
          <Text style={styles.editedLabel}>⏳ wird sichtbar ab {formatVisibleAt(message.visibleAt)}</Text>
        ) : null}
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
  bubbleMineWrap: {
    borderBottomRightRadius: 6,
    overflow: "hidden",
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
