import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// "Was ist gerade los" bleibt so lange sichtbar, danach gilt der Status
// clientseitig als abgelaufen (keine Cloud Function fuer serverseitiges
// Aufraeumen vorhanden - dasselbe Muster wie bei Storys/Streaks).
export const STATUS_TTL_MS = 8 * 60 * 60 * 1000;

export function isStatusActive(status) {
  if (!status?.updatedAt?.toMillis) return false;
  return Date.now() - status.updatedAt.toMillis() < STATUS_TTL_MS;
}

export async function setStatus(uid, text) {
  await updateDoc(doc(db, "users", uid), {
    status: { text: text.trim(), updatedAt: serverTimestamp() },
  });
}

export async function clearStatus(uid) {
  await updateDoc(doc(db, "users", uid), { status: null });
}

// Live-Status mehrerer Connections in einer einzigen Abfrage statt eines
// Listeners pro Person - Firestore erlaubt bis zu 30 Werte in "in".
export function listenFriendsStatuses(uids, callback) {
  if (!uids || uids.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "users"), where(documentId(), "in", uids.slice(0, 30)));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs
        .map((d) => d.data())
        .filter((u) => isStatusActive(u.status))
    );
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// "reason" ist ein kurzer, fuer Menschen lesbarer Text (z.B. "Snap gesendet"),
// der in der Score-Historie angezeigt wird - kein interner Code.
export async function bumpNataScore(uid, amount = 1, reason = "Aktivitaet") {
  await updateDoc(doc(db, "users", uid), {
    nataScore: increment(amount),
  });
  await addDoc(collection(db, "users", uid, "scoreEvents"), {
    amount,
    reason,
    createdAt: serverTimestamp(),
  }).catch(() => {
    // Score-Historie ist ein Zusatz - ein fehlgeschlagener Log-Eintrag darf
    // den eigentlichen Punktezuwachs nicht rueckgaengig machen.
  });
}

export function listenScoreEventsSince(uid, sinceDate, callback) {
  const q = query(
    collection(db, "users", uid, "scoreEvents"),
    where("createdAt", ">=", sinceDate),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
