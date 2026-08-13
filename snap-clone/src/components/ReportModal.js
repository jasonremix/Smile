import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { REPORT_REASONS } from "../services/moderationService";
import { colors } from "../theme/colors";

// Wiederverwendbarer Melden-Dialog. `visible`/`onClose` steuern die
// Sichtbarkeit, `onSubmit(reasonId)` wird mit der gewaehlten Begruendung
// aufgerufen.
export default function ReportModal({ visible, onClose, onSubmit, title = "Inhalt melden" }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (reasonId) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(reasonId);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Warum meldest du das?</Text>

          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={styles.reasonRow}
              onPress={() => handleSelect(reason.id)}
              disabled={submitting}
            >
              <Text style={styles.reasonText}>{reason.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelText}>Abbrechen</Text>
          </TouchableOpacity>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  reasonRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reasonText: {
    color: colors.text,
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 15,
  },
});
