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
import { bumpNataScore } from "./userService";

const SNAP_LIFETIME_MS = 24 * 60 * 60 * 1000; // Snap verschwindet spaetestens nach 24h ungeoeffnet

async function uploadMedia(localUri, folder, uid, mediaType) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const extension = mediaType === "video" ? "mp4" : "jpg";
  const contentType = mediaType === "video" ? "video/mp4" : "image/jpeg";
  const filename = `${folder}/${uid}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

// Verschickt einen Snap an mehrere Freunde. Fuer jeden Empfaenger wird ein
// eigenes Dokument angelegt, damit "gesehen"-Status pro Person getrennt ist.
export async function sendSnap({ senderId, senderName, recipientIds, localUri, mediaType, viewDuration }) {
  const mediaUrl = await uploadMedia(localUri, "snaps", senderId, mediaType);

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

  // Nata Score: +1 pro verschicktem Snap (wie beim Senden gewohnt).
  await bumpNataScore(senderId, recipientIds.length);
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

export async function markSnapViewed(snapId, viewerId) {
  await updateDoc(doc(db, "snaps", snapId), { viewed: true, viewedAt: serverTimestamp() });
  // Nata Score: +1 fuers Ansehen, genau wie beim Verschicken.
  if (viewerId) {
    await bumpNataScore(viewerId, 1);
  }
}

// Nach dem Ansehen wird der Snap (wie in Snapchat ueblich) geloescht.
export async function deleteSnap(snapId) {
  await deleteDoc(doc(db, "snaps", snapId));
}
