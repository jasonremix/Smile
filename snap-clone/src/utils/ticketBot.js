// Bot antwortet ueber Gemini (siehe generateBotResponse unten), mit den
// bisherigen festen Antworten als Fallback, falls der KI-Aufruf fehlschlaegt
// (kein Netz, Quote, o.ae.) - das Ticket-Erstellen darf davon nie abhaengen.
// Bewusst nicht als "echter Support-Mitarbeiter" ausgegeben, damit niemand
// mehr Hilfe erwartet, als tatsaechlich sofort verfuegbar ist.

export const TICKET_CATEGORIES = [
  { id: "restriction_appeal", label: "Sperre / Timeout", icon: "shield" },
  { id: "content_decision", label: "Warum wurde etwas blockiert?", icon: "warning" },
  { id: "account_issue", label: "Konto oder Login", icon: "person" },
  { id: "other", label: "Sonstiges", icon: "chat" },
];

function botReplyFor(category) {
  switch (category) {
    case "restriction_appeal":
      return (
        "Automatische Sperren entstehen ausschliesslich durch wiederholte, von der " +
        "Inhaltspruefung erkannte Verstoesse (Beleidigung, Diskriminierung, Drohung, Spam) - " +
        "nie durch einzelne Meldungen anderer Nutzer:innen. Die Dauer richtet sich nach der " +
        "Schwere und Anzahl: je hoeher das gesammelte Gewicht, desto laenger der Timeout. Die " +
        "verbleibende Zeit siehst du direkt in der Hinweis-Meldung, die beim Versuch zu posten " +
        "erscheint. Wenn du denkst, dass eine Sperre zu Unrecht ausgeloest wurde (z. B. durch " +
        "einen falsch erkannten Begriff), leite das Ticket unten gerne an den Gruender weiter - " +
        "er kann sich den Fall in der Datenbank ansehen."
      );
    case "content_decision":
      return (
        "Nata blockiert Texte automatisch in vier Kategorien: Beleidigungen/Diskriminierung, " +
        "Drohungen, Spam/Phishing sowie - ohne Strafe - Aeusserungen zu Selbstgefaehrdung, wo " +
        "stattdessen Hilfsangebote gezeigt werden. Die Pruefung laeuft auf einer festen " +
        "Begriffs- und Muster-Liste, nicht auf einer inhaltlichen KI-Bewertung - dadurch kann " +
        "es vereinzelt zu falschen Treffern kommen (z. B. bei mehrdeutigen Woertern). Schreib " +
        "in der Ticket-Nachricht am besten genau, welcher Text blockiert wurde, dann kann der " +
        "Gruender das bei einer Weiterleitung nachvollziehen."
      );
    case "account_issue":
      return (
        "Bei Login-Problemen hilft haeufig ein erneuter Anmeldeversuch nach ein paar Minuten " +
        "oder ein Update auf die neueste App-Version (siehe \"Über Nata\" in den Einstellungen). " +
        "Konto loeschen, Datenschutz und rechtliche Angaben findest du ebenfalls in den " +
        "Einstellungen. Falls dein Problem damit nicht geloest ist, leite das Ticket gerne an " +
        "den Gruender weiter."
      );
    default:
      return (
        "Danke für dein Ticket. Da Nata ein kleines Beta-Team ohne automatisierten Live-" +
        "Support ist, kann dieser Bot nur allgemeine Hinweise geben. Für alles, was darüber " +
        "hinausgeht, leite das Ticket bitte an den Gründer weiter - er sieht sich jedes " +
        "weitergeleitete Ticket persönlich an."
      );
  }
}

// Fester Kontext fuer Gemini: nur echte, im Code tatsaechlich umgesetzte
// Regeln - damit die KI nichts erfindet, was es in Nata gar nicht gibt.
const SYSTEM_INSTRUCTION = `Du bist der automatische Support-Bot von Nata, einer Snap-/Storys-App fuer
kleine Freundeskreise (Beta, kleines Team ohne Live-Support). Antworte auf Deutsch, freundlich, knapp
(max. 5-6 Saetze), und nutze ausschliesslich diese echten Fakten ueber Nata:

- Automatische Sperren/Timeouts entstehen NUR durch wiederholte, von der automatischen Inhaltspruefung
  erkannte Verstoesse (Beleidigung, Diskriminierung, Drohung, Spam) - nie durch einzelne Meldungen anderer
  Nutzer:innen. Dauer richtet sich nach Schwere/Anzahl, die verbleibende Zeit steht in der Hinweis-Meldung
  beim Postversuch.
- Inhaltspruefung laeuft ueber eine feste Begriffs-/Muster-Liste (Firestore-Regeln), nicht ueber eine
  inhaltliche KI-Bewertung - dadurch sind vereinzelte Fehltreffer moeglich.
- Bei Aeusserungen zu Selbstgefaehrdung gibt es KEINE Strafe, sondern einfuehlsame Hilfsangebote
  (Telefonseelsorge-Hinweis).
- Konto loeschen, Datenschutz, Nutzungsbedingungen: alles in den Einstellungen zu finden.
- Melden und Blockieren funktioniert fuer einzelne Snaps, Storys, Nachrichten und Nutzer:innen.
- Du bist kein Mensch und kannst selbst nichts aendern (keine Sperren aufheben, keine Tickets entscheiden) -
  bei allem, was ueber eine allgemeine Erklaerung hinausgeht, verweise darauf, das Ticket ueber den Button
  an den Gruender (@jasonbuerger) weiterzuleiten, der es sich persoenlich ansieht.
- Erfinde NIE Funktionen, Fristen oder Zusagen, die hier nicht stehen.`;

async function generateWithGemini(category, subject, message) {
  const { generateGeminiReply } = require("../services/geminiService");
  const categoryLabel = TICKET_CATEGORIES.find((c) => c.id === category)?.label || "Sonstiges";
  const prompt = `Kategorie: ${categoryLabel}\nBetreff: ${subject || "(kein Betreff)"}\nNachricht: ${message || "(keine Nachricht)"}`;
  return generateGeminiReply([{ role: "user", text: prompt }], SYSTEM_INSTRUCTION);
}

// Wird EINMALIG beim Erstellen des Tickets aufgerufen und das Ergebnis fest
// mit dem Ticket gespeichert (kein Live-Chat, keine Folgefragen an den Bot).
// Versucht zuerst eine echte, auf die konkrete Nachricht eingehende
// Gemini-Antwort; schlaegt das fehl, faellt es auf die feste, kategorie-
// basierte Antwort zurueck - das Ticket-Erstellen darf davon nie abhaengen.
export async function generateBotResponse(category, subject, message) {
  try {
    return await generateWithGemini(category, subject, message);
  } catch (e) {
    return botReplyFor(category);
  }
}
