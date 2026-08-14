import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { generateGeminiReply } from "./geminiService";

const HISTORY_LIMIT = 30;

const SYSTEM_INSTRUCTION = `Du bist "Nata AI", ein freundlicher KI-Assistent innerhalb der Snap-/Storys-App
Nata (kleines Beta-Team, Freundeskreis-fokussiert statt oeffentliche Reichweite). Antworte auf Deutsch,
locker und knapp (meist 2-5 Saetze, nur bei echtem Bedarf laenger). Du bist erkennbar eine KI, kein Mensch -
gib das offen zu, falls gefragt. Du hast keinen Zugriff auf die Konten, Nachrichten oder Einstellungen der
Person und kannst nichts in der App aendern - bei technischen Problemen (Sperre, Login, Melden) verweise
freundlich auf Einstellungen -> Support-Tickets, wo ein Mensch (der Gruender) sich das ansehen kann.`;

export function listenAiMessages(uid, callback) {
  const q = query(
    collection(db, "users", uid, "aiMessages"),
    orderBy("createdAt", "asc"),
    limit(HISTORY_LIMIT)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Schreibt die Nutzer-Nachricht, ruft Gemini mit der bisherigen Historie auf
// und schreibt die Antwort - schlaegt der KI-Aufruf fehl, bekommt die Person
// eine ehrliche Fehlermeldung als "model"-Nachricht statt eines stillen
// Haengenbleibens.
export async function sendAiMessage(uid, text, currentHistory) {
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) return;

  await addDoc(collection(db, "users", uid, "aiMessages"), {
    role: "user",
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  const history = [...currentHistory.map((m) => ({ role: m.role, text: m.text })), { role: "user", text: trimmed }];

  let replyText;
  try {
    replyText = await generateGeminiReply(history, SYSTEM_INSTRUCTION);
  } catch (e) {
    replyText = "Entschuldige, gerade klappt die Verbindung zu mir nicht (evtl. Netzwerk oder Auslastung). Versuch's gleich nochmal.";
  }

  await addDoc(collection(db, "users", uid, "aiMessages"), {
    role: "model",
    text: replyText,
    createdAt: serverTimestamp(),
  });
}
