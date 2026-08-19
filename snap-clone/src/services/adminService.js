import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Alle Funktionen hier setzen voraus, dass die aufrufende Person der
// Gruender ist (@jasonbuerger) - durchgesetzt in firestore.rules per
// isFounder() (feste UID), nicht durch diesen Client-Code. Ein Aufruf ohne
// Gruender-Rechte scheitert schlicht mit "permission-denied".

// ---- Meldungen & Feedback (nur lesbar fuer den Gruender) ----

export function listenAllReports(callback) {
  const q = query(collection(db, "reports"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(items);
  });
}

export function listenAllFeedback(callback) {
  const q = query(collection(db, "feedback"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(items);
  });
}

// ---- Nutzer-Verwaltung ----

// Die users-Collection ist fuer alle signed-in Nutzer lesbar (siehe
// firestore.rules), nicht nur den Gruender - hier trotzdem als eigene
// Funktion, weil sie speziell fuer die Nutzer-Verwaltung gedacht ist
// (vollstaendige Liste statt einzelner Profile).
export function listenAllUsers(callback) {
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
    callback(items);
  });
}

export async function toggleVerified(uid, verified) {
  await updateDoc(doc(db, "users", uid), { verified });
}

export async function toggleCreator(uid, isCreator) {
  await updateDoc(doc(db, "users", uid), { isCreator });
}

const MIN = 60 * 1000;
export const MANUAL_RESTRICTION_PRESETS = [
  { id: "1h", label: "1 Stunde", ms: 60 * MIN },
  { id: "24h", label: "24 Stunden", ms: 24 * 60 * MIN },
  { id: "7d", label: "7 Tage", ms: 7 * 24 * 60 * MIN },
  { id: "30d", label: "30 Tage", ms: 30 * 24 * 60 * MIN },
];

// durationMs == null hebt eine Sperre auf. strikeWeight bleibt bewusst
// unberuehrt (siehe liftRestriction in ticketService.js - dieselbe Logik,
// hier fuer den direkten Weg ohne Ticket).
export async function setManualRestriction(uid, durationMs) {
  if (durationMs == null) {
    await updateDoc(doc(db, "users", uid), { restrictedUntil: null });
    return;
  }
  const until = new Date(Date.now() + durationMs);
  await updateDoc(doc(db, "users", uid), { restrictedUntil: Timestamp.fromDate(until) });
}

// ---- App-weite Statistiken ----

// getCountFromServer statt alle Dokumente herunterzuladen - guenstig und
// schnell, unabhaengig von der tatsaechlichen Nutzerzahl.
export async function getAppStats() {
  const [users, posts, openTickets, reports, feedback, activeRestrictions, creators] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "posts")),
    getCountFromServer(query(collection(db, "tickets"), where("status", "in", ["escalated", "answered"]))),
    getCountFromServer(collection(db, "reports")),
    getCountFromServer(collection(db, "feedback")),
    getCountFromServer(query(collection(db, "users"), where("restrictedUntil", ">", Timestamp.now()))),
    getCountFromServer(query(collection(db, "users"), where("isCreator", "==", true))),
  ]);
  return {
    userCount: users.data().count,
    postCount: posts.data().count,
    openTicketCount: openTickets.data().count,
    reportCount: reports.data().count,
    feedbackCount: feedback.data().count,
    activeRestrictionCount: activeRestrictions.data().count,
    creatorCount: creators.data().count,
  };
}

// ---- Ankündigungen an alle Nutzer:innen ----
// Bewusst EIN gemeinsames Dokument-Set statt Fan-out in jede einzelne
// notifications-Subcollection - siehe firestore.rules fuer die
// Begruendung. Es gibt KEINE Push-/E-Mail-Benachrichtigung, nur einen
// Banner beim naechsten App-Start (siehe FounderAnnouncementBanner.js).

const TITLE_MAX = 100;
const MESSAGE_MAX = 1000;

export async function createAnnouncement(authorUid, { title, message }) {
  await addDoc(collection(db, "announcements"), {
    authorUid,
    title: (title || "").trim().slice(0, TITLE_MAX),
    message: (message || "").trim().slice(0, MESSAGE_MAX),
    createdAt: serverTimestamp(),
  });
}

export function listenAnnouncements(callback) {
  const q = query(collection(db, "announcements"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(items);
  });
}

export async function deleteAnnouncement(id) {
  await deleteDoc(doc(db, "announcements", id));
}
