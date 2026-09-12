import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { getUserProfile } from "../services/userService";
import {
  liftRestriction,
  listenAllEscalatedTickets,
  respondToTicket,
} from "../services/ticketService";
import { formatRestrictionUntil, getRestrictionStatus } from "../services/moderationService";
import { TICKET_CATEGORIES } from "../utils/ticketBot";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const REPLY_MAX = 2000;

const STATUS_META = {
  escalated: { label: "Offen", color: colors.online },
  answered: { label: "Beantwortet", color: colors.primary },
  closed: { label: "Geschlossen", color: colors.textMuted },
};

const RESOLUTION_META = {
  accepted: { label: "Angenommen", color: colors.online },
  rejected: { label: "Abgelehnt", color: colors.danger },
};

// Nur ueber SettingsScreen erreichbar, wenn user.username === FOUNDER_USERNAME
// (siehe ticketService.js) - die eigentliche Durchsetzung passiert aber in
// firestore.rules per isFounder(), nicht hier: dieser Screen ist reine UI,
// kein Sicherheitsmechanismus fuer sich.
export default function FounderTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [replyText, setReplyText] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const unsubscribe = listenAllEscalatedTickets(setTickets);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const missing = [...new Set(tickets.map((t) => t.uid))].filter((uid) => !(uid in profiles));
    if (missing.length === 0) return;
    missing.forEach((uid) => {
      getUserProfile(uid)
        .then((profile) => setProfiles((prev) => ({ ...prev, [uid]: profile || false })))
        .catch(() => setProfiles((prev) => ({ ...prev, [uid]: false })));
    });
  }, [tickets, profiles]);

  const handleRespond = async (ticketId, { resolution, closeAfter }) => {
    const text = (replyText[ticketId] || "").trim();
    setBusyId(ticketId);
    try {
      await respondToTicket(ticketId, { founderResponse: text || undefined, resolution, closeAfter });
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (e) {
      Alert.alert("Fehler", "Aktion konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setBusyId(null);
    }
  };

  const handleLiftRestriction = (uid, ticketId) => {
    Alert.alert(
      "Sperre aufheben",
      "Die automatische Sperre dieser Person wird sofort aufgehoben. Die Strike-Historie bleibt erhalten.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Aufheben",
          onPress: async () => {
            setBusyId(ticketId);
            try {
              await liftRestriction(uid);
            } catch (e) {
              Alert.alert("Fehler", "Sperre konnte nicht aufgehoben werden.");
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Ticket-Verwaltung" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Alle an dich weitergeleiteten Tickets, über alle Nutzer:innen hinweg. Antworten, annehmen
          oder ablehnen wird sofort für die jeweilige Person sichtbar.
        </Text>

        {tickets.length === 0 ? (
          <Text style={styles.emptyText}>Aktuell keine weitergeleiteten Tickets.</Text>
        ) : (
          tickets.map((t) => {
            const isExpanded = expandedId === t.id;
            const status = STATUS_META[t.status] || STATUS_META.escalated;
            const categoryLabel = TICKET_CATEGORIES.find((c) => c.id === t.category)?.label || t.category;
            const profile = profiles[t.uid];
            const restriction = profile ? getRestrictionStatus(profile) : { restricted: false };
            const busy = busyId === t.id;

            return (
              <TouchableOpacity
                key={t.id}
                style={styles.ticketCard}
                onPress={() => setExpandedId(isExpanded ? null : t.id)}
                activeOpacity={0.8}
              >
                <View style={styles.headerRow}>
                  <Text style={styles.subject} numberOfLines={isExpanded ? undefined : 1}>
                    {t.subject}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                </View>
                <Text style={styles.meta}>
                  {categoryLabel} · {status.label} · von{" "}
                  {profile ? `${profile.displayName} (@${profile.username})` : "..."}
                </Text>

                {isExpanded ? (
                  <View style={styles.expandedBlock}>
                    <Text style={styles.message}>{t.message}</Text>

                    <View style={styles.botBlock}>
                      <Text style={styles.blockLabel}>Bot-Antwort</Text>
                      <Text style={styles.blockText}>{t.botResponse}</Text>
                    </View>

                    {restriction.restricted ? (
                      <View style={styles.restrictionBlock}>
                        <Text style={styles.restrictionText}>
                          Aktuell gesperrt bis {formatRestrictionUntil(restriction.until)}
                        </Text>
                        <TouchableOpacity
                          style={styles.liftButton}
                          onPress={() => handleLiftRestriction(t.uid, t.id)}
                          disabled={busy}
                        >
                          <Text style={styles.liftButtonText}>Sperre aufheben</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {t.founderResponse ? (
                      <View style={styles.founderBlock}>
                        <View style={styles.founderLabelRow}>
                          <Text style={styles.blockLabel}>Deine bisherige Antwort</Text>
                          {RESOLUTION_META[t.resolution] ? (
                            <View
                              style={[
                                styles.resolutionBadge,
                                { backgroundColor: `${RESOLUTION_META[t.resolution].color}22` },
                              ]}
                            >
                              <Text style={[styles.resolutionText, { color: RESOLUTION_META[t.resolution].color }]}>
                                {RESOLUTION_META[t.resolution].label}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.blockText}>{t.founderResponse}</Text>
                      </View>
                    ) : null}

                    {t.status !== "closed" ? (
                      <>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="Antwort schreiben (optional bei Annehmen/Ablehnen)..."
                          placeholderTextColor={colors.textMuted}
                          value={replyText[t.id] || ""}
                          onChangeText={(text) =>
                            setReplyText((prev) => ({ ...prev, [t.id]: text.slice(0, REPLY_MAX) }))
                          }
                          multiline
                          textAlignVertical="top"
                        />

                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleRespond(t.id, { resolution: "accepted" })}
                            disabled={busy}
                          >
                            <Text style={styles.actionButtonText}>Annehmen</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleRespond(t.id, { resolution: "rejected" })}
                            disabled={busy}
                          >
                            <Text style={styles.actionButtonText}>Ablehnen</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={styles.replyOnlyButton}
                            onPress={() => handleRespond(t.id, { resolution: t.resolution || null })}
                            disabled={busy || !(replyText[t.id] || "").trim()}
                          >
                            <Text style={styles.replyOnlyText}>Nur antworten</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.closeOnlyButton}
                            onPress={() => handleRespond(t.id, { resolution: t.resolution || null, closeAfter: true })}
                            disabled={busy}
                          >
                            <Text style={styles.closeOnlyText}>Schließen</Text>
                          </TouchableOpacity>
                        </View>
                      </>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  subject: {
    flex: 1,
    color: colors.text,
    ...typography.subhead,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  meta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  expandedBlock: {
    marginTop: spacing.md,
  },
  message: {
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
  blockLabel: {
    color: colors.primaryDark,
    ...typography.caption,
    marginBottom: 4,
  },
  blockText: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
  },
  restrictionBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${colors.danger}18`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  restrictionText: {
    flex: 1,
    color: colors.text,
    ...typography.footnote,
  },
  liftButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  liftButtonText: {
    color: colors.onPrimary,
    ...typography.caption,
    fontWeight: "700",
  },
  founderBlock: {
    backgroundColor: `${colors.primary}18`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  founderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  resolutionBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  resolutionText: {
    ...typography.caption,
    fontWeight: "700",
  },
  replyInput: {
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    minHeight: 70,
    marginTop: spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: colors.online,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: colors.onPrimary,
    ...typography.subhead,
  },
  replyOnlyButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  replyOnlyText: {
    color: colors.onPrimary,
    ...typography.subhead,
  },
  closeOnlyButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  closeOnlyText: {
    color: colors.textMuted,
    ...typography.subhead,
  },
});
