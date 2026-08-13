import {
  addDoc,
  collection,
  doc,
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
