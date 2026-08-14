import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { createAnnouncement, deleteAnnouncement, listenAnnouncements } from "../services/adminService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const TITLE_MAX = 100;
const MESSAGE_MAX = 1000;

export default function FounderAnnouncementScreen({ navigation }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const unsubscribe = listenAnnouncements(setAnnouncements);
    return unsubscribe;
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || sending) return;
    setSending(true);
    try {
      await createAnnouncement(user.uid, { title: title.trim(), message: message.trim() });
      setTitle("");
      setMessage("");
      Alert.alert(
        "Gesendet",
        "Die Ankündigung ist gespeichert. Nutzer:innen sehen sie als Banner, sobald sie die App das nächste Mal öffnen - es gibt keine Push-Benachrichtigung."
      );
    } catch (e) {
      Alert.alert("Fehler", "Ankündigung konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  };

  const handleRetract = (id) => {
    Alert.alert("Zurückziehen", "Diese Ankündigung wird für alle entfernt.", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Zurückziehen", style: "destructive", onPress: () => deleteAnnouncement(id).catch(() => {}) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Ankündigung senden" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Erscheint als Banner beim nächsten App-Start aller Nutzer:innen. Keine Push- oder
          E-Mail-Benachrichtigung - dafür gibt es aktuell keine Cloud-Infrastruktur.
        </Text>

        <Text style={styles.sectionLabel}>Titel</Text>
        <TextInput
          style={styles.input}
          placeholder="Kurz und klar"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
        />

        <Text style={styles.sectionLabel}>Nachricht</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Was möchtest du mitteilen?"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={(t) => setMessage(t.slice(0, MESSAGE_MAX))}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.counter}>
          {message.length}/{MESSAGE_MAX}
        </Text>

        <PrimaryButton
          title="Senden"
          onPress={handleSend}
          disabled={!title.trim() || !message.trim()}
          loading={sending}
          style={styles.sendButton}
        />

        <Text style={[styles.sectionLabel, styles.historyLabel]}>Bisherige Ankündigungen</Text>
        {announcements.length === 0 ? (
          <Text style={styles.emptyText}>Noch keine gesendet.</Text>
        ) : (
          announcements.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardTime}>
                  {a.createdAt?.toDate ? timeAgo(a.createdAt.toDate()) : ""}
                </Text>
              </View>
              <Text style={styles.cardBody}>{a.message}</Text>
              <TouchableOpacity style={styles.retractButton} onPress={() => handleRetract(a.id)}>
                <Text style={styles.retractText}>Zurückziehen</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
  intro: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 19,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  historyLabel: {
    marginTop: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.lg,
  },
  textArea: {
    minHeight: 100,
    marginBottom: spacing.xs,
  },
  counter: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "right",
    marginBottom: spacing.lg,
  },
  sendButton: {
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    ...typography.subhead,
  },
  cardTime: {
    color: colors.textMuted,
    ...typography.caption,
  },
  cardBody: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  retractButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  retractText: {
    color: colors.danger,
    ...typography.caption,
    fontWeight: "700",
  },
});
