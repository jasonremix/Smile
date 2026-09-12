import React, { useEffect, useState } from "react";
import { Alert, FlatList, Linking, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import {
  isLocationSharingAvailable,
  listenCloseFriendsSharingWithMe,
  listenMyLiveLocationSharing,
  shareLiveLocationNow,
  stopSharingLiveLocation,
} from "../services/locationService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

function openInMaps(lat, lng, label) {
  const url = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${lat},${lng}`,
    android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`,
  });
  Linking.openURL(url).catch(() => {
    Alert.alert("Fehler", "Konnte keine Karten-App öffnen.");
  });
}

// Striktes Opt-in, nur Vordergrund-Standort (kein Hintergrund-Tracking,
// kein neues natives Modul jenseits des bereits vorhandenen expo-location) -
// sichtbar ausschliesslich fuer die eigene "enge Freunde"-Liste, nicht alle
// Connections. Standardmaessig aus, jederzeit mit einem Tipp beendet.
export default function CloseFriendsLocationScreen({ navigation }) {
  const { user } = useAuth();
  const [myLocation, setMyLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sharedWithMe, setSharedWithMe] = useState([]);

  useEffect(() => {
    const unsubscribe = listenMyLiveLocationSharing(user.uid, setMyLocation);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const unsubscribe = listenCloseFriendsSharingWithMe(user.uid, setSharedWithMe);
    return unsubscribe;
  }, [user.uid]);

  const isSharing = !!myLocation;

  const handleToggle = async (value) => {
    if (!value) {
      setBusy(true);
      try {
        await stopSharingLiveLocation(user.uid);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!isLocationSharingAvailable()) {
      Alert.alert(
        "Update nötig",
        "Standort-Teilen braucht die neueste App-Version. Bitte aktualisiere Nata und versuch es erneut."
      );
      return;
    }

    Alert.alert(
      "Live-Standort teilen",
      "Deine engen Freunde (nicht alle Connections) sehen deinen ungefähren Standort, solange du das hier aktiv lässt. Kein Hintergrund-Tracking - nur wenn du diesen Screen öffnest oder aktualisierst.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Teilen aktivieren", onPress: () => refreshLocation() },
      ]
    );
  };

  const refreshLocation = async () => {
    setBusy(true);
    try {
      await shareLiveLocationNow(user.uid);
    } catch (e) {
      if (e.code === "permission_denied") {
        Alert.alert(
          "Kein Zugriff",
          "Nata braucht die Standort-Berechtigung dafür. Du kannst sie in den Geräte-Einstellungen erlauben."
        );
      } else {
        Alert.alert("Fehler", "Standort konnte nicht ermittelt werden.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Standort teilen" />
      <FlatList
        data={sharedWithMe}
        keyExtractor={(item) => item.ownerId}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Meinen Standort teilen</Text>
                  <Text style={styles.cardSubtitle}>
                    {isSharing
                      ? `Aktiv · aktualisiert ${timeAgo(myLocation.updatedAt?.toDate?.() || new Date())}`
                      : "Aus - standardmäßig deaktiviert"}
                  </Text>
                </View>
                <Switch
                  value={isSharing}
                  onValueChange={handleToggle}
                  disabled={busy}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                />
              </View>
              {isSharing ? (
                <TouchableOpacity style={styles.refreshButton} onPress={refreshLocation} disabled={busy}>
                  <Icon name="pin" size={13} color={colors.primaryLight} />
                  <Text style={styles.refreshButtonText}>Jetzt aktualisieren</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionLabel}>Enge Freunde, die mit dir teilen</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendRow}
            onPress={() => openInMaps(item.lat, item.lng, item.displayName)}
          >
            <View style={[styles.avatar, { backgroundColor: item.avatarColor || colors.primary }]}>
              <Text style={styles.avatarText}>{(item.displayName || "?").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.friendName}>{item.displayName}</Text>
              <Text style={styles.friendMeta}>
                Aktualisiert {timeAgo(item.updatedAt?.toDate ? item.updatedAt.toDate() : new Date())}
              </Text>
            </View>
            <Icon name="pin" size={16} color={colors.primaryLight} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Niemand teilt gerade"
            text="Sobald dich jemand als engen Freund markiert hat und seinen Standort teilt, erscheint er hier."
          />
        }
      />
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  refreshButtonText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
  },
  friendName: {
    color: colors.text,
    ...typography.body,
    fontWeight: "600",
  },
  friendMeta: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
});
