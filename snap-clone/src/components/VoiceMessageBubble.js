import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Wiedergabe fuer Sprachnachrichten (Beta) - der Player startet ohne Quelle
// (source: null) und laedt die eigentliche Datei erst beim ersten Antippen
// per replace(), damit nicht jede Sprachnachricht in einem Chat sofort beim
// Oeffnen im Hintergrund geladen wird.
export default function VoiceMessageBubble({ voiceUrl, durationMs = 0 }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const loadedRef = useRef(false);

  const handlePress = () => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      player.replace({ uri: voiceUrl });
      player.play();
      return;
    }
    if (status.playing) {
      player.pause();
    } else {
      if (status.duration > 0 && status.currentTime >= status.duration) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const isPlaying = status.playing;
  const positionMs = status.currentTime * 1000;
  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.playButton}>
        <Icon name={isPlaying ? "pause" : "play"} size={13} color={colors.bubbleMine} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.duration}>{formatTime(positionMs > 0 ? positionMs : durationMs)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 160,
    gap: 10,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  duration: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    minWidth: 30,
  },
});
