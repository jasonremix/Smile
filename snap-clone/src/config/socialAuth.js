// OAuth-Client-IDs fuer Google Sign-In, angelegt in der Google Cloud
// Console (APIs & Dienste -> Anmeldedaten -> OAuth-Client-ID). Fuer
// Firebase Auth mit expo-auth-session braucht es die WEB-Client-ID (nicht
// die iOS/Android-IDs) als "clientId" bei der Google-Anfrage - die
// iOS/Android-IDs werden nur fuer die jeweilige Redirect-URI gebraucht.
// Bis diese Werte echt sind, ist der Google-Button inaktiv/zeigt einen
// Hinweis.
export const GOOGLE_WEB_CLIENT_ID = "";
export const GOOGLE_IOS_CLIENT_ID = "";
export const GOOGLE_ANDROID_CLIENT_ID = "";

export const isGoogleSignInConfigured = () => !!GOOGLE_WEB_CLIENT_ID;

// Sign in with Apple braucht keine Client-ID im Code (expo-apple-authentication
// spricht direkt mit Apple), aber ein aktives Apple Developer Program
// (kostenpflichtig) mit aktivierter "Sign in with Apple"-Capability fuer
// die App-ID, sowie in der Firebase Console den Apple-Anbieter mit
// Services-ID/Team-ID/Key aktiviert.
