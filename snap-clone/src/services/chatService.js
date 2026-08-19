import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { createNotification } from "./notificationService";
import { bumpNataScore } from "./userService";
import { uploadVoiceMessage } from "./voiceService";

const STREAK_MILESTONES = [7, 30, 100, 365];

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

  const reachedMilestone = await runTransaction(db, async (tx) => {
    const snap = await tx.get(chatRef);
    const data = snap.exists() ? snap.data() : {};
    const sentToday = { ...(data.streakSentToday || {}) };
    sentToday[sender.uid] = today;

    let streakCount = data.streakCount || 0;
    let streakLastDate = data.streakLastDate || null;
    let milestone = null;

    const bothSentToday = sentToday[sender.uid] === today && sentToday[recipient.uid] === today;
    if (bothSentToday && streakLastDate !== today) {
      streakCount = streakLastDate && daysBetween(streakLastDate, today) === 1 ? streakCount + 1 : 1;
      streakLastDate = today;
      if (STREAK_MILESTONES.includes(streakCount)) milestone = streakCount;
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

    return milestone;
  });

  // Streak-Jubilaeum: beide Seiten bekommen eine Benachrichtigung - jeweils
  // mit der ANDEREN Person als "fromUid" (Benachrichtigungsregeln verbieten
  // fromUid == Empfaenger). Best effort, ausserhalb der Transaktion.
  if (reachedMilestone) {
    createNotification(recipient.uid, sender, {
      type: "streak_milestone",
      preview: `${reachedMilestone} Tage in Folge`,
    }).catch(() => {});
    createNotification(sender.uid, recipient, {
      type: "streak_milestone",
      preview: `${reachedMilestone} Tage in Folge`,
    }).catch(() => {});
  }
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

// visibleAt (optional): Zeitkapsel-Nachricht - die Nachricht existiert ab
// sofort in Firestore, wird aber erst ab diesem Zeitpunkt im Chat
// angezeigt (siehe MessageBubble.js). Rein clientseitig verzoegert, kein
// echter Verschluesselungsschutz. Die Vorschau in der Chat-Liste zeigt in
// dem Fall bewusst nicht den echten Text, sonst waere die Ueberraschung hin.
export async function sendMessage(chatId, senderId, text, visibleAt) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
    ...(visibleAt ? { visibleAt } : {}),
  });

  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: visibleAt ? "🕐 Zeitkapsel-Nachricht" : text,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await bumpNataScore(senderId, 3, "Nachricht gesendet");
}

// Sprachnachricht (Beta) - braucht Firebase Storage. Wirft weiter, wenn der
// Upload fehlschlaegt (z.B. weil Storage noch nicht eingerichtet ist),
// damit ChatScreen der Person eine ehrliche Erklaerung statt eines
// generischen Fehlers zeigen kann.
export async function sendVoiceMessage(chatId, senderId, localUri, durationMs) {
  const voiceUrl = await uploadVoiceMessage(localUri, senderId);
  const messagesRef = collection(db, "chats", chatId, "messages");
  await addDoc(messagesRef, {
    senderId,
    voiceUrl,
    voiceDurationMs: durationMs,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: "Sprachnachricht",
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await bumpNataScore(senderId, 3, "Sprachnachricht gesendet");
}

// "Tippt..."-Status pro Nutzer als verschachteltes Feld auf dem Chat-Dokument
// - setDoc mit merge:true fuehrt verschachtelte Maps zusammen, ueberschreibt
// also nur den eigenen Eintrag, nicht den der anderen Person.
export async function setTypingStatus(chatId, uid, isTyping) {
  await setDoc(doc(db, "chats", chatId), { typing: { [uid]: isTyping } }, { merge: true });
}

// Merkt sich, bis wann eine Person einen Chat zuletzt gelesen hat - damit
// laesst sich clientseitig ein "ungelesen"-Badge berechnen, ohne Push-
// Benachrichtigungen (die einen bezahlten Firebase-Plan brauchen wuerden).
export async function markChatRead(chatId, uid) {
  await setDoc(doc(db, "chats", chatId), { lastReadAt: { [uid]: serverTimestamp() } }, { merge: true });
}

// Gemeinsames Streak-Ziel (siehe firestore.rules: sharedGoalDays/-Status/
// -ProposedBy) - eine Person schlaegt vor, die andere nimmt an/lehnt ab.
// "reached" wird clientseitig gesetzt, sobald streakCount >= sharedGoalDays
// erreicht (siehe ChatScreen.js), kein Cloud-Function-Trigger noetig.
export async function proposeSharedGoal(chatId, uid, days) {
  await updateDoc(doc(db, "chats", chatId), {
    sharedGoalDays: days,
    sharedGoalStatus: "proposed",
    sharedGoalProposedBy: uid,
  });
}

export async function respondToSharedGoal(chatId, accept) {
  await updateDoc(doc(db, "chats", chatId), {
    sharedGoalStatus: accept ? "active" : "declined",
  });
}

export async function markSharedGoalReached(chatId) {
  await updateDoc(doc(db, "chats", chatId), {
    sharedGoalStatus: "reached",
    sharedGoalReachedAt: serverTimestamp(),
  });
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

export async function editMessage(chatId, messageId, text) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), { text, edited: true });
}

export async function deleteMessage(chatId, messageId) {
  await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
}

export function listenReactions(chatId, messageId, callback) {
  return onSnapshot(collection(db, "chats", chatId, "messages", messageId, "reactions"), (snap) => {
    callback(snap.docs.map((d) => d.id));
  });
}

export async function toggleReaction(chatId, messageId, uid, isReacting) {
  const reactionRef = doc(db, "chats", chatId, "messages", messageId, "reactions", uid);
  if (isReacting) {
    await setDoc(reactionRef, { createdAt: serverTimestamp() });
  } else {
    await deleteDoc(reactionRef);
  }
}
