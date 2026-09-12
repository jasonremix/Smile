import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { updatePrivacyPrefs } from "../services/userService";
import { hapticSelection } from "../utils/haptics";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

// Affiliate-Link (kein offizielles Datenschutz-Partnerschaftsprogramm) -
// deshalb bewusst klar als Anzeige/Partner-Empfehlung gekennzeichnet statt
// als "offizielle Kooperation" dargestellt.
const NORDVPN_AFFILIATE_URL = "https://go.nordvpn.net/aff_c?offer_id=15&aff_id=112394";

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
  const { user } = useAuth();
  const [discoverable, setDiscoverable] = useState(user?.discoverable !== false);
  const [connectionsVisibility, setConnectionsVisibility] = useState(
    user?.connectionsVisibility || "everyone"
  );

  const handleToggleDiscoverable = (next) => {
    hapticSelection();
    setDiscoverable(next);
    updatePrivacyPrefs(user.uid, { discoverable: next }).catch(() => setDiscoverable(!next));
  };

  const handleSetConnectionsVisibility = (value) => {
    if (value === connectionsVisibility) return;
    hapticSelection();
    setConnectionsVisibility(value);
    updatePrivacyPrefs(user.uid, { connectionsVisibility: value }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Privatsphäre" />
      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Sichtbarkeit</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Sichtbar in Suche & Entdecken</Text>
            <Text style={styles.settingSubtitle}>
              Aus: du tauchst nicht mehr in der Suche oder in Vorschlägen auf. Dein Profil bleibt
              trotzdem für alle sichtbar, die deinen Nata-Code oder Link haben.
            </Text>
          </View>
          <Switch
            value={discoverable}
            onValueChange={handleToggleDiscoverable}
            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          />
        </View>
      </View>

      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>Wer sieht deine Connections-Liste?</Text>
        <Text style={styles.settingSubtitle}>
          Wirkt sich auf "gemeinsame Connections"-Vorschläge für andere aus.
        </Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, connectionsVisibility === "everyone" && styles.segmentActive]}
            onPress={() => handleSetConnectionsVisibility("everyone")}
          >
            <Text
              style={[
                styles.segmentText,
                connectionsVisibility === "everyone" && styles.segmentTextActive,
              ]}
            >
              Verbindungen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, connectionsVisibility === "onlyMe" && styles.segmentActive]}
            onPress={() => handleSetConnectionsVisibility("onlyMe")}
          >
            <Text
              style={[
                styles.segmentText,
                connectionsVisibility === "onlyMe" && styles.segmentTextActive,
              ]}
            >
              Nur ich
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

      <View style={styles.adCard}>
        <Text style={styles.adLabel}>Anzeige · Partner-Empfehlung</Text>
        <Text style={styles.adTitle}>Zusätzlich unterwegs schützen</Text>
        <Text style={styles.adText}>
          Nata schützt, was du in der App teilst - deine Internetverbindung selbst (z.B. im
          öffentlichen WLAN oder im Ausland) schützt das nicht automatisch mit. Ein VPN
          verschlüsselt zusätzlich deine Verbindung.
        </Text>
        <TouchableOpacity
          style={styles.adButton}
          onPress={() => Linking.openURL(NORDVPN_AFFILIATE_URL)}
        >
          <Text style={styles.adButtonText}>NordVPN ansehen</Text>
        </TouchableOpacity>
        <Text style={styles.adDisclosure}>
          Affiliate-Link - wir erhalten ggf. eine Provision, kein offizieller
          Datenschutz-Partner von Nata.
        </Text>
      </View>
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
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  settingSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    padding: 3,
    marginTop: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 15,
  },
  adCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  adLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  adTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  adText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  adButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  adButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  adDisclosure: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 10,
  },
});
