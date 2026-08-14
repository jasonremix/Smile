import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Fortlaufende Beta-Tester-Nummer ueber einen gemeinsamen Zaehler-Doc, per
// Transaktion vergeben, damit auch bei gleichzeitigen Registrierungen keine
// Nummer doppelt vergeben wird.
export async function assignBetaTesterNumber(uid) {
  const counterRef = doc(db, "meta", "counters");
  let assignedNumber;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? snap.data().betaTesterCount || 0 : 0;
    assignedNumber = current + 1;
    tx.set(counterRef, { betaTesterCount: assignedNumber }, { merge: true });
  });
  await updateDoc(doc(db, "users", uid), { betaTesterNumber: assignedNumber });
  return assignedNumber;
}

// Der Benutzername dient direkt als Einladungscode - kein zusaetzliches
// Code-Generierungssystem noetig, jeder Code ist automatisch einzigartig
// und leicht zu teilen ("Lade mit @username ein").
export async function findUserByUsername(username) {
  const term = username.trim().toLowerCase();
  if (!term) return null;
  const q = query(collection(db, "users"), where("username", "==", term), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
}

// Vorher wurde referralCount per increment() direkt auf dem Dokument der
// werbenden Person erhoeht - das schlug aber IMMER fehl (still abgefangen
// im aufrufenden AuthContext.js), weil zu diesem Zeitpunkt die neu
// registrierte Person angemeldet ist, nicht die werbende - die
// Firestore-Regel erlaubt einer Person aber nur Aenderungen am eigenen
// Dokument. Stattdessen legt die neu registrierte Person ein Dokument in
// der referrals-Subcollection DER WERBENDEN PERSON an, mit der eigenen uid
// als Dokument-ID (das darf sie, siehe firestore.rules) - die Anzahl ergibt
// sich aus der Groesse dieser Subcollection statt aus einem Zaehlerfeld.
export async function applyReferral(newUid, referrerUid) {
  await updateDoc(doc(db, "users", newUid), { referredBy: referrerUid });
  await setDoc(doc(db, "users", referrerUid, "referrals", newUid), {
    createdAt: serverTimestamp(),
  });
}

export function listenReferralCount(uid, callback) {
  return onSnapshot(collection(db, "users", uid, "referrals"), (snap) => callback(snap.size));
}
