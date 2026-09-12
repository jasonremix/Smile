import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import VerifiedBadge from "../components/VerifiedBadge";
import { useAuth } from "../context/AuthContext";
import { getFriendsOnce, getMutualConnections, hasPendingRequest, sendFriendRequest } from "../services/friendService";
import { getUserProfile } from "../services/userService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { getInterestById } from "../utils/interests";

// Nata Code: kein Blind-Connect. Vor dem eigentlichen "Verbinden" sieht man
// immer erst eine echte Profilvorschau - Name, Avatar, gemeinsame
// Interessen, gemeinsame Connections - genau wie beim Antippen eines
// Suchergebnisses. Der Scan ersetzt nur das Auffinden der Person, nicht die
// bewusste Entscheidung, sich zu verbinden.
export default function ScanQRScreen({ navigation }) {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [foundProfile, setFoundProfile] = useState(null);
  const [sharedInterests, setSharedInterests] = useState([]);
  const [mutualConnections, setMutualConnections] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const scannedRef = useRef(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Nata braucht Zugriff auf die Kamera, um Codes zu scannen.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Zugriff erlauben</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }) => {
    if (scannedRef.current) return;
    if (!data || !data.startsWith("nata:user:")) {
      setError("Das ist kein Nata-Code.");
      return;
    }
    scannedRef.current = true;
    const uid = data.replace("nata:user:", "");

    if (uid === user.uid) {
      setError("Das ist dein eigener Code.");
      scannedRef.current = false;
      return;
    }

    setLoadingPreview(true);
    setError("");
    try {
      const profile = await getUserProfile(uid);
      if (!profile) {
        setError("Diese Person wurde nicht gefunden.");
        scannedRef.current = false;
        return;
      }

      const theirInterests = new Set(profile.interests || []);
      const shared = (user.interests || []).filter((i) => theirInterests.has(i));

      const [myFriends, alreadyPending] = await Promise.all([
        getFriendsOnce(user.uid).catch(() => []),
        hasPendingRequest(user.uid, uid).catch(() => false),
      ]);
      const mutual = await getMutualConnections(myFriends, uid).catch(() => []);

      setFoundProfile(profile);
      setSharedInterests(shared);
      setMutualConnections(mutual);
      setAlreadyRequested(alreadyPending);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAdd = async () => {
    setSending(true);
    try {
      await sendFriendRequest(user, { uid: foundProfile.uid });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => {
    setFoundProfile(null);
    setSharedInterests([]);
    setMutualConnections([]);
    setAlreadyRequested(false);
    setError("");
    setSent(false);
    scannedRef.current = false;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={foundProfile || loadingPreview ? undefined : handleBarcodeScanned}
      >
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={16} color="#fff" />
        </TouchableOpacity>

        {!foundProfile ? (
          <View style={styles.frameHint}>
            <View style={styles.scanFrame} />
            {loadingPreview ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
            ) : (
              <Text style={styles.hintText}>Nata-Code in den Rahmen halten</Text>
            )}
            {error && !loadingPreview ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {foundProfile ? (
          <View style={styles.resultCard}>
            {sent ? (
              <>
                <Text style={styles.resultTitle}>Anfrage gesendet! 💜</Text>
                <Text style={styles.resultSubtitle}>an {foundProfile.displayName}</Text>
                <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.doneButtonText}>Fertig</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.previewHeader}>
                  <View style={[styles.avatar, { backgroundColor: foundProfile.avatarColor || colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {(foundProfile.displayName || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.nameRow}>
                    <Text style={styles.resultTitle}>{foundProfile.displayName}</Text>
                    {foundProfile.verified ? <VerifiedBadge size={15} /> : null}
                  </View>
                  <Text style={styles.resultSubtitle}>@{foundProfile.username}</Text>
                  {foundProfile.bio ? (
                    <Text style={styles.bio} numberOfLines={2}>
                      {foundProfile.bio}
                    </Text>
                  ) : null}
                </View>

                {sharedInterests.length > 0 ? (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>
                      💜 {sharedInterests.length} gemeinsame {sharedInterests.length === 1 ? "Interesse" : "Interessen"}
                    </Text>
                    <View style={styles.chipsRow}>
                      {sharedInterests.map((id) => {
                        const interest = getInterestById(id);
                        return interest ? (
                          <View key={id} style={styles.chip}>
                            <Text style={styles.chipText}>
                              {interest.emoji} {interest.label}
                            </Text>
                          </View>
                        ) : null;
                      })}
                    </View>
                  </View>
                ) : null}

                {mutualConnections.length > 0 ? (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>
                      {mutualConnections.length} gemeinsame {mutualConnections.length === 1 ? "Connection" : "Connections"}
                    </Text>
                    <Text style={styles.mutualNames} numberOfLines={1}>
                      {mutualConnections.slice(0, 3).map((f) => f.displayName).join(", ")}
                      {mutualConnections.length > 3 ? ` +${mutualConnections.length - 3}` : ""}
                    </Text>
                  </View>
                ) : null}

                {sharedInterests.length === 0 && mutualConnections.length === 0 ? (
                  <Text style={styles.noOverlapHint}>
                    Noch keine gemeinsamen Interessen oder Connections erkennbar - macht den ersten Kontakt nicht weniger wert.
                  </Text>
                ) : null}

                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>Abbrechen</Text>
                  </TouchableOpacity>
                  {alreadyRequested ? (
                    <View style={[styles.addButton, styles.addButtonDisabled]}>
                      <Text style={styles.addButtonText}>Bereits angefragt</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={sending}>
                      {sending ? (
                        <ActivityIndicator color={colors.onPrimary} />
                      ) : (
                        <Text style={styles.addButtonText}>Verbinden</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        ) : null}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionText: {
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  frameHint: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  hintText: {
    color: "#fff",
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    maxHeight: "72%",
  },
  previewHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: "#000",
    fontSize: 24,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  resultSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  previewSection: {
    marginBottom: spacing.lg,
  },
  previewLabel: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    color: colors.text,
    ...typography.footnote,
  },
  mutualNames: {
    color: colors.textMuted,
    ...typography.footnote,
  },
  noOverlapHint: {
    color: colors.textMuted,
    ...typography.footnote,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  retryButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    ...shadow.sm,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: "center",
  },
  doneButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
});
