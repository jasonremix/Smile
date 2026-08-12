import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Sucht Nutzer anhand des Benutzernamens (Praefix-Suche).
export async function searchUsersByUsername(searchTerm, currentUid) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    orderBy("username"),
    where("username", ">=", term),
    where("username", "<=", term + ""),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data())
    .filter((u) => u.uid !== currentUid);
}

export async function sendFriendRequest(fromUser, toUser) {
  const requestsRef = collection(db, "friendRequests");
  await addDoc(requestsRef, {
    from: fromUser.uid,
    fromUsername: fromUser.username,
    fromDisplayName: fromUser.displayName,
    to: toUser.uid,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export function listenIncomingRequests(uid, callback) {
  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", uid),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function acceptFriendRequest(request, currentUser) {
  await updateDoc(doc(db, "friendRequests", request.id), { status: "accepted" });

  await setDoc(doc(db, "users", currentUser.uid, "friends", request.from), {
    uid: request.from,
    displayName: request.fromDisplayName,
    username: request.fromUsername,
    addedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", request.from, "friends", currentUser.uid), {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
    username: currentUser.username,
    addedAt: serverTimestamp(),
  });
}

export async function declineFriendRequest(request) {
  await updateDoc(doc(db, "friendRequests", request.id), { status: "declined" });
}

export function listenFriends(uid, callback) {
  const q = query(collection(db, "users", uid, "friends"), orderBy("displayName"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data()));
  });
}
