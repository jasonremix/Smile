import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { generateGeminiReply } from "./geminiService";

const HISTORY_LIMIT = 30;
// Tageslimit fuer Gemini-Aufrufe pro Person - Kosten-/Missbrauchsschutz, da
// der Aufruf direkt vom Client kommt (kein eigenes Backend). Serverseitig
// ueber firestore.rules (aiUsage-Regel) durchgesetzt, nicht nur im Client.
const AI_DAILY_LIMIT = 40;

function todayId() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Gibt true zurueck, wenn die Nachricht noch gesendet werden darf, und
// erhoeht dabei den heutigen Zaehler. false, wenn das Tageslimit erreicht ist -
// dann wird gar nicht erst versucht zu schreiben (die Regel wuerde es ohnehin
// ablehnen).
async function bumpAiUsage(uid) {
  const ref = doc(db, "users", uid, "aiUsage", todayId());
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { count: 1, date: todayId() });
    return true;
  }
  const count = snap.data().count || 0;
  if (count >= AI_DAILY_LIMIT) return false;
  await updateDoc(ref, { count: increment(1) });
  return true;
}

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

// Wandelt eine lokale Bild-URI in Base64 um - ganz ohne expo-file-system
// (neues natives Modul), nur mit fetch()+FileReader, die im Expo/RN-JS-
// Umfeld auch fuer lokale file://-URIs funktionieren.
async function uriToBase64(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Schreibt die Nutzer-Nachricht, ruft Gemini mit der bisherigen Historie auf
// und schreibt die Antwort - schlaegt der KI-Aufruf fehl, bekommt die Person
// eine ehrliche Fehlermeldung als "model"-Nachricht statt eines stillen
// Haengenbleibens. imageUri (optional): wird NUR fuer diesen einen Aufruf an
// Gemini (Vision) geschickt, nicht dauerhaft gespeichert - es gibt kein
// Firebase Storage, deshalb bleibt in der Historie nur ein "hasImage"-Hinweis.
export async function sendAiMessage(uid, text, currentHistory, imageUri) {
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed && !imageUri) return;

  await addDoc(collection(db, "users", uid, "aiMessages"), {
    role: "user",
    text: trimmed || "📷 Bild gesendet",
    hasImage: !!imageUri,
    createdAt: serverTimestamp(),
  });

  const history = [
    ...currentHistory.map((m) => ({ role: m.role, text: m.text })),
    { role: "user", text: trimmed || "Was siehst du auf diesem Bild?" },
  ];

  let imagePart;
  if (imageUri) {
    try {
      const base64 = await uriToBase64(imageUri);
      imagePart = { mimeType: "image/jpeg", base64 };
    } catch (e) {
      imagePart = undefined;
    }
  }

  let replyText;
  const allowed = await bumpAiUsage(uid).catch(() => true);
  if (!allowed) {
    replyText = `Du hast dein tägliches Nachrichtenlimit für Nata AI erreicht (${AI_DAILY_LIMIT} Nachrichten) - das schützt uns als kleines Team vor zu hohen KI-Kosten. Morgen geht's weiter, für dringende Anliegen gerne ein Support-Ticket in den Einstellungen.`;
  } else {
    try {
      replyText = await generateGeminiReply(history, SYSTEM_INSTRUCTION, imagePart);
    } catch (e) {
      replyText = "Entschuldige, gerade klappt die Verbindung zu mir nicht (evtl. Netzwerk oder Auslastung). Versuch's gleich nochmal.";
    }
  }

  await addDoc(collection(db, "users", uid, "aiMessages"), {
    role: "model",
    text: replyText,
    createdAt: serverTimestamp(),
  });
}
