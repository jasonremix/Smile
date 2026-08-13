import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import PrimaryButton from "./PrimaryButton";
import { colors } from "../theme/colors";

const SUGGESTIONS = ["Gerade unterwegs", "Gerade am Lernen", "Gerade frei", "Gerade beschaeftigt"];
const MAX_LENGTH = 60;

export default function StatusEditor({ visible, onClose, currentText, onSave, onClear }) {
  const [text, setText] = useState(currentText || "");

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onSave(trimmed);
    onClose();
  };

  const handleClear = async () => {
    await onClear();
    setText("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Was ist gerade los?</Text>
          <Text style={styles.subtitle}>
            Sichtbar fuer deine Connections, verschwindet nach ein paar Stunden von selbst. Kein
            Standort wird geteilt.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="z.B. Gerade am See"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={(t) => setText(t.slice(0, MAX_LENGTH))}
            autoFocus
          />
          <Text style={styles.counter}>{text.length}/{MAX_LENGTH}</Text>

          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => setText(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton title="Status teilen" onPress={handleSave} disabled={!text.trim()} />

          {currentText ? (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>Status entfernen</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 14,
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  clearButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 10,
  },
  clearText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
