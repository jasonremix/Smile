import React, { useEffect, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { listenReferralCount } from "../services/betaService";
import { colors } from "../theme/colors";
import { shadow } from "../theme/shadow";

export default function ReferralScreen() {
  const { user } = useAuth();
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    const unsubscribe = listenReferralCount(user.uid, setReferralCount);
    return unsubscribe;
  }, [user.uid]);

  const handleShare = () => {
    Share.share({
      message: `Komm zu Nata! Registrier dich mit meinem Einladungscode: ${user.username}`,
    });
  };

  return (
    <View style={styles.container}>
      {user?.betaTesterNumber ? (
        <View style={styles.testerBadge}>
          <Text style={styles.testerBadgeText}>Beta-Tester #{user.betaTesterNumber}</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Lade Menschen zu Nata ein</Text>
      <Text style={styles.subtitle}>
        Dein Benutzername ist gleichzeitig dein Einladungscode. Wer sich damit registriert, zaehlt als
        deine Einladung.
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Dein Einladungscode</Text>
        <Text style={styles.code}>{user?.username}</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{referralCount}</Text>
        <Text style={styles.statLabel}>
          {referralCount === 1 ? "Person eingeladen" : "Personen eingeladen"}
        </Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Code teilen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  testerBadge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  testerBadgeText: {
    color: colors.onPrimary,
    fontWeight: "800",
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 19,
  },
  codeCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  code: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 28,
  },
  statValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 16,
    ...shadow.sm,
  },
  shareButtonText: {
    color: colors.onPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
});
