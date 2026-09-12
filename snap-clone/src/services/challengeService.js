import { arrayUnion, collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../config/firebase";

// Dokument-ID = Tag-Slug (siehe firestore.rules: posts/{postId}.tag wird
// direkt per exists()/get() gegen challenges/{tag} geprueft, damit ein
// Beitrag nur einer wirklich existierenden, gerade laufenden Challenge
// zugeordnet werden kann - kein Query in der Regel noetig).
function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
}

export async function createChallenge(founderUid, { title, description, days }) {
  const tag = slugify(title);
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + days * 24 * 60 * 60 * 1000);
  await setDoc(doc(db, "challenges", tag), {
    tag,
    title: title.trim().slice(0, 60),
    description: (description || "").trim().slice(0, 300),
    startAt,
    endAt,
    createdBy: founderUid,
    createdAt: serverTimestamp(),
  });
  return tag;
}

export function listenActiveChallenges(callback) {
  const q = query(collection(db, "challenges"), orderBy("startAt", "desc"), limit(20));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => c.endAt?.toMillis?.() >= now);
    callback(items);
  });
}

export function listenChallenge(tag, callback) {
  return onSnapshot(doc(db, "challenges", tag), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function listenChallengeFeed(tag, callback, pageSize = 30) {
  const q = query(
    collection(db, "posts"),
    where("tag", "==", tag),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Teilnahme-Abzeichen: wer zu einer Challenge postet, bekommt das
// Challenge-Abzeichen dauerhaft auf dem eigenen Profil (siehe
// firestore.rules: seasonalBadges, selbst geschrieben). Reine
// Teilnahme-Anerkennung, kein Leistungs-/Gewinner-Vergleich.
export async function awardChallengeBadge(uid, tag) {
  await updateDoc(doc(db, "users", uid), { seasonalBadges: arrayUnion(tag) });
}

export async function getChallengeParticipantCount(tag) {
  const q = query(collection(db, "posts"), where("tag", "==", tag));
  const snap = await getDocs(q);
  const authors = new Set(snap.docs.map((d) => d.data().authorId));
  return { postCount: snap.size, participantCount: authors.size };
}
