import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Blockieren beendet gleichzeitig eine bestehende Freundschaft in beide
// Richtungen, damit blockierte Personen nicht weiter als Freunde auftauchen.
export async function blockUser(currentUid, target) {
  await setDoc(doc(db, "users", currentUid, "blocked", target.uid), {
    uid: target.uid,
    displayName: target.displayName || target.name || "",
    username: target.username || "",
    blockedAt: serverTimestamp(),
  });

  await Promise.all([
    deleteDoc(doc(db, "users", currentUid, "friends", target.uid)).catch(() => {}),
    deleteDoc(doc(db, "users", target.uid, "friends", currentUid)).catch(() => {}),
  ]);
}

export async function unblockUser(currentUid, blockedUid) {
  await deleteDoc(doc(db, "users", currentUid, "blocked", blockedUid));
}

export function listenBlockedUsers(uid, callback) {
  const q = query(collection(db, "users", uid, "blocked"), orderBy("displayName"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data()));
  });
}

export const REPORT_REASONS = [
  { id: "spam", label: "Spam oder Werbung" },
  { id: "harassment", label: "Belästigung oder Mobbing" },
  { id: "threat", label: "Drohung oder Gewaltandrohung" },
  { id: "inappropriate_content", label: "Unangemessene Inhalte" },
  { id: "impersonation", label: "Fake-Account / Identitätsdiebstahl" },
  { id: "other", label: "Sonstiges" },
];

export const INCIDENT_TIMINGS = [
  { id: "just_now", label: "Gerade eben" },
  { id: "today", label: "Heute" },
  { id: "this_week", label: "Diese Woche" },
  { id: "longer_ago", label: "Vor längerem" },
];

// targetType: "user" | "snap" | "story" | "message" | "post"
// description: Freitext, was passiert ist. incidentTiming: eine der
// INCIDENT_TIMINGS-IDs. targetDisplayName: fuer Anzeige/PDF, rein
// informativ (kein Sicherheitsmerkmal).
export async function reportContent({
  reporterId,
  targetType,
  targetId,
  targetUserId,
  targetDisplayName,
  reason,
  description,
  incidentTiming,
}) {
  await addDoc(collection(db, "reports"), {
    reporterId,
    targetType,
    targetId: targetId || null,
    targetUserId: targetUserId || null,
    targetDisplayName: targetDisplayName || null,
    reason,
    description: description || "",
    incidentTiming: incidentTiming || null,
    createdAt: serverTimestamp(),
  });
}
