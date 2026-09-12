import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { deleteAccount } from "../services/accountService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

export default function DeleteAccountScreen() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = () => {
    if (!password) {
      setError("Bitte gib dein Passwort ein.");
      return;
    }

    Alert.alert(
      "Konto wirklich löschen?",
      "Das kann nicht rückgängig gemacht werden. Dein Profil, deine Connections, Moments und Chats werden entfernt.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Endgültig löschen",
          style: "destructive",
          onPress: doDelete,
        },
      ]
    );
  };

  const doDelete = async () => {
    setError("");
    setLoading(true);
    try {
      await deleteAccount({ uid: user.uid, email: user.email, password });
      // Nach erfolgreicher Loeschung wechselt die App automatisch zum
      // Login-Bildschirm, sobald Firebase Auth den Nutzer als abgemeldet
      // meldet - keine weitere Navigation noetig.
    } catch (e) {
      setLoading(false);
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Falsches Passwort.");
      } else {
        setError("Konto konnte nicht gelöscht werden. Bitte erneut versuchen.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.warningRow}>
        <Icon name="warning" size={18} color={colors.danger} />
        <Text style={styles.warning}>Diese Aktion ist endgültig</Text>
      </View>
      <Text style={styles.text}>
        Dein Nata-Konto, dein Profil, deine Connections, Moments, Snaps und Chats werden
        unwiderruflich gelöscht. Das kann nicht rückgängig gemacht werden.
      </Text>

      <Text style={styles.label}>Bestätige dein Passwort, um fortzufahren</Text>
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.deleteButtonText}>Konto endgültig löschen</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  warning: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "800",
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  deleteButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
});
