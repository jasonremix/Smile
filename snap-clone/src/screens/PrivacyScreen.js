import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { colors } from "../theme/colors";

function InfoRow({ icon, title, text }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.primaryLight} style={styles.rowIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowText}>{text}</Text>
      </View>
    </View>
  );
}

export default function PrivacyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Privatsphäre" />
      <ScrollView contentContainerStyle={styles.content}>
      <InfoRow
        icon="moment"
        title="Moments"
        text="Beim Posten kannst du jedes Mal wählen: sichtbar für alle Connections oder nur für einzeln ausgewählte Personen."
      />
      <InfoRow
        icon="camera"
        title="Snaps"
        text="Snaps kannst du nur an Connections schicken, und nur du und die Empfänger*innen können sie sehen."
      />
      <InfoRow
        icon="block"
        title="Blockieren"
        text="Blockierte Personen sehen dich nicht mehr und du siehst sie nicht mehr - auch bestehende Connections werden dabei beendet."
      />
      <InfoRow
        icon="flag"
        title="Melden"
        text="Nutzer, Snaps, Moments und Nachrichten kannst du jederzeit melden - das ist nur für dich und uns sichtbar."
      />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("BlockedUsers")}
      >
        <Text style={styles.actionButtonText}>Blockierte Nutzer verwalten</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Legal")}>
        <Text style={styles.actionButtonText}>Datenschutzerklärung lesen</Text>
      </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 48,
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  rowText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  actionButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 15,
  },
});
