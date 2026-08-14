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
import { db } from "../config/firebase";
import { recordStreakSnap } from "./chatService";
import { uploadMedia } from "./mediaUpload";
import { bumpNataScore, getUserProfile } from "./userService";

const SNAP_LIFETIME_MS = 24 * 60 * 60 * 1000; // Snap verschwindet spaetestens nach 24h ungeoeffnet

// Verschickt einen Snap an mehrere Freunde. Fuer jeden Empfaenger wird ein
// eigenes Dokument angelegt, damit "gesehen"-Status pro Person getrennt ist.
export async function sendSnap({ senderId, senderName, recipientIds, localUri, mediaType, viewDuration, filter }) {
  const mediaUrl = await uploadMedia(localUri, "snaps", senderId, mediaType);

  const writes = recipientIds.map((recipientId) =>
    addDoc(collection(db, "snaps"), {
      senderId,
      senderName,
      recipientId,
      mediaUrl,
      mediaType, // "photo" | "video"
      filter: filter || "none",
      viewDuration: viewDuration || 5,
      viewed: false,
      createdAt: serverTimestamp(),
      expiresAtMs: Date.now() + SNAP_LIFETIME_MS,
    })
  );

  await Promise.all(writes);

  // Nata Score: +3 pro verschicktem Snap.
  await bumpNataScore(senderId, recipientIds.length * 3, "Snap gesendet");

  // Streaks aktualisieren - darf den erfolgreichen Snap-Versand nicht
  // nachtraeglich fehlschlagen lassen, daher pro Empfaenger einzeln
  // abgefangen statt mit Promise.all durchgereicht.
  await Promise.all(
    recipientIds.map(async (recipientId) => {
      try {
        const recipientProfile = await getUserProfile(recipientId);
        if (!recipientProfile) return;
        await recordStreakSnap(
          { uid: senderId, displayName: senderName },
          { uid: recipientId, displayName: recipientProfile.displayName }
        );
      } catch {
        // Streak-Update ist best effort - der Snap selbst ist bereits verschickt.
      }
    })
  );
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
  // Nata Score: +2 fuers Ansehen.
  if (viewerId) {
    await bumpNataScore(viewerId, 2, "Snap angesehen");
  }
}

// Verbraucht das einmalige Replay eines Snaps. Die Firestore-Regel laesst
// dieses Feld nur von false/undefined auf true zu, nie zurueck - ein
// zweites Replay ist damit auch bei einem erneuten App-Start ausgeschlossen.
export async function markSnapReplayed(snapId) {
  await updateDoc(doc(db, "snaps", snapId), { replayUsed: true });
}

// Nach dem Ansehen wird der Snap (wie in Snapchat ueblich) geloescht.
export async function deleteSnap(snapId) {
  await deleteDoc(doc(db, "snaps", snapId));
}
