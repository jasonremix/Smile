import { doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import { toggleCreator } from "./adminService";

const REASON_MAX = 500;
export const MAX_LINKS = 5;

// Exakt dasselbe Muster wie verificationRequests (verificationService.js):
// feste Dokument-ID = eigene uid, damit "hat diese Person schon eine
// (offene) Anfrage" ohne Query am Dokumentpfad geprueft werden kann.
export async function submitCreatorRequest(uid, { username, displayName, reason, links }) {
  const trimmedReason = (reason || "").trim().slice(0, REASON_MAX);
  const cleanLinks = (links || []).map((l) => l.trim()).filter(Boolean).slice(0, MAX_LINKS);
  await setDoc(doc(db, "creatorRequests", uid), {
    uid,
    username,
    displayName,
    reason: trimmedReason,
    links: cleanLinks,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export function listenMyCreatorRequest(uid, callback) {
  return onSnapshot(doc(db, "creatorRequests", uid), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// Nur fuer den Gruender lesbar (siehe isFounder() in firestore.rules).
export function listenPendingCreatorRequests(callback) {
  const q = query(collection(db, "creatorRequests"), where("status", "==", "pending"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    callback(items);
  });
}

// Genehmigen setzt zusaetzlich das echte isCreator-Feld (toggleCreator()
// aus adminService.js) - Ablehnen aendert nur den Anfrage-Status.
export async function reviewCreatorRequest(uid, { approve, founderNote }) {
  await updateDoc(doc(db, "creatorRequests", uid), {
    status: approve ? "approved" : "rejected",
    founderNote: founderNote?.trim() || null,
    reviewedAt: serverTimestamp(),
  });
  if (approve) {
    await toggleCreator(uid, true);
  }
}
