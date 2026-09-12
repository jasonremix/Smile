import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import React, { useState } from "react";
import { Alert, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";

// Nutzt Apples eigene Button-Komponente (Vorgabe von Apple fuer "Sign in
// with Apple", automatisch markenkonform) statt eines selbst gebauten
// Buttons. Rendert nur auf iOS - auf Android gibt es keine "Sign in with
// Apple"-Option.
export default function AppleSignInButton({ style }) {
  const { loginWithAppleCredential } = useAuth();
  const [busy, setBusy] = useState(false);

  if (Platform.OS !== "ios") return null;

  const handlePress = async () => {
    setBusy(true);
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      await loginWithAppleCredential(credential.identityToken, rawNonce);
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Anmeldung fehlgeschlagen", "Bitte versuch es erneut.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={32}
      style={[{ height: 52, opacity: busy ? 0.6 : 1 }, style]}
      onPress={handlePress}
    />
  );
}
