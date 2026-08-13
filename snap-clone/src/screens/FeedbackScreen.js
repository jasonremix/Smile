import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BetaBadge from "../components/BetaBadge";
import { useAuth } from "../context/AuthContext";
import { FEEDBACK_CATEGORIES, submitFeedback } from "../services/feedbackService";
import { colors } from "../theme/colors";

export default function FeedbackScreen({ navigation }) {
  const { user } = useAuth();
  const [category, setCategory] = useState("idea");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await submitFeedback({
        uid: user.uid,
        displayName: user.displayName,
        category,
        message: message.trim(),
      });
      Alert.alert("Danke! 👻", "Dein Feedback ist angekommen.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setSending(false);
      Alert.alert("Fehler", "Feedback konnte nicht gesendet werden. Bitte erneut versuchen.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Feedback geben</Text>
        <BetaBadge />
      </View>
      <Text style={styles.subtitle}>
        Nata ist gerade in der Beta-Phase. Sag uns, was gut läuft, was fehlt oder was kaputt ist.
      </Text>

      <View style={styles.categoryRow}>
        {FEEDBACK_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.categoryChip, category === c.id && styles.categoryChipActive]}
            onPress={() => setCategory(c.id)}
          >
            <Text
              style={[styles.categoryText, category === c.id && styles.categoryTextActive]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.textArea}
        placeholder="Erzähl uns davon..."
        placeholderTextColor={colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitButton, !message.trim() && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!message.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.submitButtonText}>Feedback senden</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    minHeight: 180,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
});
