import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { uploadMedia } from "./mediaUpload";
import { bumpNataScore } from "./userService";

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

// visibility: "friends" (Standard, alle Freunde) oder "custom" (nur visibleTo)
export async function postStory({
  uid,
  displayName,
  avatarColor,
  localUri,
  mediaType,
  visibility = "friends",
  visibleTo = [],
  filter,
}) {
  const mediaUrl = await uploadMedia(localUri, "stories", uid, mediaType);
  await addDoc(collection(db, "users", uid, "stories"), {
    ownerId: uid,
    ownerName: displayName,
    avatarColor,
    mediaUrl,
    mediaType,
    filter: filter || "none",
    viewers: [],
    visibility,
    visibleTo: visibility === "custom" ? visibleTo : [],
    createdAt: serverTimestamp(),
    expiresAtMs: Date.now() + STORY_LIFETIME_MS,
  });

  // Nata Score: +4 fuers Teilen eines Moments.
  await bumpNataScore(uid, 4, "Moment geteilt");
}

// Beobachtet alle Storys von Freunden (inkl. eigener) ueber eine collectionGroup-Abfrage.
export function listenStoriesForUsers(uids, callback, viewerUid) {
  if (!uids || uids.length === 0) {
    callback([]);
    return () => {};
  }

  const q = query(
    collectionGroup(db, "stories"),
    where("ownerId", "in", uids.slice(0, 30)),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const active = snap.docs
      .map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
      .filter((s) => !s.expiresAtMs || s.expiresAtMs > now)
      .filter((s) => {
        if (s.ownerId === viewerUid) return true;
        if (s.visibility !== "custom") return true;
        return (s.visibleTo || []).includes(viewerUid);
      });

    const grouped = {};
    active.forEach((story) => {
      if (!grouped[story.ownerId]) {
        grouped[story.ownerId] = {
          ownerId: story.ownerId,
          ownerName: story.ownerName,
          avatarColor: story.avatarColor,
          items: [],
        };
      }
      grouped[story.ownerId].items.push(story);
    });

    Object.values(grouped).forEach((g) => g.items.reverse());
    callback(Object.values(grouped));
  });
}

export async function markStoryViewed(storyRef, uid) {
  await updateDoc(storyRef, {
    viewers: arrayUnion(uid),
  });
}

// Momente-Archiv: Storys "leben" in Firestore ohnehin unbegrenzt weiter (kein
// TTL/Cleanup-Job, expiresAtMs wird nur clientseitig zum Filtern der
// 24h-Ansicht genutzt) - Archivieren markiert einen Moment lediglich als
// dauerhaft auffindbar, es wird keine neue Kopie hochgeladen.
export async function archiveStory(storyRef) {
  await updateDoc(storyRef, { archived: true, archivedAt: serverTimestamp() });
}

export async function unarchiveStory(storyRef) {
  await updateDoc(storyRef, { archived: false, archivedAt: null });
}

// Doppel-Tipp-Reaktion (siehe StoryViewerScreen.js) - eine Person kann pro
// Moment maximal eine Reaktion hinterlassen (docId = eigene uid), erneutes
// Doppel-Tippen ueberschreibt einfach dasselbe Dokument.
export async function reactToStory(storyRef, uid) {
  await setDoc(doc(storyRef, "reactions", uid), {
    type: "heart",
    createdAt: serverTimestamp(),
  });
}

export function listenMyArchivedStories(uid, callback) {
  const q = query(
    collection(db, "users", uid, "stories"),
    where("archived", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })));
  });
}
