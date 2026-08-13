import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCaual6NQdRQYLfsL8KMG5QFL-Gnrp0kpM",
  authDomain: "nata-93b3b.firebaseapp.com",
  projectId: "nata-93b3b",
  storageBucket: "nata-93b3b.firebasestorage.app",
  messagingSenderId: "657792334963",
  appId: "1:657792334963:web:15719bab66c6160d117e06",
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
  // Diese Firestore-Datenbank wurde mit der Datenbank-ID "default" (ohne
  // Klammern) angelegt statt der klassischen "(default)"-Kennung, auf die
  // getFirestore(app) ohne zweites Argument zielt. Ohne die explizite ID
  // scheitert JEDER Schreibvorgang mit "NOT_FOUND", egal wie oft man's
  // versucht - deshalb muss die ID hier ausdruecklich angegeben werden.
  db = getFirestore(app, "default");
  storage = getStorage(app);
} catch (error) {
  firebaseInitError = error;
}

export { app, auth, db, storage };
