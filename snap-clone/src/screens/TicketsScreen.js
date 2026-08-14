import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { closeTicket, createTicket, escalateTicket, listenMyTickets } from "../services/ticketService";
import { TICKET_CATEGORIES } from "../utils/ticketBot";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const SUBJECT_MAX = 100;
const MESSAGE_MAX = 1000;

const STATUS_META = {
  bot_resolved: { label: "Bot-Antwort erhalten", color: colors.primaryLight },
  escalated: { label: "An Gründer weitergeleitet", color: colors.online },
  closed: { label: "Geschlossen", color: colors.textMuted },
};

export default function TicketsScreen({ navigation }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState(TICKET_CATEGORIES[0].id);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const unsubscribe = listenMyTickets(user.uid, setTickets);
    return unsubscribe;
  }, [user.uid]);

  const resetForm = () => {
    setCategory(TICKET_CATEGORIES[0].id);
    setSubject("");
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const id = await createTicket({
        uid: user.uid,
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      resetForm();
      setCreating(false);
      setExpandedId(id);
    } catch (e) {
      Alert.alert("Fehler", "Ticket konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = (ticketId) => {
    Alert.alert(
      "An Gründer weiterleiten",
      "Das Ticket wird für die manuelle Durchsicht durch den Gründer (@jasonbuerger) markiert. Es gibt keine automatische Sofort-Benachrichtigung an ihn - er sieht sich weitergeleitete Tickets bei Gelegenheit in der Datenbank an.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Weiterleiten", onPress: () => escalateTicket(ticketId).catch(() => {}) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Support-Tickets" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Eröffne ein Ticket, wenn du Hilfe brauchst - z. B. bei einer Sperre, einem blockierten
          Inhalt oder Konto-Fragen. Ein regelbasierter Bot antwortet sofort; bei Bedarf kannst du
          danach an den Gründer weiterleiten.
        </Text>

        {creating ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>Kategorie</Text>
            <View style={styles.categoryRow}>
              {TICKET_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryChip, category === c.id && styles.categoryChipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Icon
                    name={c.icon}
                    size={13}
                    color={category === c.id ? colors.text : colors.textMuted}
                    style={styles.categoryIcon}
                  />
                  <Text style={[styles.categoryText, category === c.id && styles.categoryTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Betreff</Text>
            <TextInput
              style={styles.input}
              placeholder="Kurz zusammengefasst"
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={(t) => setSubject(t.slice(0, SUBJECT_MAX))}
            />

            <Text style={styles.sectionLabel}>Beschreibung</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Was ist passiert?"
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, MESSAGE_MAX))}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {message.length}/{MESSAGE_MAX}
            </Text>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setCreating(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <PrimaryButton
                title="Ticket senden"
                onPress={handleSubmit}
                disabled={!subject.trim() || !message.trim()}
                loading={submitting}
                style={styles.submitButton}
              />
            </View>
          </View>
        ) : (
          <PrimaryButton title="Neues Ticket" onPress={() => setCreating(true)} style={styles.newButton} />
        )}

        <Text style={[styles.sectionLabel, styles.listLabel]}>Deine Tickets</Text>
        {tickets.length === 0 ? (
          <Text style={styles.emptyText}>Noch keine Tickets eröffnet.</Text>
        ) : (
          tickets.map((t) => {
            const isExpanded = expandedId === t.id;
            const status = STATUS_META[t.status] || STATUS_META.bot_resolved;
            const categoryLabel = TICKET_CATEGORIES.find((c) => c.id === t.category)?.label || t.category;
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.ticketCard}
                onPress={() => setExpandedId(isExpanded ? null : t.id)}
                activeOpacity={0.8}
              >
                <View style={styles.ticketHeaderRow}>
                  <Text style={styles.ticketSubject} numberOfLines={isExpanded ? undefined : 1}>
                    {t.subject}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                </View>
                <Text style={styles.ticketMeta}>
                  {categoryLabel} · {status.label}
                </Text>

                {isExpanded ? (
                  <View style={styles.expandedBlock}>
                    <Text style={styles.ticketMessage}>{t.message}</Text>
                    <View style={styles.botBlock}>
                      <Text style={styles.botLabel}>Bot-Antwort</Text>
                      <Text style={styles.botText}>{t.botResponse}</Text>
                    </View>
                    {t.status !== "closed" ? (
                      <View style={styles.ticketActions}>
                        {!t.escalatedToFounder ? (
                          <TouchableOpacity style={styles.actionButton} onPress={() => handleEscalate(t.id)}>
                            <Text style={styles.actionText}>An Gründer weiterleiten</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.escalatedNote}>
                            Wird von Jason Bürger (@jasonbuerger) geprüft, sobald er Zeit hat.
                          </Text>
                        )}
                        <TouchableOpacity
                          style={styles.actionButtonSecondary}
                          onPress={() => closeTicket(t.id).catch(() => {})}
                        >
                          <Text style={styles.actionTextSecondary}>Als erledigt schließen</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })
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
  newButton: {
    marginBottom: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  listLabel: {
    marginTop: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    color: colors.textMuted,
    ...typography.caption,
  },
  categoryTextActive: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surfaceLight,
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
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    ...typography.body,
  },
  submitButton: {
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  ticketHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ticketSubject: {
    flex: 1,
    color: colors.text,
    ...typography.subhead,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketMeta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  expandedBlock: {
    marginTop: spacing.md,
  },
  ticketMessage: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
  },
  botBlock: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  botLabel: {
    color: colors.primaryLight,
    ...typography.caption,
    marginBottom: 4,
  },
  botText: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
  },
  ticketActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  actionText: {
    color: colors.text,
    ...typography.subhead,
  },
  actionButtonSecondary: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  actionTextSecondary: {
    color: colors.textMuted,
    ...typography.subhead,
  },
  escalatedNote: {
    color: colors.online,
    ...typography.caption,
    lineHeight: 16,
  },
});
