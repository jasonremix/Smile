// Automatische, clientseitige Inhaltspruefung - prueft Texte vor dem
// Absenden auf grobe Beleidigungen/Hassrede und offensichtliches
// Spam-Verhalten (Massen-Links, Kontaktaufnahme-Spam-Phrasen).
//
// Ehrlich eingeordnet: das ist eine Vorab-Pruefung im Client, keine
// serverseitige Garantie - wer die App umgeht oder direkt gegen Firestore
// schreibt, kommt daran vorbei. Eine echte serverseitige Pruefung braeuchte
// Cloud Functions, die dieses Projekt bisher nicht nutzt (siehe Roadmap).
// Ergaenzt die bestehende Melden/Blockieren-Funktion, ersetzt sie nicht -
// die manuelle Meldung bleibt der zuverlaessigere Weg fuer alles, was
// dieser Filter nicht erfasst.

const BLOCKED_TERMS = [
  // Grobe Beleidigungen/Hassrede - Wortstaemme, damit Beugungen ebenfalls
  // erfasst werden.
  "hurensohn",
  "wichser",
  "missgeburt",
  "untermensch",
  "abschaum",
  "spast",
  "mongo",
  "fotze",
  "nigger",
  "faggot",
  "retard",
  "chink",
  "kike",
];

const SPAM_PHRASES = [
  "klick hier",
  "jetzt klicken",
  "gratis geld",
  "schnell reich werden",
  "jetzt kaufen",
  "bitcoin investment",
  "kostenlos abstauben",
  "nur heute kostenlos",
];

const URL_PATTERN = /https?:\/\/|www\./gi;
const CONTACT_SPAM_PATTERN = /\b(whatsapp|telegram|schreib mir auf|kontaktiere mich auf)\b/i;
const PHONE_PATTERN = /\b\d{3,}[\s-]?\d{3,}[\s-]?\d{2,}\b/;

// Einfache Leetspeak-Normalisierung (0->o, 1/!->i, 3->e, $->s), damit
// simple Umgehungsversuche wie "h0ur3nsohn" trotzdem erkannt werden.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[$]/g, "s");
}

export const BLOCK_REASON_MESSAGES = {
  language: "Dein Text enthält Formulierungen, die gegen unsere Richtlinien verstoßen. Bitte überarbeite ihn.",
  spam: "Das sieht nach Spam oder Werbung aus und wurde automatisch blockiert.",
};

// { blocked: false } oder { blocked: true, reason: "language" | "spam" }
export function checkContent(text) {
  if (!text) return { blocked: false };
  const normalized = normalize(text);

  for (const term of BLOCKED_TERMS) {
    if (normalized.includes(term)) {
      return { blocked: true, reason: "language" };
    }
  }

  for (const phrase of SPAM_PHRASES) {
    if (normalized.includes(phrase)) {
      return { blocked: true, reason: "spam" };
    }
  }

  const urlMatches = text.match(URL_PATTERN);
  if (urlMatches && urlMatches.length >= 3) {
    return { blocked: true, reason: "spam" };
  }

  if (CONTACT_SPAM_PATTERN.test(text) && PHONE_PATTERN.test(text)) {
    return { blocked: true, reason: "spam" };
  }

  return { blocked: false };
}
