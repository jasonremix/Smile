const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

initializeApp();
const db = getFirestore();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Expo erlaubt bis zu 100 Nachrichten pro Aufruf - bei uns (Beta-Groesse)
// nie relevant, aber schadet nicht, sauber zu chunk-en.
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

// Alle Push-Sende-Fehler sind bewusst best effort/geloggt statt den
// aufrufenden Trigger fehlschlagen zu lassen - eine fehlgeschlagene
// Benachrichtigung darf nie die eigentliche Aktion (Like, Nachricht, ...)
// im Client rueckwirkend als Fehler erscheinen lassen (die ist zu diesem
// Zeitpunkt laengst erfolgreich in Firestore geschrieben).
async function sendExpoPush(messages) {
  const valid = messages.filter((m) => m.to && typeof m.to === "string" && m.to.startsWith("ExponentPushToken"));
  if (valid.length === 0) return;
  for (const batch of chunk(valid, 100)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        logger.warn("Expo push batch fehlgeschlagen", { status: res.status, body: await res.text() });
      }
    } catch (e) {
      logger.warn("Expo push batch Netzwerkfehler", { error: e.message });
    }
  }
}

async function getTokensForUser(uid) {
  const snap = await db.collection("users").doc(uid).collection("pushTokens").get();
  return snap.docs.map((d) => d.data().token).filter(Boolean);
}

const NOTIFICATION_COPY = {
  like: (n) => ({ title: "Neues Herz", body: `${n.fromDisplayName} gefaellt dein Beitrag` }),
  comment: (n) => ({ title: "Neuer Kommentar", body: `${n.fromDisplayName}: ${n.preview || "..."}` }),
  friend_request: (n) => ({ title: "Neue Verbindungsanfrage", body: `${n.fromDisplayName} moechte sich verbinden` }),
  friend_accept: (n) => ({ title: "Anfrage akzeptiert", body: `${n.fromDisplayName} hat deine Anfrage angenommen` }),
};

// Trigger: users/{uid}/notifications/{notifId} - deckt Likes, Kommentare,
// Verbindungsanfragen/-akzeptierungen ab (siehe notificationService.js
// createNotification(), das genau in diese Subcollection schreibt).
exports.onNotificationCreated = onDocumentCreated(
  "users/{uid}/notifications/{notifId}",
  async (event) => {
    const n = event.data?.data();
    if (!n) return;
    const copyFn = NOTIFICATION_COPY[n.type];
    if (!copyFn) return;

    const tokens = await getTokensForUser(event.params.uid);
    if (tokens.length === 0) return;

    const { title, body } = copyFn(n);
    await sendExpoPush(
      tokens.map((to) => ({
        to,
        title,
        body,
        sound: "default",
        data: { type: n.type, postId: n.postId || null },
      }))
    );
  }
);

// Trigger: chats/{chatId}/messages/{messageId} - 1:1-Chats. Die Chat-ID ist
// deterministisch "<uidA>_<uidB>" (sortiert, siehe chatService.js
// getChatId()), daher laesst sich der Empfaenger ohne zusaetzlichen Read
// direkt aus der ID ableiten.
exports.onDirectMessageCreated = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const m = event.data?.data();
    if (!m?.senderId) return;

    const [uidA, uidB] = event.params.chatId.split("_");
    const recipientUid = m.senderId === uidA ? uidB : uidA;
    if (!recipientUid || recipientUid === m.senderId) return;

    const tokens = await getTokensForUser(recipientUid);
    if (tokens.length === 0) return;

    const senderDoc = await db.collection("users").doc(m.senderId).get();
    const senderName = senderDoc.data()?.displayName || "Jemand";
    const body = m.voiceUrl ? "Sprachnachricht" : (m.text || "").slice(0, 120) || "Neue Nachricht";

    await sendExpoPush(
      tokens.map((to) => ({
        to,
        title: senderName,
        body,
        sound: "default",
        data: { type: "message", chatId: event.params.chatId },
      }))
    );
  }
);

// Trigger: groups/{groupId}/messages/{messageId} - an alle Mitglieder
// ausser der sendenden Person (memberIds auf dem Gruppendokument, siehe
// groupService.js createGroup()).
exports.onGroupMessageCreated = onDocumentCreated(
  "groups/{groupId}/messages/{messageId}",
  async (event) => {
    const m = event.data?.data();
    if (!m?.senderId) return;

    const groupDoc = await db.collection("groups").doc(event.params.groupId).get();
    const group = groupDoc.data();
    if (!group?.memberIds) return;

    const recipients = group.memberIds.filter((uid) => uid !== m.senderId);
    if (recipients.length === 0) return;

    const tokenLists = await Promise.all(recipients.map(getTokensForUser));
    const tokens = tokenLists.flat();
    if (tokens.length === 0) return;

    const body = m.voiceUrl ? "Sprachnachricht" : (m.text || "").slice(0, 120) || "Neue Nachricht";

    await sendExpoPush(
      tokens.map((to) => ({
        to,
        title: `${group.name || "Gruppe"} - ${m.senderName || "Jemand"}`,
        body,
        sound: "default",
        data: { type: "groupMessage", groupId: event.params.groupId },
      }))
    );
  }
);

// Trigger: announcements/{id} - Gruender-Ankuendigungen an alle Nutzer:innen
// (siehe FounderAnnouncementScreen.js/adminService.js createAnnouncement()).
// Fuer die Beta-Groesse ein einfacher Full-Scan aller pushTokens-Subcollections
// vertretbar - bei deutlich mehr Nutzer:innen wuerde das eine Batch-Strategie
// (z.B. ueber eine Topic-Subscription) brauchen.
exports.onAnnouncementCreated = onDocumentCreated(
  "announcements/{id}",
  async (event) => {
    const a = event.data?.data();
    if (!a) return;

    const usersSnap = await db.collection("users").get();
    const tokenLists = await Promise.all(usersSnap.docs.map((u) => getTokensForUser(u.id)));
    const tokens = tokenLists.flat();
    if (tokens.length === 0) return;

    await sendExpoPush(
      tokens.map((to) => ({
        to,
        title: a.title || "Ankuendigung von Nata",
        body: a.message || "",
        sound: "default",
        data: { type: "announcement" },
      }))
    );
  }
);
