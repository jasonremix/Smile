import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { generateBotResponse } from "../utils/ticketBot";

const SUBJECT_MAX = 100;
const MESSAGE_MAX = 1000;

// Der Bot antwortet lokal und sofort (keine Cloud Function) - die Antwort
// wird direkt beim Erstellen mit dem Ticket gespeichert. "escalatedToFounder"
// markiert das Ticket nur fuer die manuelle Durchsicht durch den Gruender
// (@jasonbuerger) ueber die Firebase-Konsole - es gibt KEINE Push-/E-Mail-
// Benachrichtigung an ihn, da dafuer keine Cloud Functions eingerichtet
// sind. Das wird im UI auch so kommuniziert, um nichts vorzutaeuschen.
export async function createTicket({ uid, category, subject, message }) {
  const trimmedSubject = (subject || "").trim().slice(0, SUBJECT_MAX);
  const trimmedMessage = (message || "").trim().slice(0, MESSAGE_MAX);
  const botResponse = generateBotResponse(category);

  const ref = await addDoc(collection(db, "tickets"), {
    uid,
    category,
    subject: trimmedSubject,
    message: trimmedMessage,
    botResponse,
    status: "bot_resolved",
    escalatedToFounder: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Bewusst ohne orderBy() in der Query (das wuerde einen zusammengesetzten
// Firestore-Index fuer uid+createdAt erfordern) - stattdessen client-seitig
// sortiert, unkritisch bei der ueberschaubaren Anzahl eigener Tickets.
export function listenMyTickets(uid, callback) {
  const q = query(collection(db, "tickets"), where("uid", "==", uid));
  return onSnapshot(q, (snap) => {
    const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    tickets.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(tickets);
  });
}

export async function escalateTicket(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), {
    status: "escalated",
    escalatedToFounder: true,
  });
}

export async function closeTicket(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), { status: "closed" });
}
