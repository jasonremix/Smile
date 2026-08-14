// Regelbasierter "Bot": keine KI, keine Cloud Function - nur feste, ehrliche
// Antworten je Kategorie, die sofort beim Erstellen eines Tickets (lokal im
// Client) generiert und mit dem Ticket gespeichert werden. Bewusst nicht als
// "echter Support-Mitarbeiter" ausgegeben, damit niemand mehr Hilfe erwartet,
// als tatsaechlich sofort verfuegbar ist.

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

// Wird EINMALIG beim Erstellen des Tickets aufgerufen und das Ergebnis fest
// mit dem Ticket gespeichert (kein Live-Chat, keine Folgefragen an den Bot).
export function generateBotResponse(category) {
  return botReplyFor(category);
}
