import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "./Icon";
import { INCIDENT_TIMINGS, REPORT_REASONS } from "../services/moderationService";
import { generateIncidentReportPdf } from "../utils/incidentReportPdf";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const DESCRIPTION_MAX = 1000;

// Mehrstufiger Melden-Dialog: 1) Kategorie waehlen, 2) strukturiert
// beschreiben was/wann passiert ist, 3) Bestaetigung mit optionalem
// PDF-Vorfallsbericht zum Herunterladen. `onSubmit({ reason, description,
// incidentTiming })` uebernimmt das eigentliche Speichern der Meldung.
export default function ReportModal({
  visible,
  onClose,
  onSubmit,
  title = "Inhalt melden",
  targetDisplayName,
}) {
  const [step, setStep] = useState("reason"); // "reason" | "details" | "done"
  const [reason, setReason] = useState(null);
  const [description, setDescription] = useState("");
  const [incidentTiming, setIncidentTiming] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const reset = () => {
    setStep("reason");
    setReason(null);
    setDescription("");
    setIncidentTiming(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectReason = (reasonId) => {
    setReason(reasonId);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ reason, description: description.trim(), incidentTiming });
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await generateIncidentReportPdf({
        targetDisplayName,
        reasonLabel: REPORT_REASONS.find((r) => r.id === reason)?.label,
        description,
        incidentTimingLabel: INCIDENT_TIMINGS.find((t) => t.id === incidentTiming)?.label,
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const reasonLabel = REPORT_REASONS.find((r) => r.id === reason)?.label;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {step === "reason" ? (
            <>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Warum meldest du das?</Text>

              {REPORT_REASONS.map((r) => (
                <TouchableOpacity key={r.id} style={styles.reasonRow} onPress={() => handleSelectReason(r.id)}>
                  <Text style={styles.reasonText}>{r.label}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {step === "details" ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.backRow} onPress={() => setStep("reason")}>
                <Icon name="back" size={14} color={colors.textMuted} />
                <Text style={styles.backText}>{reasonLabel}</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Was ist passiert?</Text>
              <Text style={styles.subtitle}>
                Bitte so genau wie möglich beschreiben - hilft uns, deine Meldung richtig
                einzuordnen.
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="z.B. Wer hat was gemacht, in welchem Zusammenhang..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESCRIPTION_MAX))}
                multiline
                autoFocus
              />
              <Text style={styles.counter}>
                {description.length}/{DESCRIPTION_MAX}
              </Text>

              <Text style={styles.fieldLabel}>Wann ist das passiert?</Text>
              <View style={styles.timingRow}>
                {INCIDENT_TIMINGS.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.timingChip, incidentTiming === t.id && styles.timingChipActive]}
                    onPress={() => setIncidentTiming(t.id)}
                  >
                    <Text
                      style={[
                        styles.timingChipText,
                        incidentTiming === t.id && styles.timingChipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, !description.trim() && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!description.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.submitButtonText}>Meldung absenden</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={submitting}>
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}

          {step === "done" ? (
            <View style={styles.doneBlock}>
              <View style={styles.doneIconCircle}>
                <Icon name="check" size={22} color={colors.online} />
              </View>
              <Text style={styles.title}>Meldung gesendet</Text>
              <Text style={styles.subtitle}>
                Danke - wir prüfen das. Du kannst dir deine Meldung als PDF speichern, z.B. um sie
                selbst aufzubewahren oder weiterzugeben.
              </Text>

              <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPdf} disabled={generatingPdf}>
                {generatingPdf ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Icon name="document" size={16} color={colors.text} style={{ marginRight: spacing.sm }} />
                    <Text style={styles.pdfButtonText}>Vorfallsbericht als PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Fertig</Text>
              </TouchableOpacity>
            </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: "88%",
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
    lineHeight: 18,
    marginBottom: 16,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reasonText: {
    color: colors.text,
    fontSize: 15,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 18,
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
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.textMuted,
    ...typography.footnote,
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
    ...typography.body,
  },
  counter: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "right",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    color: colors.text,
    ...typography.subhead,
    marginBottom: spacing.sm,
  },
  timingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  timingChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  timingChipActive: {
    backgroundColor: colors.primary,
  },
  timingChipText: {
    color: colors.textMuted,
    ...typography.footnote,
    fontWeight: "600",
  },
  timingChipTextActive: {
    color: colors.onPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: colors.onPrimary,
    ...typography.subhead,
    fontWeight: "700",
  },
  doneBlock: {
    alignItems: "center",
  },
  doneIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.online}22`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: "100%",
    marginTop: spacing.md,
  },
  pdfButtonText: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "600",
  },
});
