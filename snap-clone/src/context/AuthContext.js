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
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);
      if (!firebaseUser) setProfile(null);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(doc(db, "users", authUser.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data());
    });
    return unsubscribe;
  }, [authUser]);

  // "user" kombiniert die Firebase-Auth-Identitaet mit dem Firestore-Profil
  // (username, avatarColor, nataScore), damit Screens nur eine Quelle brauchen.
  const user = authUser ? { uid: authUser.uid, email: authUser.email, ...profile } : null;

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signup = async (username, displayName, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      username: username.toLowerCase(),
      displayName,
      email,
      avatarColor: randomAvatarColor(),
      nataScore: 0,
      createdAt: serverTimestamp(),
    });

    return credential;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, initializing, login, signup, logout }}>
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
