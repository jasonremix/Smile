import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { createNotification } from "./notificationService";
import { bumpNataScore } from "./userService";

// Statt jeden jemals erstellten Beitrag live zu abonnieren (waechst
// unbegrenzt mit der App-Nutzung), laedt jeder Feed nur eine Seite auf
// einmal. Die erste Seite bleibt echtzeit-aktuell (onSnapshot), weitere
// Seiten werden bei Bedarf einmalig nachgeladen (fetchMore*) - aeltere
// Beitraege muessen nicht live aktualisiert werden.
export const POSTS_PAGE_SIZE = 20;

export async function createPost({
  authorId,
  authorName,
  authorUsername,
  authorAvatarColor,
  authorVerified,
  text,
}) {
  const postRef = await addDoc(collection(db, "posts"), {
    authorId,
    authorName,
    authorUsername: authorUsername || null,
    authorAvatarColor: authorAvatarColor || null,
    authorVerified: !!authorVerified,
    text,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  await bumpNataScore(authorId, 6, "Beitrag gepostet");
  return postRef.id;
}

// "Fuer dich": neueste Beitraege zuerst, seitenweise.
export function listenFeed(callback, pageSize = POSTS_PAGE_SIZE) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(pageSize));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      snap.docs[snap.docs.length - 1] || null
    );
  });
}

export async function fetchMorePosts(lastDoc, pageSize = POSTS_PAGE_SIZE) {
  if (!lastDoc) return { posts: [], lastDoc: null, hasMore: false };
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  };
}

// "Following": nur Beitraege der eigenen Connections - Firestore "in"
// unterstuetzt maximal 30 Werte, fuer eine Beta mit wenigen Nutzer:innen
// ausreichend.
export function listenFollowingFeed(connectionIds, callback, pageSize = POSTS_PAGE_SIZE) {
  if (!connectionIds || connectionIds.length === 0) {
    callback([], null);
    return () => {};
  }
  const q = query(
    collection(db, "posts"),
    where("authorId", "in", connectionIds.slice(0, 30)),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      snap.docs[snap.docs.length - 1] || null
    );
  });
}

export async function fetchMoreFollowingPosts(connectionIds, lastDoc, pageSize = POSTS_PAGE_SIZE) {
  if (!lastDoc || !connectionIds || connectionIds.length === 0) {
    return { posts: [], lastDoc: null, hasMore: false };
  }
  const q = query(
    collection(db, "posts"),
    where("authorId", "in", connectionIds.slice(0, 30)),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  };
}

// Eigene Beitraege einer bestimmten Person - fuers Profil (eigenes oder
// fremdes).
export function listenUserPosts(uid, callback, pageSize = POSTS_PAGE_SIZE) {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      snap.docs[snap.docs.length - 1] || null
    );
  });
}

export async function fetchMoreUserPosts(uid, lastDoc, pageSize = POSTS_PAGE_SIZE) {
  if (!lastDoc) return { posts: [], lastDoc: null, hasMore: false };
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  };
}

// Echte Gesamtanzahl fuer die Profil-Statistik, unabhaengig von der
// paginierten Beitragsliste (die nach dem ersten Laden nur eine Seite
// enthaelt) - eine Aggregat-Abfrage kostet nur eine einzelne Lese-Operation,
// unabhaengig von der Menge der Beitraege.
export async function getUserPostCount(uid) {
  const q = query(collection(db, "posts"), where("authorId", "==", uid));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}

export function listenIsLiked(postId, uid, callback) {
  return onSnapshot(doc(db, "posts", postId, "likes", uid), (snap) => callback(snap.exists()));
}

// postAuthorId + actor sind optional, damit bestehende Aufrufer ohne
// Notification-Kontext (falls es welche gibt) nicht brechen - createNotification
// selbst ignoriert leere toUid/actor bereits sicher.
export async function likePost(postId, uid, postAuthorId, actor) {
  await setDoc(doc(db, "posts", postId, "likes", uid), { createdAt: serverTimestamp() });
  await updateDoc(doc(db, "posts", postId), { likeCount: increment(1) });
  if (postAuthorId && actor) {
    await createNotification(postAuthorId, actor, { type: "like", postId });
  }
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

export async function addComment(postId, { authorId, authorName, text }, postAuthorId, actor) {
  await addDoc(collection(db, "posts", postId, "comments"), {
    authorId,
    authorName,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
  if (postAuthorId && actor) {
    await createNotification(postAuthorId, actor, { type: "comment", postId, preview: text.slice(0, 120) });
  }
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

// Firestore kann keine Volltextsuche - ohne einen externen Suchdienst
// (Algolia o.ae.) bleibt fuer eine Beta mit ueberschaubarer Postmenge nur
// eine clientseitige Filterung ueber die letzten Beitraege. Bewusst
// begrenzt (200 neueste), damit das nicht unbegrenzt Daten laedt.
export async function searchRecentPosts(term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((post) => (post.text || "").toLowerCase().includes(needle))
    .slice(0, 20);
}
