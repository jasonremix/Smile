import { doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import { toggleVerified } from "./adminService";

const REASON_MAX = 500;
export const MAX_LINKS = 5;

// Feste Dokument-ID = eigene uid statt addDoc() mit Zufalls-ID, damit sich
// "hat diese Person schon eine (offene) Anfrage" in firestore.rules ohne
// Query pruefen laesst (Regeln koennen nur einzelne, bekannte Dokumente per
// Pfad lesen, keine Query ausfuehren). Nach einer Ablehnung darf dieselbe
// Person erneut einreichen - das ueberschreibt dann denselben Eintrag.
export async function submitVerificationRequest(uid, { username, displayName, reason, links }) {
  const trimmedReason = (reason || "").trim().slice(0, REASON_MAX);
  const cleanLinks = (links || []).map((l) => l.trim()).filter(Boolean).slice(0, MAX_LINKS);
  await setDoc(doc(db, "verificationRequests", uid), {
    uid,
    username,
    displayName,
    reason: trimmedReason,
    links: cleanLinks,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export function listenMyVerificationRequest(uid, callback) {
  return onSnapshot(doc(db, "verificationRequests", uid), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// Nur fuer den Gruender lesbar (siehe isFounder() in firestore.rules).
export function listenPendingVerificationRequests(callback) {
  const q = query(collection(db, "verificationRequests"), where("status", "==", "pending"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    callback(items);
  });
}

// Genehmigen setzt zusaetzlich den echten verified-Haken (toggleVerified()
// aus adminService.js, bereits bestehende Gruender-Funktion) - Ablehnen
// aendert nur den Anfrage-Status.
export async function reviewVerificationRequest(uid, { approve, founderNote }) {
  await updateDoc(doc(db, "verificationRequests", uid), {
    status: approve ? "approved" : "rejected",
    founderNote: founderNote?.trim() || null,
    reviewedAt: serverTimestamp(),
  });
  if (approve) {
    await toggleVerified(uid, true);
  }
}
