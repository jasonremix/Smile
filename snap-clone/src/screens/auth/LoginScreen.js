import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import SocialSignInRow, { socialSignInAvailable } from "../../components/SocialSignInRow";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!identifier || !password) {
      setError("Bitte E-Mail oder Benutzername und Passwort eingeben.");
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Image source={require("../../../assets/logo-full.png")} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.greeting}>Hey, schön dass du wieder da bist!</Text>
      </View>

      {socialSignInAvailable ? (
        <>
          <SocialSignInRow buttonStyle={styles.socialButton} />
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>oder mit E-Mail</Text>
            <View style={styles.dividerLine} />
          </View>
        </>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="E-Mail oder Benutzername"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        value={identifier}
        onChangeText={setIdentifier}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Anmelden" onPress={handleLogin} loading={loading} style={styles.button} />

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>Noch kein Konto? Registrieren</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function mapAuthError(e) {
  switch (e.code) {
    case "auth/invalid-email":
      return "Ungueltige E-Mail-Adresse.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-Mail oder Passwort ist falsch.";
    default:
      return "Anmeldung fehlgeschlagen. Bitte erneut versuchen.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoImage: {
    width: 260,
    height: 87,
    marginBottom: 4,
  },
  greeting: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 12,
    marginHorizontal: 12,
  },
  socialButton: {
    marginBottom: 12,
  },
  link: {
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
