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
import { applyReferral, assignBetaTesterNumber, findUserByUsername } from "../services/betaService";

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
  // durch einen voruebergehenden Netzwerkfehler beim Registrieren), landet
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
    // Reine Netzwerk-Resilienz gegen voruebergehende Fehler - kein Ersatz
    // fuer eine korrekt konfigurierte Datenbankverbindung.
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

  const signup = async (username, displayName, email, password, referralUsername) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await createProfileDoc(credential.user.uid, username, displayName, email);

    // Beta-Tester-Nummer und Einladung sind bewusst "best effort" nach dem
    // eigentlichen Profil - ein Fehler hier darf die Registrierung selbst
    // nicht scheitern lassen, das Konto ist zu diesem Zeitpunkt schon nutzbar.
    try {
      await assignBetaTesterNumber(credential.user.uid);
    } catch {
      // Tester-Nummer ist ein Nice-to-have, kein kritischer Registrierungsschritt.
    }

    if (referralUsername && referralUsername.trim()) {
      try {
        const referrer = await findUserByUsername(referralUsername);
        if (referrer && referrer.uid !== credential.user.uid) {
          await applyReferral(credential.user.uid, referrer.uid);
        }
      } catch {
        // Ungueltiger/falscher Einladungscode blockiert die Registrierung nicht.
      }
    }

    return credential;
  };

  // Reparatur-Weg fuer Accounts, die needsProfileSetup treffen - gleiches
  // Schema wie signup(), nur ohne erneute Kontoerstellung.
  const completeProfile = async (username, displayName) => {
    await updateProfile(auth.currentUser, { displayName });
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
