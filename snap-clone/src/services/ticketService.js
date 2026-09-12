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

// Einziges Konto mit Zugriff auf die Ticket-Verwaltung (siehe isFounder()
// in firestore.rules, dort per fester UID statt Benutzername durchgesetzt -
// dieser Benutzername dient nur der UI-Sichtbarkeitspruefung im Client).
export const FOUNDER_USERNAME = "jasonbuerger";

// Der Bot antwortet direkt beim Erstellen (per Gemini, siehe ticketBot.js,
// mit Fallback auf eine feste Antwort) - die Antwort wird sofort mit dem
// Ticket gespeichert. "escalatedToFounder" markiert das Ticket nur fuer die
// manuelle Durchsicht durch den Gruender (@jasonbuerger) - es gibt KEINE
// Push-/E-Mail-Benachrichtigung an ihn ausser bei aktivem Push-Backend
// (siehe functions/). Das wird im UI so kommuniziert, um nichts vorzutaeuschen.
export async function createTicket({ uid, category, subject, message }) {
  const trimmedSubject = (subject || "").trim().slice(0, SUBJECT_MAX);
  const trimmedMessage = (message || "").trim().slice(0, MESSAGE_MAX);
  const botResponse = await generateBotResponse(category, trimmedSubject, trimmedMessage);

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

// Nur fuer den Gruender lesbar (siehe isFounder() in firestore.rules) -
// zeigt ALLE an ihn weitergeleiteten Tickets, ueber alle Nutzer hinweg.
// Ebenfalls ohne orderBy() in der Query, gleicher Grund wie oben.
export function listenAllEscalatedTickets(callback) {
  const q = query(collection(db, "tickets"), where("escalatedToFounder", "==", true));
  return onSnapshot(q, (snap) => {
    const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    tickets.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(tickets);
  });
}

// Gruender-Bearbeitung eines Tickets: Antworten, Annehmen oder Ablehnen.
// resolution ist optional (reine Antwort ohne Entscheidung moeglich),
// status landet je nachdem auf "answered" (weiterhin offen, Person kann
// noch reagieren) oder "closed" (abgeschlossen). Nur diese vier Felder
// werden angefasst - firestore.rules verbietet dem Gruender explizit jede
// Aenderung an den vom Nutzer eingereichten Feldern.
export async function respondToTicket(ticketId, { founderResponse, resolution = null, closeAfter = false }) {
  await updateDoc(doc(db, "tickets", ticketId), {
    status: closeAfter ? "closed" : "answered",
    resolution,
    ...(founderResponse ? { founderResponse: founderResponse.trim().slice(0, 2000) } : {}),
    founderResponseAt: serverTimestamp(),
  });
}

// Hebt eine automatische Sperre vorzeitig auf (z. B. nach prueferischer
// Durchsicht eines "Sperre"-Tickets) - nur der Gruender darf das
// (durchgesetzt in firestore.rules, nicht nur hier). strikeWeight bleibt
// bewusst unberuehrt: die Historie der Verstoesse soll erhalten bleiben,
// auch wenn die aktuelle Sperre erlassen wird.
export async function liftRestriction(uid) {
  await updateDoc(doc(db, "users", uid), { restrictedUntil: null });
}
