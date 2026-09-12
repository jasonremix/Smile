import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { createChallenge, listenActiveChallenges } from "../services/challengeService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const FOUNDER_UID = "O4xRu9e0qFRfnzsmgKWLNjE6r9U2";

function daysLeft(endAt) {
  const ms = (endAt?.toMillis?.() || 0) - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function ChallengesScreen({ navigation }) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState("7");

  useEffect(() => {
    const unsubscribe = listenActiveChallenges(setChallenges);
    return unsubscribe;
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const parsedDays = Math.min(90, Math.max(1, parseInt(days, 10) || 7));
    setCreating(true);
    try {
      await createChallenge(user.uid, { title, description, days: parsedDays });
      setTitle("");
      setDescription("");
      setDays("7");
      setShowForm(false);
    } catch (e) {
      Alert.alert("Fehler", "Challenge konnte nicht erstellt werden.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Challenges" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.introRow}>
          <Text style={styles.intro}>
            Zeitlich begrenzte Themen-Challenges - poste dazu und sieh, wer sonst noch mitmacht.
          </Text>
          <BetaBadge />
        </View>

        {user.uid === FOUNDER_UID ? (
          showForm ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Titel (z.B. Sonnenuntergangs-Woche)"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Kurze Beschreibung (optional)"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Dauer in Tagen (z.B. 7)"
                placeholderTextColor={colors.textMuted}
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title="Erstellen"
                  onPress={handleCreate}
                  loading={creating}
                  disabled={!title.trim()}
                  style={styles.createButton}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newButton} onPress={() => setShowForm(true)}>
              <Icon name="plus" size={14} color={colors.primaryLight} />
              <Text style={styles.newButtonText}>Neue Challenge erstellen</Text>
            </TouchableOpacity>
          )
        ) : null}

        {challenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="flame" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>Gerade läuft keine Challenge.</Text>
          </View>
        ) : (
          challenges.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => navigation.navigate("ChallengeFeed", { tag: c.id, title: c.title })}
              activeOpacity={0.85}
            >
              <View style={styles.cardIcon}>
                <Icon name="flame" size={18} color={colors.creator} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                {c.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {c.description}
                  </Text>
                ) : null}
                <Text style={styles.cardMeta}>Noch {daysLeft(c.endAt)} Tage</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  introRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  intro: { flex: 1, color: colors.textMuted, ...typography.footnote, lineHeight: 19 },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.35)",
  },
  newButtonText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
  },
  textarea: { minHeight: 60, textAlignVertical: "top" },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  cancelButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { color: colors.textMuted, fontWeight: "600" },
  createButton: { flex: 2 },
  emptyState: { alignItems: "center", paddingVertical: spacing.xxxl },
  emptyText: { color: colors.textMuted, ...typography.footnote, marginTop: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.creatorSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { color: colors.text, ...typography.subhead, fontWeight: "700" },
  cardDescription: { color: colors.textMuted, ...typography.caption, marginTop: 2 },
  cardMeta: { color: colors.creator, ...typography.caption, marginTop: 4, fontWeight: "600" },
  chevron: { color: colors.textMuted, fontSize: 20 },
});
