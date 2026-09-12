import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralUsername, setReferralUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    if (!displayName || !username || !email || !password) {
      setError("Bitte alle Felder ausfuellen.");
      return;
    }
    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    setLoading(true);
    try {
      await signup(username, displayName, email.trim(), password, referralUsername);
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require("../../../assets/logo-full.png")} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logo}>Konto erstellen</Text>
          <Text style={styles.greeting}>Schön, dass du zu Nata kommst!</Text>
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
        <TextInput
          style={styles.input}
          placeholder="E-Mail"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Passwort"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Einladungscode (optional)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={referralUsername}
          onChangeText={setReferralUsername}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Registrieren" onPress={handleSignup} loading={loading} style={styles.button} />

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Bereits registriert? Anmelden</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Legal")}>
          <Text style={styles.legalLink}>
            Mit der Registrierung akzeptierst du unsere Nutzungsbedingungen und
            Datenschutzerklärung.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapAuthError(e) {
  switch (e.code) {
    case "auth/email-already-in-use":
      return "Diese E-Mail wird bereits verwendet.";
    case "auth/invalid-email":
      return "Ungueltige E-Mail-Adresse.";
    case "auth/weak-password":
      return "Das Passwort ist zu schwach.";
    default:
      return "Registrierung fehlgeschlagen. Bitte erneut versuchen.";
  }
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
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 200,
    height: 67,
    marginBottom: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
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
  legalLink: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  error: {
    color: colors.danger,
    marginBottom: 10,
    textAlign: "center",
  },
});
