import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useBetaCountdown } from "../hooks/useBetaCountdown";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import Icon from "./Icon";

// Bewusst ganz oben im Home-Feed platziert statt nur in den Einstellungen
// versteckt - der Gruender moechte, dass wirklich jede Person den Ablauf
// der Beta sieht, nicht nur wer aktiv danach sucht.
export default function BetaCountdownBanner({ onPress }) {
  const { expired, days, hours, minutes } = useBetaCountdown();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={
        expired
          ? "Die Beta ist beendet"
          : `Beta endet in ${days} Tagen, ${hours} Stunden und ${minutes} Minuten, am 24. September 2026`
      }
    >
      <Icon name="warning" size={20} color={colors.primaryLight} style={styles.icon} />
      <View style={styles.textBlock}>
        {expired ? (
          <>
            <Text style={styles.title}>Die Beta ist beendet</Text>
            <Text style={styles.subtitle}>Nata war bis 24.09.2026 als geschlossene Beta verfuegbar.</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {days > 0
                ? `Noch ${days} ${days === 1 ? "Tag" : "Tage"} bis zum Beta-Ende`
                : hours > 0
                ? `Noch ${hours} ${hours === 1 ? "Stunde" : "Stunden"} bis zum Beta-Ende`
                : `Noch ${minutes} ${minutes === 1 ? "Minute" : "Minuten"} bis zum Beta-Ende`}
            </Text>
            <Text style={styles.subtitle}>Die geschlossene Beta endet am 24.09.2026</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(147, 51, 234, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.4)",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  icon: {
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
