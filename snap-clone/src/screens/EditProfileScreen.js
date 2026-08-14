import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { clearLocation, shareLocationCity, updateProfileFields } from "../services/userService";
import { colors } from "../theme/colors";
import { AVATAR_PALETTE } from "../theme/avatarPalette";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const BIO_MAX = 150;

// expo-location ist ein natives Modul, das erst mit dem naechsten nativen
// Build (1.0.1) auf den Geraeten vorhanden ist. Ein normaler Top-Level-
// Import wuerde beim Laden dieses Screens sofort werfen und die App auf
// allen aktuell installierten (aelteren) Versionen abstuerzen lassen -
// deshalb wie bei Google/Apple-Login per require im try/catch nachladen.
// Fehlt das Modul, wird "Stadt teilen" deaktiviert statt zu crashen.
let Location = null;
try {
  Location = require("expo-location");
} catch (e) {
  Location = null;
}

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || AVATAR_PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const locationEnabled = !!user?.location?.city;

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Name fehlt", "Bitte gib einen Anzeigenamen ein.");
      return;
    }
    setSaving(true);
    try {
      await updateProfileFields(user.uid, { displayName, bio, avatarColor });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Fehler", "Profil konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLocation = async (next) => {
    if (!next) {
      await clearLocation(user.uid).catch(() => {});
      return;
    }
    if (!Location) {
      Alert.alert(
        "Update nötig",
        "Standort teilen braucht die neueste App-Version. Bitte aktualisiere Nata und versuch es erneut."
      );
      return;
    }
    setLocationBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Kein Zugriff",
          "Nata braucht die Standort-Berechtigung, um deine Stadt zu teilen. Du kannst sie in den Geraete-Einstellungen erlauben."
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const city = place?.city || place?.subregion || place?.region;
      if (!city) {
        Alert.alert("Stadt nicht gefunden", "Dein Standort konnte keiner Stadt zugeordnet werden.");
        return;
      }
      await shareLocationCity(user.uid, city, place?.region);
    } catch (e) {
      Alert.alert("Fehler", "Standort konnte nicht ermittelt werden.");
    } finally {
      setLocationBusy(false);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert(
      "Bald verfügbar",
      "Profilbilder brauchen Foto-Speicher, der gerade eingerichtet wird. Bis dahin kannst du eine Farbe für deinen Avatar wählen."
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profil bearbeiten" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickPhoto}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{(displayName || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.avatarEditBadge}>
            <Icon name="camera" size={13} color={colors.text} />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Avatar-Farbe</Text>
        <View style={styles.paletteRow}>
          {AVATAR_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.swatch,
                { backgroundColor: color },
                avatarColor === color && styles.swatchSelected,
              ]}
              onPress={() => setAvatarColor(color)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Anzeigename</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Dein Name"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
        />

        <Text style={styles.sectionLabel}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
          placeholder="Erzähl etwas über dich..."
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Text style={styles.counter}>{bio.length}/{BIO_MAX}</Text>

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Icon name="pin" size={18} color={colors.primaryLight} />
            <View style={styles.locationTextBlock}>
              <Text style={styles.locationTitle}>Stadt teilen</Text>
              <Text style={styles.locationSubtitle}>
                {locationEnabled
                  ? `Sichtbar auf deinem Profil: ${user.location.city}`
                  : "Standardmäßig aus - nur deine Stadt, nie ein genauer Standort."}
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleToggleLocation}
              disabled={locationBusy}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
            />
          </View>
        </View>

        <PrimaryButton title="Speichern" onPress={handleSave} loading={saving} style={styles.saveButton} />
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
  avatarWrapper: {
    alignSelf: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontSize: 32,
    fontWeight: "800",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  paletteRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: spacing.xs,
  },
  counter: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "right",
    marginBottom: spacing.xxl,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  locationTextBlock: {
    flex: 1,
  },
  locationTitle: {
    color: colors.text,
    ...typography.subhead,
  },
  locationSubtitle: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: 2,
    lineHeight: 17,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
