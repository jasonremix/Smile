import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
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

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateStringA, dateStringB) {
  const a = new Date(`${dateStringA}T00:00:00Z`);
  const b = new Date(`${dateStringB}T00:00:00Z`);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

// Ob ein gespeicherter Streak noch "lebt" - ohne Cloud Function kann niemand
// serverseitig automatisch zuruecksetzen, wenn ein Tag verpasst wird, daher
// wird das beim Anzeigen einfach anhand des letzten Streak-Datums live
// nachgerechnet (faellt der letzte Tag mehr als 1 Tag zurueck, ist er vorbei).
export function isStreakActive(streakLastDate) {
  if (!streakLastDate) return false;
  return daysBetween(streakLastDate, todayString()) <= 1;
}

// Streak-Update beim Senden eines Snaps: der gemeinsame Zaehler steigt nur,
// wenn an einem Kalendertag BEIDE Seiten mindestens einen Snap verschickt
// haben, und auch nur um jeweils genau 1 pro Tag.
export async function recordStreakSnap(sender, recipient) {
  const chatId = getChatId(sender.uid, recipient.uid);
  const chatRef = doc(db, "chats", chatId);
  const today = todayString();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(chatRef);
    const data = snap.exists() ? snap.data() : {};
    const sentToday = { ...(data.streakSentToday || {}) };
    sentToday[sender.uid] = today;

    let streakCount = data.streakCount || 0;
    let streakLastDate = data.streakLastDate || null;

    const bothSentToday = sentToday[sender.uid] === today && sentToday[recipient.uid] === today;
    if (bothSentToday && streakLastDate !== today) {
      streakCount = streakLastDate && daysBetween(streakLastDate, today) === 1 ? streakCount + 1 : 1;
      streakLastDate = today;
    }

    tx.set(
      chatRef,
      {
        participants: [sender.uid, recipient.uid],
        participantNames: {
          [sender.uid]: sender.displayName,
          [recipient.uid]: recipient.displayName,
        },
        streakCount,
        streakLastDate,
        streakSentToday: sentToday,
        // Ohne updatedAt wuerde der Chat vom "orderBy(updatedAt)" in
        // listenChats ausgefiltert und in der Liste nie auftauchen - relevant,
        // wenn zwei Freunde bisher nur Snaps und noch nie Nachrichten
        // ausgetauscht haben.
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
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

export function listenChat(chatId, callback) {
  return onSnapshot(doc(db, "chats", chatId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
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
