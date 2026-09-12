import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
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

// ---- Kohorten-Retention (siehe FounderStatsScreen.js) ----

// lastActiveAt wird erst seit diesem Feature geschrieben (siehe
// HomeScreen.js) - fuer Konten, die sich seitdem nie erneut angemeldet
// haben, bleibt das Feld leer. Das ist absichtlich ehrlich statt eine
// rueckwirkende Aktivitaet vorzutaeuschen: die Quote zeigt nur echte,
// seit Einfuehrung dieser Funktion gemessene Rueckkehr.
const DAY_MS = 24 * 60 * 60 * 1000;

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function computeRetentionCohorts() {
  const snap = await getDocs(collection(db, "users"));
  const cohorts = {};

  snap.docs.forEach((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.();
    if (!createdAt) return;
    const lastActiveAt = data.lastActiveAt?.toMillis?.() || null;
    const weekKey = mondayOf(createdAt).toISOString();
    if (!cohorts[weekKey]) {
      cohorts[weekKey] = { total: 0, returnedDay1: 0, returnedDay7: 0, returnedDay30: 0 };
    }
    const c = cohorts[weekKey];
    c.total += 1;
    if (lastActiveAt) {
      if (lastActiveAt - createdAt >= DAY_MS) c.returnedDay1 += 1;
      if (lastActiveAt - createdAt >= 7 * DAY_MS) c.returnedDay7 += 1;
      if (lastActiveAt - createdAt >= 30 * DAY_MS) c.returnedDay30 += 1;
    }
  });

  return Object.entries(cohorts)
    .map(([weekKey, c]) => ({
      week: new Date(weekKey),
      total: c.total,
      day1Pct: c.total ? Math.round((c.returnedDay1 / c.total) * 100) : 0,
      day7Pct: c.total ? Math.round((c.returnedDay7 / c.total) * 100) : 0,
      day30Pct: c.total ? Math.round((c.returnedDay30 / c.total) * 100) : 0,
    }))
    .sort((a, b) => b.week - a.week)
    .slice(0, 8);
}

// ---- Feature-Flags (siehe FounderFeatureFlagsScreen.js) ----
// Rein clientseitig ausgewertet (kein Cloud-Function-Backend) - reicht aber,
// um ein neues Feature bei Bedarf schnell fuer alle auszublenden, ohne
// einen neuen OTA-Publish abzuwarten.

export const FEATURE_FLAG_KEYS = [
  { id: "challenges", label: "Challenges" },
  { id: "storyPolls", label: "Umfrage-Sticker in Momenten" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "sharedGoals", label: "Gemeinsame Streak-Ziele" },
  { id: "collabPosts", label: "Collab-Beiträge" },
  { id: "quotePosts", label: "Zitat-Beiträge" },
];

export function listenFeatureFlags(callback) {
  const q = query(collection(db, "featureFlags"));
  return onSnapshot(q, (snap) => {
    const flags = {};
    snap.docs.forEach((d) => {
      flags[d.id] = d.data().enabled !== false;
    });
    callback(flags);
  });
}

export async function setFeatureFlag(flagId, enabled) {
  await setDoc(doc(db, "featureFlags", flagId), { enabled, updatedAt: serverTimestamp() });
}
