import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { bumpNataScore } from "./userService";

export async function createPost({ authorId, authorName, authorAvatarColor, authorVerified, text }) {
  const postRef = await addDoc(collection(db, "posts"), {
    authorId,
    authorName,
    authorAvatarColor: authorAvatarColor || null,
    authorVerified: !!authorVerified,
    text,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  await bumpNataScore(authorId, 2, "Beitrag gepostet");
  return postRef.id;
}

// "Fuer dich": alle Beitraege, neueste zuerst.
export function listenFeed(callback) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// "Following": nur Beitraege der eigenen Connections - Firestore "in"
// unterstuetzt maximal 30 Werte, fuer eine Beta mit wenigen Nutzer:innen
// ausreichend.
export function listenFollowingFeed(connectionIds, callback) {
  if (!connectionIds || connectionIds.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, "posts"),
    where("authorId", "in", connectionIds.slice(0, 30)),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}

export function listenIsLiked(postId, uid, callback) {
  return onSnapshot(doc(db, "posts", postId, "likes", uid), (snap) => callback(snap.exists()));
}

export async function likePost(postId, uid) {
  await setDoc(doc(db, "posts", postId, "likes", uid), { createdAt: serverTimestamp() });
  await updateDoc(doc(db, "posts", postId), { likeCount: increment(1) });
}

export async function unlikePost(postId, uid) {
  await deleteDoc(doc(db, "posts", postId, "likes", uid));
  await updateDoc(doc(db, "posts", postId), { likeCount: increment(-1) });
}

export function listenComments(postId, callback) {
  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addComment(postId, { authorId, authorName, text }) {
  await addDoc(collection(db, "posts", postId, "comments"), {
    authorId,
    authorName,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
}

export function listenIsSaved(uid, postId, callback) {
  return onSnapshot(doc(db, "users", uid, "savedPosts", postId), (snap) => callback(snap.exists()));
}

export async function savePost(uid, postId) {
  await setDoc(doc(db, "users", uid, "savedPosts", postId), { createdAt: serverTimestamp() });
}

export async function unsavePost(uid, postId) {
  await deleteDoc(doc(db, "users", uid, "savedPosts", postId));
}
