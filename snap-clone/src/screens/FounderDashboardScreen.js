import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GradientView from "../components/GradientView";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { getAppStats } from "../services/adminService";
import { listenPendingVerificationRequests } from "../services/verificationService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Buendelt die bisher sechs einzelnen Gruender-Screens an einem Ort mit
// Kennzahlen auf einen Blick statt einer flachen Liste in den Einstellungen -
// die Screens selbst bleiben unveraendert, nur der Einstiegspunkt aendert sich.
export default function FounderDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);

  useEffect(() => {
    getAppStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = listenPendingVerificationRequests(setPendingVerifications);
    return unsubscribe;
  }, []);

  const cards = [
    {
      key: "tickets",
      icon: "shield",
      title: "Ticket-Verwaltung",
      subtitle: "Weitergeleitete Support-Anfragen",
      badge: stats?.openTicketCount,
      onPress: () => navigation.navigate("FounderTickets"),
    },
    {
      key: "reports",
      icon: "flag",
      title: "Meldungen & Feedback",
      subtitle: "Gemeldete Inhalte und App-Feedback",
      badge: stats ? stats.reportCount + stats.feedbackCount : undefined,
      onPress: () => navigation.navigate("FounderReports"),
    },
    {
      key: "verification",
      icon: "shield",
      title: "Verifizierungs-Anfragen",
      subtitle: "Beantragte Verifizierungen prüfen",
      badge: pendingVerifications.length,
      onPress: () => navigation.navigate("FounderVerificationRequests"),
    },
    {
      key: "users",
      icon: "people",
      title: "Nutzer-Verwaltung",
      subtitle: "Konten, Sperren, Verifizierung",
      badge: stats?.activeRestrictionCount,
      badgeTint: colors.danger,
      onPress: () => navigation.navigate("FounderUsers"),
    },
    {
      key: "stats",
      icon: "grid",
      title: "Statistiken",
      subtitle: "Wachstum und Aktivität",
      onPress: () => navigation.navigate("FounderStats"),
    },
    {
      key: "announcement",
      icon: "bell",
      title: "Ankündigung senden",
      subtitle: "Nachricht an alle Nutzer:innen",
      onPress: () => navigation.navigate("FounderAnnouncement"),
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gründer-Dashboard" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatChip label="Nutzer" value={stats?.userCount} />
          <StatChip label="Beiträge" value={stats?.postCount} />
          <StatChip label="Offene Tickets" value={stats?.openTicketCount} highlight={!!stats?.openTicketCount} />
        </View>

        {cards.map((card) => (
          <TouchableOpacity key={card.key} style={styles.card} onPress={card.onPress} activeOpacity={0.85}>
            <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.iconCircle}>
              <Icon name={card.icon} size={17} color={colors.text} />
            </GradientView>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </View>
            {card.badge ? (
              <View style={[styles.badge, card.badgeTint && { backgroundColor: card.badgeTint }]}>
                <Text style={styles.badgeText}>{card.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StatChip({ label, value }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value ?? "–"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
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
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
  },
});
