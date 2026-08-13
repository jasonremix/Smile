import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseInitError } from "../config/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Wird waehrend des Renderns geworfen (nicht schon beim Modul-Import),
  // damit die ErrorBoundary in App.js den Fehler auffangen und anzeigen kann,
  // statt dass die App stumm auf einem leeren Bildschirm haengen bleibt.
  if (firebaseInitError) {
    throw firebaseInitError;
  }

  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setProfileLoaded(false);
      }
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (!authUser) return;
    setProfileLoaded(false);
    const unsubscribe = onSnapshot(doc(db, "users", authUser.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setProfileLoaded(true);
    });
    return unsubscribe;
  }, [authUser]);

  // "user" kombiniert die Firebase-Auth-Identitaet mit dem Firestore-Profil
  // (username, avatarColor, nataScore), damit Screens nur eine Quelle brauchen.
  const user = authUser ? { uid: authUser.uid, email: authUser.email, ...profile } : null;

  // Falls die Firestore-Profildoc trotz vorhandenem Auth-Account fehlt (z.B.
  // weil der Schreibvorgang direkt nach der Kontoerstellung an einer Race
  // Condition mit dem noch nicht bereiten Auth-Token gescheitert ist), landet
  // der Account sonst dauerhaft unbrauchbar und unsichtbar in der Suche.
  const needsProfileSetup = !!authUser && profileLoaded && !profile;

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  async function createProfileDoc(uid, username, displayName, email) {
    const data = {
      uid,
      username: username.toLowerCase(),
      displayName,
      // Normalisierte Kleinschreibung, damit die Freunde-Suche unabhaengig
      // von Gross-/Kleinschreibung auch ueber den Anzeigenamen funktioniert.
      displayNameLower: displayName.toLowerCase(),
      email,
      avatarColor: randomAvatarColor(),
      nataScore: 0,
      createdAt: serverTimestamp(),
    };
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await setDoc(doc(db, "users", uid), data);
        return;
      } catch (e) {
        if (attempt === maxAttempts) throw e;
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  const signup = async (username, displayName, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    // Direkt nach der Kontoerstellung hat die Firestore-SDK-Instanz (vor allem
    // unter React Native mit AsyncStorage-Persistenz) das neue Auth-Token noch
    // nicht zwingend uebernommen - ein sofortiger Schreibvorgang schlaegt dann
    // mit permission-denied fehl, obwohl serverseitig alles erlaubt waere.
    // Ein erzwungener Token-Refresh vor dem Schreiben behebt das zuverlaessig.
    await credential.user.getIdToken(true);
    await createProfileDoc(credential.user.uid, username, displayName, email);
    return credential;
  };

  // Reparatur-Weg fuer Accounts, die needsProfileSetup treffen - gleiches
  // Schema wie signup(), nur ohne erneute Kontoerstellung.
  const completeProfile = async (username, displayName) => {
    await updateProfile(auth.currentUser, { displayName });
    await auth.currentUser.getIdToken(true);
    await createProfileDoc(authUser.uid, username, displayName, authUser.email);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, initializing, needsProfileSetup, login, signup, completeProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function randomAvatarColor() {
  const palette = ["#A855F7", "#7C3AED", "#C084FC", "#F472B6", "#38BDF8", "#34D399"];
  return palette[Math.floor(Math.random() * palette.length)];
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
