import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../context/AuthContext";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  isGoogleSignInConfigured,
} from "../config/socialAuth";

// Noetig, damit die Auth-Session-Antwort ankommt, sobald der System-Browser
// nach dem Google-Login wieder zur App zurueckspringt.
WebBrowser.maybeCompleteAuthSession();

// OAuth-Redirect-Flow ueber expo-auth-session (Browser-basiert, kein
// natives Google-SDK) - erfordert ein frisches natives Build, weil dafuer
// ein URL-Scheme in der App registriert sein muss (siehe app.json "scheme").
export function useGoogleSignIn() {
  const { loginWithGoogleIdToken } = useAuth();
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      setSigningIn(true);
      loginWithGoogleIdToken(response.params.id_token)
        .catch(() => setError("Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen."))
        .finally(() => setSigningIn(false));
    } else if (response?.type === "error") {
      setError("Google-Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
    }
  }, [response]);

  const signIn = () => {
    setError("");
    promptAsync();
  };

  return {
    signIn,
    signingIn,
    error,
    ready: !!request && isGoogleSignInConfigured(),
  };
}
