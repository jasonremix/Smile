import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { uploadMedia } from "../services/mediaUpload";
import { getRestrictionAlert, getRestrictionStatus, recordStrike } from "../services/moderationService";
import { clearLocation, shareLocationCity, updateProfileFields } from "../services/userService";
import { checkContent, getBlockAlert } from "../utils/contentFilter";
import { hapticSelection } from "../utils/haptics";
import { INTEREST_OPTIONS, MAX_INTERESTS } from "../utils/interests";
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

export default function EditProfileScreen({ navigation, route }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || AVATAR_PALETTE[0]);
  const [avatarPhotoUri, setAvatarPhotoUri] = useState(null);
  const [interests, setInterests] = useState(user?.interests || []);
  const [saving, setSaving] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const locationEnabled = !!user?.location?.city;

  // Kommt zurueck von CameraScreen (intent "avatar", siehe handlePickPhoto)
  // - genau dasselbe Muster wie CreatePostScreen fuer photoUri aus der Kamera.
  useEffect(() => {
    if (route.params?.photoUri) {
      setAvatarPhotoUri(route.params.photoUri);
    }
  }, [route.params?.photoUri]);

  const toggleInterest = (id) => {
    hapticSelection();
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Name fehlt", "Bitte gib einen Anzeigenamen ein.");
      return;
    }
    const restriction = getRestrictionStatus(user);
    if (restriction.restricted) {
      const alertInfo = getRestrictionAlert(restriction);
      Alert.alert(alertInfo.title, alertInfo.message);
      return;
    }
    const check = checkContent(`${displayName} ${bio}`);
    if (check.blocked) {
      const alertInfo = getBlockAlert(check.reason);
      Alert.alert(alertInfo.title, alertInfo.message);
      if (check.reason !== "self_harm") recordStrike(user, check.reason);
      return;
    }
    setSaving(true);
    try {
      let avatarUrl;
      if (avatarPhotoUri) {
        try {
          avatarUrl = await uploadMedia(avatarPhotoUri, "stories", user.uid, "photo");
        } catch (e) {
          Alert.alert(
            "Foto-Speicher noch nicht bereit",
            "Dein neues Profilbild konnte nicht hochgeladen werden - der Foto-Speicher ist noch nicht eingerichtet. Der Rest deiner Änderungen wird trotzdem gespeichert."
          );
        }
      }
      await updateProfileFields(user.uid, { displayName, bio, avatarColor, avatarUrl, interests });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Fehler", "Profil konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLocation = async (next) => {
    hapticSelection();
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
    navigation.navigate("Camera", { intent: "avatar" });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profil bearbeiten" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickPhoto}>
          {avatarPhotoUri || user?.avatarUrl ? (
            <Image source={{ uri: avatarPhotoUri || user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{(displayName || "?").charAt(0).toUpperCase()}</Text>
            </View>
          )}
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
              onPress={() => {
                hapticSelection();
                setAvatarColor(color);
              }}
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

        <View style={styles.interestsHeader}>
          <Text style={styles.sectionLabel}>Interessen (optional)</Text>
          <Text style={styles.interestsCounter}>{interests.length}/{MAX_INTERESTS}</Text>
        </View>
        <View style={styles.interestsWrap}>
          {INTEREST_OPTIONS.map((option) => {
            const selected = interests.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.interestChip, selected && styles.interestChipSelected]}
                onPress={() => toggleInterest(option.id)}
              >
                <Text style={styles.interestEmoji}>{option.emoji}</Text>
                <Text style={[styles.interestLabel, selected && styles.interestLabelSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
  interestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  interestsCounter: {
    color: colors.textMuted,
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestChipSelected: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  interestEmoji: {
    fontSize: 14,
  },
  interestLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  interestLabelSelected: {
    color: colors.text,
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
