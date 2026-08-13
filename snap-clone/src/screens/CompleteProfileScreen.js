import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

// Wird gezeigt, wenn jemand eingeloggt ist, aber kein Firestore-Profil hat
// (z.B. weil die Registrierung an einer Race Condition gescheitert ist) -
// ohne diesen Weg waere so ein Account fuer immer unbrauchbar.
export default function CompleteProfileScreen() {
  const { logout, completeProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!displayName || !username) {
      setError("Bitte beide Felder ausfuellen.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Der Benutzername muss mindestens 3 Zeichen haben.");
      return;
    }
    setLoading(true);
    try {
      await completeProfile(username.trim(), displayName.trim());
    } catch (e) {
      setError("Konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require("../../assets/icon.png")} style={styles.ghost} />
        <Text style={styles.title}>Fast geschafft! 👻</Text>
        <Text style={styles.subtitle}>
          Dein Konto ist erstellt, aber dein Profil fehlt noch. Waehle einen Anzeigenamen und
          Benutzernamen, um loszulegen.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Anzeigename"
          placeholderTextColor={colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Benutzername (einzigartig)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Profil speichern</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutLink}>Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: "center",
  },
  ghost: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  logoutLink: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
  error: {
    color: colors.danger,
    marginBottom: 10,
    textAlign: "center",
  },
});
