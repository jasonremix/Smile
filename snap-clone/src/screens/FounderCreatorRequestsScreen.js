import React, { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { listenPendingCreatorRequests, reviewCreatorRequest } from "../services/creatorService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function FounderCreatorRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [busyUid, setBusyUid] = useState(null);

  React.useEffect(() => {
    const unsubscribe = listenPendingCreatorRequests(setRequests);
    return unsubscribe;
  }, []);

  const handleReview = (uid, approve) => {
    Alert.alert(
      approve ? "Creator-Anfrage annehmen?" : "Creator-Anfrage ablehnen?",
      approve
        ? "Diese Person erhält sofort den Creator-Modus mit goldenem Abzeichen."
        : "Diese Person kann anschließend eine neue Anfrage einreichen.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: approve ? "Annehmen" : "Ablehnen",
          style: approve ? "default" : "destructive",
          onPress: async () => {
            setBusyUid(uid);
            try {
              await reviewCreatorRequest(uid, { approve });
            } catch (e) {
              Alert.alert("Fehler", "Aktion konnte nicht gespeichert werden.");
            } finally {
              setBusyUid(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Creator-Anfragen" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Offene Anfragen auf den Creator-Modus. Annehmen setzt sofort den isCreator-Status.
        </Text>

        {requests.length === 0 ? (
          <Text style={styles.emptyText}>Aktuell keine offenen Anfragen.</Text>
        ) : (
          requests.map((r) => {
            const busy = busyUid === r.uid;
            return (
              <View key={r.uid} style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.name}>{r.displayName}</Text>
                  <Text style={styles.time}>
                    {r.createdAt?.toDate ? timeAgo(r.createdAt.toDate()) : ""}
                  </Text>
                </View>
                <Text style={styles.username}>@{r.username}</Text>
                <Text style={styles.reason}>{r.reason}</Text>

                {r.links?.length > 0 ? (
                  <View style={styles.linksBlock}>
                    {r.links.map((link, i) => (
                      <TouchableOpacity key={i} onPress={() => Linking.openURL(link).catch(() => {})}>
                        <Text style={styles.linkText} numberOfLines={1}>
                          {link}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleReview(r.uid, true)}
                    disabled={busy}
                  >
                    <Text style={styles.actionButtonText}>Annehmen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReview(r.uid, false)}
                    disabled={busy}
                  >
                    <Text style={styles.actionButtonText}>Ablehnen</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    ...typography.subhead,
  },
  time: {
    color: colors.textMuted,
    ...typography.caption,
  },
  username: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 1,
  },
  reason: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  linksBlock: {
    marginTop: spacing.sm,
    gap: 2,
  },
  linkText: {
    color: colors.primaryLight,
    ...typography.caption,
    textDecorationLine: "underline",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
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
});
