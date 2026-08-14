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
import { uploadMedia } from "./mediaUpload";
import { createNotification } from "./notificationService";
import { bumpNataScore } from "./userService";

// Statt jeden jemals erstellten Beitrag live zu abonnieren (waechst
// unbegrenzt mit der App-Nutzung), laedt jeder Feed nur eine Seite auf
// einmal. Die erste Seite bleibt echtzeit-aktuell (onSnapshot), weitere
// Seiten werden bei Bedarf einmalig nachgeladen (fetchMore*) - aeltere
// Beitraege muessen nicht live aktualisiert werden.
export const POSTS_PAGE_SIZE = 20;

// localMediaUri: optionaler lokaler Foto-Pfad aus der Kamera (siehe
// CreatePostScreen.js) - wird vor dem eigentlichen Post-Dokument
// hochgeladen, genau wie bei Snaps/Momenten. Beitraege bleiben weiterhin
// nur mit Text moeglich; ein Foto ist eine optionale Ergaenzung, kein
// Ersatz.
export async function createPost({
  authorId,
  authorName,
  authorUsername,
  authorAvatarColor,
  authorVerified,
  text,
  localMediaUri,
  filter,
}) {
  // "stories" statt eines eigenen "posts"-Pfads: das Service-Konto dieser
  // Session hat keine Berechtigung, eine NEUE Storage-Regeln-Freigabe
  // anzulegen (nur bereits bestehende Freigaben aktualisieren) - der
  // stories/-Pfad ist bereits fuer Bilder freigegeben und rein nach uid
  // organisiert, ohne inhaltliche Kopplung an "Momente". Kein Sicherheits-
  // Kompromiss, nur Wiederverwendung eines schon funktionierenden Pfads.
  const mediaUrl = localMediaUri ? await uploadMedia(localMediaUri, "stories", authorId, "photo") : null;
  const postRef = await addDoc(collection(db, "posts"), {
    authorId,
    authorName,
    authorUsername: authorUsername || null,
    authorAvatarColor: authorAvatarColor || null,
    authorVerified: !!authorVerified,
    text,
    mediaUrl,
    filter: mediaUrl ? filter || "none" : null,
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

// "type" ist eine der REACTION_IDS aus utils/postReactions.js. Alte
// Likes ohne type-Feld (vor Einfuehrung mehrerer Reaktionen) gelten als
// "heart" - volle Abwaertskompatibilitaet ohne Migration.
export function listenMyReaction(postId, uid, callback) {
  return onSnapshot(doc(db, "posts", postId, "likes", uid), (snap) =>
    callback(snap.exists() ? snap.data().type || "heart" : null)
  );
}

// previousType kommt vom Aufrufer (aus listenMyReaction), damit hier kein
// zusaetzlicher Read noetig ist. Erneutes Antippen derselben Reaktion nimmt
// sie zurueck (Toggle), ein anderer Typ ersetzt die alte Reaktion 1:1 -
// likeCount (Gesamtzahl aller Reaktionen) aendert sich dabei nicht, nur
// beim allerersten bzw. beim vollstaendigen Entfernen einer Reaktion.
export async function setReaction(postId, uid, type, previousType, postAuthorId, actor) {
  const ref = doc(db, "posts", postId, "likes", uid);
  if (previousType === type) {
    await deleteDoc(ref);
    await updateDoc(doc(db, "posts", postId), {
      likeCount: increment(-1),
      [`reactions.${type}`]: increment(-1),
    });
    return;
  }

  await setDoc(ref, { type, createdAt: serverTimestamp() });
  const updates = { [`reactions.${type}`]: increment(1) };
  if (previousType) {
    updates[`reactions.${previousType}`] = increment(-1);
  } else {
    updates.likeCount = increment(1);
  }
  await updateDoc(doc(db, "posts", postId), updates);
  if (postAuthorId && actor && !previousType) {
    await createNotification(postAuthorId, actor, { type: "like", postId });
  }
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

// Die savedPosts-Subcollection speichert nur {createdAt} je Beitrags-ID
// (siehe Regel: rein privat, keine weiteren Felder noetig) - hier werden
// die eigentlichen Beitragsdaten pro gemerktem Beitrag nachgeladen.
// Geloeschte Beitraege (Original nicht mehr vorhanden) werden stillschweigend
// uebersprungen statt einen kaputten Eintrag anzuzeigen.
export function listenSavedPosts(uid, callback) {
  const q = query(collection(db, "users", uid, "savedPosts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, async (snap) => {
    const postIds = snap.docs.map((d) => d.id);
    const posts = await Promise.all(
      postIds.map(async (id) => {
        const postSnap = await getDoc(doc(db, "posts", id));
        return postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null;
      })
    );
    callback(posts.filter(Boolean));
  });
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
