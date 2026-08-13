import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

function InfoRow({ icon, title, text }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowText}>{text}</Text>
      </View>
    </View>
  );
}

export default function PrivacyScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Privatsphäre</Text>

      <InfoRow
        icon="👥"
        title="Storys"
        text="Beim Posten kannst du jedes Mal wählen: sichtbar für alle Freunde oder nur für einzeln ausgewählte Personen."
      />
      <InfoRow
        icon="📸"
        title="Snaps"
        text="Snaps kannst du nur an Freunde schicken, und nur du und die Empfänger*innen können sie sehen."
      />
      <InfoRow
        icon="🚫"
        title="Blockieren"
        text="Blockierte Personen sehen dich nicht mehr und du siehst sie nicht mehr - auch bestehende Freundschaften werden dabei beendet."
      />
      <InfoRow
        icon="🚩"
        title="Melden"
        text="Nutzer, Snaps, Storys und Nachrichten kannst du jederzeit melden - das ist nur für dich und uns sichtbar."
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
  header: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  rowIcon: {
    fontSize: 22,
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
