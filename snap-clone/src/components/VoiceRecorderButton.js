import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

const MIN_DURATION_MS = 700;

// Sprachnachrichten (Beta) - expo-audio (Nachfolger von expo-av, siehe
// utils/soundEffects.js) ist bereits fuer Video-Wiedergabe im Einsatz und
// damit in allen aktuell verteilten Builds nativ vorhanden, braucht also
// anders als expo-location keinen soft-load. Tap zum Starten/Stoppen statt
// Halten - zuverlaessiger auf beiden Plattformen als eine Press-and-Hold-
// Geste.
export default function VoiceRecorderButton({ onRecorded, disabled }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const timerRef = useRef(null);

  const startRecording = async () => {
    if (disabled || isRecording) return;
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Kein Zugriff", "Nata braucht Mikrofon-Zugriff für Sprachnachrichten.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startRef.current = Date.now();
      setElapsedMs(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startRef.current), 200);
    } catch (e) {
      Alert.alert("Fehler", "Aufnahme konnte nicht gestartet werden.");
    }
  };

  const stopRecording = async (shouldSend) => {
    if (!isRecording) return;
    clearInterval(timerRef.current);
    const duration = Date.now() - startRef.current;
    setIsRecording(false);
    setElapsedMs(0);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (shouldSend && duration >= MIN_DURATION_MS && uri) {
        onRecorded(uri, duration);
      }
    } catch (e) {
      // Aufnahme verworfen - nichts weiter zu tun.
    }
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <View style={styles.recordingRow}>
        <View style={styles.recordDot} />
        <Text style={styles.recordingText}>{formatTime(elapsedMs)}</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => stopRecording(false)} hitSlop={8}>
          <Icon name="close" size={14} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendVoiceButton} onPress={() => stopRecording(true)}>
          <Icon name="send" size={15} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.micButton} onPress={startRecording} disabled={disabled}>
      <Icon name="mic" size={17} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    height: 42,
    gap: spacing.sm,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recordingText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    minWidth: 32,
  },
  cancelButton: {
    padding: spacing.sm,
  },
  sendVoiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
