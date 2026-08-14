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
  Timestamp,
  updateDoc,
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

// Automatische Sperr-/Timeout-Eskalation: jeder von der automatischen
// Inhaltspruefung blockierte Versuch (siehe contentFilter.js) zaehlt als
// "Strike" mit einem festen Gewicht je Kategorie. "self_harm" zaehlt
// bewusst nie als Strike - das ist keine Regelverletzung, sondern ein Hilferuf.
// Das laufende Gesamtgewicht bestimmt eine eskalierende Sperrzeit, die
// serverseitig in firestore.rules durchgesetzt wird (posts/comments/
// Nachrichten lehnen create waehrend einer aktiven Sperre ab).
//
// Ehrlich eingeordnet: die Strike-Erfassung selbst laeuft ueber den Client
// der betroffenen Person - eine manipulierte App koennte das Schreiben des
// Strikes umgehen. Was sie NICHT kann: eine bereits gesetzte Sperre
// (restrictedUntil) wieder verkuerzen oder aufheben - das lassen die Regeln
// nur in eine Richtung zu (siehe firestore.rules). Die eigentliche
// Inhaltspruefung selbst ist ohnehin bereits serverseitig hart durchgesetzt,
// unabhaengig vom Strike-System.
export const STRIKE_WEIGHTS = {
  spam: 1,
  language: 3,
  threat: 8,
};

// Eskalationsstufen nach kumuliertem Gewicht - je hoeher, desto laenger die
// automatische Sperre. Ab 25 Punkten (z.B. drei Drohungen oder viele
// kleinere Verstoesse) eine sehr lange Sperre ("gesperrt" im Sinne des
// Nutzers), darunter zeitlich gestaffelte Timeouts.
function computeTimeoutMs(cumulativeWeight) {
  const MIN = 60 * 1000;
  if (cumulativeWeight < 3) return 0;
  if (cumulativeWeight < 6) return 15 * MIN;
  if (cumulativeWeight < 10) return 2 * 60 * MIN;
  if (cumulativeWeight < 16) return 24 * 60 * MIN;
  if (cumulativeWeight < 25) return 7 * 24 * 60 * MIN;
  return 30 * 24 * 60 * MIN;
}

// user: das AuthContext-Nutzerobjekt (enthaelt bereits strikeWeight/
// restrictedUntil aus dem live Firestore-Listener, kein Extra-Read noetig).
export async function recordStrike(user, category) {
  const weight = STRIKE_WEIGHTS[category];
  if (!weight || !user?.uid) return;

  await addDoc(collection(db, "users", user.uid, "moderationStrikes"), {
    category,
    weight,
    createdAt: serverTimestamp(),
  });

  const newCumulative = (user.strikeWeight || 0) + weight;
  const timeoutMs = computeTimeoutMs(newCumulative);
  const currentUntil = user.restrictedUntil?.toDate ? user.restrictedUntil.toDate() : null;
  const candidateUntil = timeoutMs > 0 ? new Date(Date.now() + timeoutMs) : null;
  const newUntil = candidateUntil && (!currentUntil || candidateUntil > currentUntil) ? candidateUntil : currentUntil;

  const update = { strikeWeight: newCumulative };
  if (newUntil) update.restrictedUntil = Timestamp.fromDate(newUntil);
  await updateDoc(doc(db, "users", user.uid), update);
}

// { restricted: false } oder { restricted: true, until: Date }
export function getRestrictionStatus(user) {
  const until = user?.restrictedUntil?.toDate ? user.restrictedUntil.toDate() : null;
  if (!until || until.getTime() <= Date.now()) return { restricted: false, until: null };
  return { restricted: true, until };
}

export function formatRestrictionUntil(date) {
  if (!date) return "";
  return date.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

// Fuer den Alert-Dialog, wenn jemand waehrend einer aktiven Sperre etwas
// senden will - wird VOR checkContent() geprueft, damit gesperrte Personen
// gar nicht erst einen Verstoss-Text vorgesetzt bekommen, sondern gleich
// wissen, woran sie sind.
export function getRestrictionAlert(status) {
  return {
    title: "Vorübergehend eingeschränkt",
    message: `Aufgrund wiederholter Verstöße gegen unsere Richtlinien kannst du gerade nichts posten oder senden - noch bis ${formatRestrictionUntil(
      status.until
    )}. Du hältst das für einen Fehler? Eröffne dazu ein Ticket in den Einstellungen.`,
  };
}
