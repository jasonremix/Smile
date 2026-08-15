import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const MAX_CIRCLE_NAME_LENGTH = 30;
export const MAX_CIRCLES_PER_USER = 15;

// Eigene, benannte Kreise (z.B. "Familie", "Arbeit", "Gaming") - anders als
// die eine feste "Enge Freunde"-Liste kann man hier beliebig viele eigene
// Gruppen anlegen, um beim Teilen eines Moments gezielt nur einen Ausschnitt
// der eigenen Connections auszuwaehlen. Rein privat: nur der Owner selbst
// liest/schreibt diese Subcollection (siehe firestore.rules).
export function listenCircles(uid, callback) {
  const q = query(collection(db, "users", uid, "circles"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createCircle(uid, { name, emoji, memberUids }) {
  await addDoc(collection(db, "users", uid, "circles"), {
    name: name.trim().slice(0, MAX_CIRCLE_NAME_LENGTH),
    emoji: emoji || "💜",
    memberUids: memberUids || [],
    createdAt: serverTimestamp(),
  });
}

export async function updateCircle(uid, circleId, { name, emoji, memberUids }) {
  const data = {};
  if (name !== undefined) data.name = name.trim().slice(0, MAX_CIRCLE_NAME_LENGTH);
  if (emoji !== undefined) data.emoji = emoji;
  if (memberUids !== undefined) data.memberUids = memberUids;
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "users", uid, "circles", circleId), data);
}

export async function deleteCircle(uid, circleId) {
  await deleteDoc(doc(db, "users", uid, "circles", circleId));
}
