import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import {
  MAX_LINKS,
  listenMyVerificationRequest,
  submitVerificationRequest,
} from "../services/verificationService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const STATUS_META = {
  pending: { label: "Wird geprüft", color: colors.primaryDark },
  approved: { label: "Angenommen", color: colors.online },
  rejected: { label: "Abgelehnt", color: colors.danger },
};

export default function VerificationRequestScreen({ navigation }) {
  const { user } = useAuth();
  const [request, setRequest] = useState(undefined); // undefined = laedt noch
  const [reason, setReason] = useState("");
  const [links, setLinks] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = listenMyVerificationRequest(user.uid, setRequest);
    return unsubscribe;
  }, [user.uid]);

  const updateLink = (index, value) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Begründung fehlt", "Bitte kurz erklären, warum du verifiziert werden möchtest.");
      return;
    }
    setSubmitting(true);
    try {
      await submitVerificationRequest(user.uid, {
        username: user.username,
        displayName: user.displayName,
        reason,
        links: links.slice(0, MAX_LINKS),
      });
    } catch (e) {
      Alert.alert("Fehler", "Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.verified) {
    return (
      <View style={styles.container}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Verifizierung" />
        <View style={styles.centerState}>
          <VerifiedBadge size={40} />
          <Text style={styles.centerTitle}>Du bist bereits verifiziert</Text>
        </View>
      </View>
    );
  }

  if (request === undefined) {
    return (
      <View style={styles.container}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Verifizierung" />
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      </View>
    );
  }

  if (request && request.status !== "rejected") {
    const meta = STATUS_META[request.status] || STATUS_META.pending;
    return (
      <View style={styles.container}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Verifizierung" />
        <View style={styles.centerState}>
          <Icon name="shield" size={36} color={meta.color} />
          <Text style={styles.centerTitle}>{meta.label}</Text>
          <Text style={styles.centerText}>
            {request.status === "pending"
              ? "Deine Anfrage liegt beim Gründer zur Prüfung. Das kann etwas dauern - wir melden uns hier, sobald es eine Entscheidung gibt."
              : "Deine Anfrage wurde angenommen."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Verifizierung" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.introRow}>
          <Text style={styles.intro}>
            Erzähl kurz, warum dein Konto den blauen Haken bekommen sollte, und hinterlege optional
            Links als Nachweis (z. B. Website, andere Profile). Der Gründer sieht sich jede Anfrage
            persönlich an.
          </Text>
          <BetaBadge />
        </View>

        {request?.status === "rejected" ? (
          <View style={styles.rejectedBlock}>
            <Text style={styles.rejectedTitle}>Deine letzte Anfrage wurde abgelehnt</Text>
            {request.founderNote ? (
              <Text style={styles.rejectedNote}>„{request.founderNote}“</Text>
            ) : null}
            <Text style={styles.rejectedHint}>Du kannst unten eine neue Anfrage einreichen.</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Begründung</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Warum solltest du verifiziert werden?"
          placeholderTextColor={colors.textMuted}
          value={reason}
          onChangeText={(t) => setReason(t.slice(0, 500))}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{reason.length}/500</Text>

        <Text style={styles.label}>Nachweis-Links (optional)</Text>
        {links.map((link, i) => (
          <TextInput
            key={i}
            style={styles.input}
            placeholder={`Link ${i + 1} (z. B. https://...)`}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={link}
            onChangeText={(t) => updateLink(i, t)}
          />
        ))}

        <PrimaryButton
          title="Anfrage senden"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  introRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  intro: {
    flex: 1,
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 19,
  },
  rejectedBlock: {
    backgroundColor: `${colors.danger}18`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  rejectedTitle: {
    color: colors.text,
    ...typography.subhead,
  },
  rejectedNote: {
    color: colors.textMuted,
    ...typography.footnote,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  rejectedHint: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: spacing.sm,
  },
  label: {
    color: colors.text,
    ...typography.subhead,
    marginBottom: spacing.sm,
  },
  textarea: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 100,
    ...typography.body,
  },
  counter: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "right",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  centerState: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  centerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  centerText: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 19,
  },
});
