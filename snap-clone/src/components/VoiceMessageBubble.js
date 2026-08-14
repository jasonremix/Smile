import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Wiedergabe fuer Sprachnachrichten (Beta) - laedt den Sound erst beim
// ersten Antippen, danach pausiert/spielt dieselbe Instanz weiter.
export default function VoiceMessageBubble({ voiceUrl, durationMs = 0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handleStatusUpdate = (status) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis || 0);
    setIsPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
    }
  };

  const handlePress = async () => {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        if (status.positionMillis >= status.durationMillis) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
      }
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: voiceUrl },
      { shouldPlay: true },
      handleStatusUpdate
    );
    soundRef.current = sound;
  };

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
