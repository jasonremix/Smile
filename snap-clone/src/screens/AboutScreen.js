import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import SettingsRow from "../components/SettingsRow";
import SettingsSection from "../components/SettingsSection";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Fest verdrahtet statt aus app.json gelesen - siehe SettingsScreen.js fuer
// die gleiche Begruendung (expo-constants ist in bisherigen Builds nicht
// dabei).
const APP_VERSION = "1.0.1";

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Über Nata" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandBlock}>
          <Image source={require("../../assets/logo-full.png")} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.tagline}>Weniger Elemente. Bessere Elemente. Mehr Persönlichkeit.</Text>
          <Text style={styles.version}>Version {APP_VERSION} · Beta</Text>
        </View>

        <Text style={styles.paragraph}>
          Nata ist ein soziales Netzwerk für echte Verbindungen statt endlosem Scrollen: Momente
          teilen, Nachrichten schreiben, Connections pflegen - ohne Ads, ohne Feed-Manipulation für
          maximale Nutzungsdauer.
        </Text>
        <Text style={styles.paragraph}>
          Nata wird von Nata Inc entwickelt, gegründet von Jason Bürger. Die App befindet sich in
          aktiver Beta-Entwicklung - Feedback von Testerinnen und Testern fließt laufend ein.
        </Text>

        <Text style={styles.sectionLabel}>Mehr</Text>
        <SettingsSection>
          <SettingsRow icon="roadmap" label="Roadmap" onPress={() => navigation.navigate("Roadmap")} />
          <SettingsRow icon="shield" label="Sicherheit" onPress={() => navigation.navigate("Security")} />
          <SettingsRow
            icon="document"
            label="Datenschutz & Nutzungsbedingungen"
            onPress={() => navigation.navigate("Legal")}
          />
          <SettingsRow icon="chat" label="Feedback geben" onPress={() => navigation.navigate("Feedback")} />
        </SettingsSection>
      </ScrollView>
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
  brandBlock: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logoImage: {
    width: 220,
    height: 73,
    marginBottom: spacing.sm,
  },
  tagline: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: "80%",
  },
  version: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: spacing.md,
  },
  paragraph: {
    color: colors.text,
    ...typography.body,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
