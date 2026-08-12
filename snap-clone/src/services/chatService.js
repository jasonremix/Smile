import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Deterministische Chat-ID aus den beiden Nutzer-IDs, damit fuer ein Paar
// immer derselbe Chat-Dokumentpfad verwendet wird.
export function getChatId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

export async function getOrCreateChat(currentUser, otherUser) {
  const chatId = getChatId(currentUser.uid, otherUser.uid);
  const chatRef = doc(db, "chats", chatId);

  await setDoc(
    chatRef,
    {
      participants: [currentUser.uid, otherUser.uid],
      participantNames: {
        [currentUser.uid]: currentUser.displayName,
        [otherUser.uid]: otherUser.displayName,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return chatId;
}

export function listenChats(uid, callback) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendMessage(chatId, senderId, text) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: text,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function listenMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
