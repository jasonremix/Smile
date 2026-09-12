import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadow } from "../theme/shadow";

// Wird gezeigt, solange ein Passwort-Konto seine E-Mail-Adresse noch nicht
// bestaetigt hat (siehe AuthContext.js: needsEmailVerification) - blockiert
// den Rest der App bewusst vollstaendig, damit niemand mit einer erfundenen
// E-Mail-Adresse ein Konto betreiben kann.
export default function VerifyEmailScreen() {
  const { user, logout, resendVerificationEmail, refreshAuthUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [sentAgain, setSentAgain] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshAuthUser();
    } catch (e) {
      Alert.alert("Fehler", "Status konnte nicht geprüft werden. Bitte erneut versuchen.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      setSentAgain(true);
    } catch (e) {
      Alert.alert("Fehler", "Mail konnte nicht erneut gesendet werden. Bitte kurz warten und nochmal versuchen.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require("../../assets/icon.png")} style={styles.ghost} />
        <Text style={styles.title}>Bestätige deine E-Mail</Text>
        <Text style={styles.subtitle}>
          Wir haben einen Bestätigungslink an{"\n"}
          <Text style={styles.email}>{user?.email}</Text>{"\n"}
          gesendet. Öffne die Mail und tippe auf den Link, dann hier weiter.
        </Text>

        {sentAgain ? <Text style={styles.resentNote}>Mail erneut gesendet ✓</Text> : null}

        <PrimaryButton
          title="Ich habe bestätigt"
          onPress={handleCheck}
          loading={checking}
          style={styles.button}
        />

        <TouchableOpacity onPress={handleResend} disabled={resending}>
          <Text style={styles.resendLink}>
            {resending ? "Wird gesendet…" : "Mail erneut senden"}
          </Text>
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
    borderRadius: radius.pill,
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
    lineHeight: 20,
  },
  email: {
    color: colors.text,
    fontWeight: "700",
  },
  resentNote: {
    color: colors.online,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    marginTop: 8,
    ...shadow.sm,
  },
  resendLink: {
    color: colors.primaryDark,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
  logoutLink: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
});
