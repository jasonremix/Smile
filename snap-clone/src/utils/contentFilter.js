// Automatische, clientseitige Inhaltspruefung - prueft Texte vor dem
// Absenden auf Beleidigungen/Hassrede, Drohungen, Anzeichen von
// Selbstgefaehrdung und offensichtliches Spam-/Betrugsverhalten.
//
// Bewusst streng eingestellt (mehr Kategorien, tiefere Normalisierung,
// niedrigere Schwellenwerte) - im Zweifel eher einmal zu viel blockieren
// als eine Drohung/Hassrede durchlassen. Wer faelschlich blockiert wird,
// kann den Text ueberarbeiten oder ueber "Feedback geben" melden.
//
// Kategorien nach Prioritaet geordnet und gepruefte (self_harm zuerst,
// danach threat, dann language, zuletzt spam) - eine Krisensituation soll
// nie als "nur Spam" durchrutschen, falls sich mehrere Muster ueberschneiden.
//
// Ehrlich eingeordnet: das ist eine Vorab-Pruefung im Client, keine
// serverseitige Garantie - wer die App umgeht oder direkt gegen Firestore
// schreibt, kommt daran vorbei (dafuer gibt es zusaetzlich eine serverseitige
// Kernpruefung in firestore.rules, siehe dort fuer denselben Wortstamm).
// Ergaenzt die bestehende Melden/Blockieren-Funktion, ersetzt sie nicht.

const INSULT_TERMS = [
  "hurensohn",
  "wichser",
  "arschloch",
  "missgeburt",
  "untermensch",
  "abschaum",
  "fotze",
  "schlampe",
  "hure",
  "bastard",
  "wixer",
  "wixxer",
  "hackfresse",
  "spacko",
  "vollidiot",
  "penner",
];

// Diskriminierung/Hassrede (Behinderung, Herkunft, Religion, Geschlecht,
// sexuelle Orientierung) - deutsch und englisch.
const DISCRIMINATION_TERMS = [
  "spast",
  "spasti",
  "mongo",
  "behindert wie",
  "kanake",
  "kameltreiber",
  "judensau",
  "zigeuner",
  "schwuchtel",
  "kampflesbe",
  "tunte",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "chink",
  "kike",
  "spic",
  "tranny",
  "whore",
  "slut",
  "bitch",
  "cunt",
];

// Sexuelle Belaestigung / unerwuenschte sexuelle Anspielungen.
const SEXUAL_HARASSMENT_TERMS = [
  "schick mir nacktbilder",
  "zeig mir deine titten",
  "schick nudes",
  "nacktfoto von dir",
];

const BLOCKED_TERMS = [...INSULT_TERMS, ...DISCRIMINATION_TERMS, ...SEXUAL_HARASSMENT_TERMS];

// Drohungen/Gewaltandrohungen - eigene, strengste Kategorie: nichts davon
// hat einen legitimen Anwendungsfall in normaler Kommunikation, deshalb
// keine Kontext-Ausnahmen.
const THREAT_PATTERNS = [
  "ich bringe dich um",
  "ich toete dich",
  "ich töte dich",
  "ich tote dich",
  "ich schlage dich",
  "ich steche dich",
  "ich erstech dich",
  "du wirst sterben",
  "du bist tot",
  "ich mach dich fertig",
  "ich finde dich und",
  "ich weiss wo du wohnst",
  "ich weiß wo du wohnst",
  "ich vergewaltige dich",
  "bring dich um",
  "ritz dich",
  "du solltest dich umbringen",
  "du solltest sterben",
];

// Sprache, die auf akute Selbstgefaehrdung hindeutet - bewusst NICHT wie
// Hassrede/Spam behandelt (kein "Verstoss", keine Bestrafung): siehe
// getBlockAlert() unten fuer die einfuehlsame Reaktion mit Hinweis auf die
// Telefonseelsorge, statt den Text nur als "regelwidrig" abzulehnen.
const SELF_HARM_PATTERNS = [
  "ich will nicht mehr leben",
  "ich will sterben",
  "ich bring mich um",
  "ich bringe mich um",
  "ich toete mich",
  "ich töte mich",
  "ich mache schluss mit allem",
  "ich will mir das leben nehmen",
  "suizid begehen",
  "selbstmord begehen",
  "ich ritze mich",
  "ich schneide mich",
  "keinen grund mehr weiterzuleben",
];

const SPAM_PHRASES = [
  "klick hier",
  "jetzt klicken",
  "gratis geld",
  "schnell reich werden",
  "geld verdienen von zuhause",
  "jetzt kaufen",
  "bitcoin investment",
  "krypto investment",
  "kostenlos abstauben",
  "nur heute kostenlos",
  "folge mir für follower",
  "gewinnspiel teilnehmen jetzt",
  "verdiene 500€ am tag",
  "kostenloses iphone",
  // Phishing-artige Formulierungen.
  "verifiziere dein konto hier",
  "dein konto wird gesperrt",
  "bestätige deine daten hier",
  "dein paket konnte nicht zugestellt werden",
];

const URL_PATTERN = /https?:\/\/|www\./gi;
const CONTACT_SPAM_PATTERN = /\b(whatsapp|telegram|signal|schreib mir auf|kontaktiere mich auf|snap mich an)\b/i;
const PHONE_PATTERN = /\b\d{3,}[\s-]?\d{3,}[\s-]?\d{2,}\b/;
// Lange Folgen desselben Zeichens ("aaaaaaaa", "!!!!!!!!") - typisches
// Spam-/Trollmuster.
const REPEATED_CHAR_PATTERN = /(.)\1{6,}/;
// Viel Grossschreibung auf laengerem Text wirkt wie Anschreien/Spam.
const SHOUTING_MIN_LENGTH = 20;

// Einfache Leetspeak-Normalisierung, damit simple Umgehungsversuche wie
// "h0ur3nsohn" oder "n1gg4" trotzdem erkannt werden.
// Bewusst keine Lookbehind-/Lookahead-Regex hier (z.B. fuer "h u r e n s
// o h n" -> "hurensohn"): das laeuft ueber Hermes auf bereits verteilten
// Alt-Builds, deren genaue Regex-Engine-Version wir per OTA nicht
// kontrollieren koennen - ein nicht unterstuetztes Regex-Feature wuerde
// das gesamte Modul beim Laden zum Absturz bringen. Nur einfache,
// garantiert breit unterstuetzte Zeichenklassen.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");
}

// { blocked: false } oder
// { blocked: true, reason: "self_harm" | "threat" | "language" | "spam" }
export function checkContent(text) {
  if (!text) return { blocked: false };
  const normalized = normalize(text);

  for (const pattern of SELF_HARM_PATTERNS) {
    if (normalized.includes(pattern)) {
      return { blocked: true, reason: "self_harm" };
    }
  }

  for (const pattern of THREAT_PATTERNS) {
    if (normalized.includes(pattern)) {
      return { blocked: true, reason: "threat" };
    }
  }

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
  if (urlMatches && urlMatches.length >= 2) {
    return { blocked: true, reason: "spam" };
  }

  if (CONTACT_SPAM_PATTERN.test(text) && PHONE_PATTERN.test(text)) {
    return { blocked: true, reason: "spam" };
  }

  if (REPEATED_CHAR_PATTERN.test(text)) {
    return { blocked: true, reason: "spam" };
  }

  if (text.length >= SHOUTING_MIN_LENGTH) {
    const letters = text.replace(/[^a-zA-ZäöüÄÖÜß]/g, "");
    const upper = text.replace(/[^A-ZÄÖÜ]/g, "");
    if (letters.length > 0 && upper.length / letters.length > 0.7) {
      return { blocked: true, reason: "spam" };
    }
  }

  return { blocked: false };
}

// Zentrale Stelle fuer Titel+Text des Hinweis-Dialogs, damit nicht jeder
// Aufrufer (CreatePostScreen, ChatScreen, ...) seinen eigenen, ggf.
// inkonsistenten Text pflegt. "self_harm" bekommt bewusst einen warmen,
// nicht strafenden Ton mit einer echten Hilfe-Nummer statt einer
// Regelverstoss-Meldung.
export function getBlockAlert(reason) {
  switch (reason) {
    case "self_harm":
      return {
        title: "Du bist nicht allein",
        message:
          "Dein Text klingt, als könntest du gerade in einer schweren Krise stecken. Bitte hol dir Hilfe - die Telefonseelsorge ist kostenlos, anonym und rund um die Uhr erreichbar: 0800 111 0 111 oder 0800 111 0 222 (auch per Chat: telefonseelsorge.de). Dein Text wurde nicht gesendet.",
      };
    case "threat":
      return {
        title: "Nicht möglich",
        message: "Dein Text wurde als Drohung oder Gewaltandrohung erkannt und kann nicht gesendet werden.",
      };
    case "spam":
      return {
        title: "Nicht möglich",
        message: "Das sieht nach Spam oder Werbung aus und wurde automatisch blockiert.",
      };
    case "language":
    default:
      return {
        title: "Nicht möglich",
        message: "Dein Text enthält Formulierungen, die gegen unsere Richtlinien verstoßen. Bitte überarbeite ihn.",
      };
  }
}
