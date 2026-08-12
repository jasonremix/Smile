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
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../config/firebase";

const SNAP_LIFETIME_MS = 24 * 60 * 60 * 1000; // Snap verschwindet spaetestens nach 24h ungeoeffnet

async function uploadMedia(localUri, folder) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const filename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

// Verschickt einen Snap an mehrere Freunde. Fuer jeden Empfaenger wird ein
// eigenes Dokument angelegt, damit "gesehen"-Status pro Person getrennt ist.
export async function sendSnap({ senderId, senderName, recipientIds, localUri, mediaType, viewDuration }) {
  const mediaUrl = await uploadMedia(localUri, "snaps");

  const writes = recipientIds.map((recipientId) =>
    addDoc(collection(db, "snaps"), {
      senderId,
      senderName,
      recipientId,
      mediaUrl,
      mediaType, // "photo" | "video"
      viewDuration: viewDuration || 5,
      viewed: false,
      createdAt: serverTimestamp(),
      expiresAtMs: Date.now() + SNAP_LIFETIME_MS,
    })
  );

  await Promise.all(writes);
}

export function listenIncomingSnaps(uid, callback) {
  const q = query(
    collection(db, "snaps"),
    where("recipientId", "==", uid),
    where("viewed", "==", false),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => !s.expiresAtMs || s.expiresAtMs > now);
    callback(active);
  });
}

export async function markSnapViewed(snapId) {
  await updateDoc(doc(db, "snaps", snapId), { viewed: true, viewedAt: serverTimestamp() });
}

// Nach dem Ansehen wird der Snap (wie in Snapchat ueblich) geloescht.
export async function deleteSnap(snapId) {
  await deleteDoc(doc(db, "snaps", snapId));
}
