import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
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

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

async function uploadMedia(localUri) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const filename = `stories/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function postStory({ uid, displayName, avatarColor, localUri, mediaType }) {
  const mediaUrl = await uploadMedia(localUri);
  await addDoc(collection(db, "users", uid, "stories"), {
    ownerId: uid,
    ownerName: displayName,
    avatarColor,
    mediaUrl,
    mediaType,
    viewers: [],
    createdAt: serverTimestamp(),
    expiresAtMs: Date.now() + STORY_LIFETIME_MS,
  });

  // Nata Score: +1 fuers Teilen einer Story.
  await bumpNataScore(uid, 1);
}

// Beobachtet alle Storys von Freunden (inkl. eigener) ueber eine collectionGroup-Abfrage.
export function listenStoriesForUsers(uids, callback) {
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
      .filter((s) => !s.expiresAtMs || s.expiresAtMs > now);

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
