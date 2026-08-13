import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { sendFriendRequest } from "../services/friendService";
import { getUserProfile } from "../services/userService";
import { colors } from "../theme/colors";

export default function ScanQRScreen({ navigation }) {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [foundProfile, setFoundProfile] = useState(null);
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

    const profile = await getUserProfile(uid);
    if (!profile) {
      setError("Dieser Nutzer wurde nicht gefunden.");
      scannedRef.current = false;
      return;
    }
    setError("");
    setFoundProfile(profile);
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
    setError("");
    setSent(false);
    scannedRef.current = false;
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={foundProfile ? undefined : handleBarcodeScanned}
      >
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.frameHint}>
          <View style={styles.scanFrame} />
          {!foundProfile ? <Text style={styles.hintText}>Nata-Code in den Rahmen halten</Text> : null}
          {error && !foundProfile ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {foundProfile ? (
          <View style={styles.resultCard}>
            {sent ? (
              <>
                <Text style={styles.resultTitle}>Anfrage gesendet! 👻</Text>
                <Text style={styles.resultSubtitle}>an {foundProfile.displayName}</Text>
                <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.doneButtonText}>Fertig</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.resultTitle}>{foundProfile.displayName}</Text>
                <Text style={styles.resultSubtitle}>@{foundProfile.username}</Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>Abbrechen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={sending}>
                    {sending ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <Text style={styles.addButtonText}>Hinzufuegen</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
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
    color: colors.text,
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
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  resultTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  resultSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
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
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
});
