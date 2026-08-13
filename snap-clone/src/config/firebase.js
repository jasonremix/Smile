import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Trag hier die Werte aus deiner Firebase-Console ein (Projekteinstellungen -> Web-App).
// Siehe .env.example fuer die benoetigten Felder.
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Wird waehrend des Modul-Imports ausgefuehrt, also VOR dem ersten React-Render.
// Ein hier ungefangener Fehler wuerde die App ohne jede sichtbare Meldung
// abstuerzen lassen. Stattdessen merken wir uns den Fehler und werfen ihn
// spaeter innerhalb einer Komponente (siehe AuthContext), wo ihn die
// ErrorBoundary auffangen und anzeigen kann.
let app = null;
let auth = null;
let db = null;
let storage = null;
export let firebaseInitError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  firebaseInitError = error;
}

export { app, auth, db, storage };
