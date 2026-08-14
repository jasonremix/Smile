import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Ohne eigenen Server/Cloud Function schreibt die aktive Person direkt in
// die notifications-Subcollection der Zielperson - abgesichert durch die
// Firestore-Regeln (nur feste Felder, nur erlaubte Typen, fromUid muss dem
// eingeloggten Nutzer entsprechen). Deshalb "from" niemals der eigenen
// Person selbst schicken - macht auch inhaltlich keinen Sinn.
export async function createNotification(toUid, actor, { type, postId, preview } = {}) {
  if (!toUid || toUid === actor?.uid) return;
  await addDoc(collection(db, "users", toUid, "notifications"), {
    type,
    fromUid: actor.uid,
    fromDisplayName: actor.displayName || "Jemand",
    fromUsername: actor.username || null,
    fromAvatarColor: actor.avatarColor || null,
    postId: postId || null,
    preview: preview || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function listenNotifications(uid, callback) {
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenUnreadNotificationCount(uid, callback) {
  const q = query(
    collection(db, "users", uid, "notifications"),
    where("read", "==", false)
  );
  return onSnapshot(q, (snap) => callback(snap.size));
}

export async function markNotificationRead(uid, notificationId) {
  await updateDoc(doc(db, "users", uid, "notifications", notificationId), { read: true });
}

export async function markAllNotificationsRead(uid, notifications) {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, "users", uid, "notifications", n.id), { read: true }));
  await batch.commit();
}

export async function deleteNotification(uid, notificationId) {
  await deleteDoc(doc(db, "users", uid, "notifications", notificationId));
}
