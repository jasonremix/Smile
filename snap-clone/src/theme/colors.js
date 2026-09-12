// Umstellung von Dunkel- auf Hellmodus (auf ausdruecklichen Wunsch: heller,
// minimalistischer, weiss statt schwarz). Die Markenfarbe (Nata-Violett)
// bleibt bewusst erhalten - "weiss machen" heisst hier Grundflaeche/Text
// umdrehen, nicht die Wiedererkennbarkeit der Marke aufgeben.
//
// WICHTIG fuer alle Stellen, die auf einer FEST violetten Flaeche sitzen
// (Buttons, "eigene" Chat-Blase, Badges mit primary/bubbleMine als
// Hintergrund): deren Text/Icon-Farbe darf NICHT "text" sein (das kippt mit
// dem Theme von weiss auf dunkel), sondern das neue "onPrimary" - fest
// weiss, unabhaengig vom Hell-/Dunkelmodus, da diese Flaechen selbst nie
// mitkippen.
export const colors = {
  background: "#FFFFFF",
  surface: "#F7F5FA",
  surfaceLight: "#EFEBF5",
  // Fuer Karten-in-Karten (z.B. Statistik-Kacheln innerhalb einer Sektion) -
  // eine Stufe kraeftiger als surfaceLight, damit Verschachtelung sichtbar
  // wird, ohne auf eine Rahmenlinie angewiesen zu sein.
  surfaceElevated: "#E4DEF0",
  // Unveraendert seit dem Kontrast-Audit - bei weissem Text auf primary
  // (Buttons, aktive Tabs) schafft #9333EA 5.38:1 (WCAG AA), bleibt aber
  // sichtbar dasselbe Violett wie zuvor im Dunkelmodus.
  primary: "#9333EA", // Nata-Violett
  primaryDark: "#7C3AED",
  primaryLight: "#C084FC",
  // Gedaempfte Violett-Toene fuer Hintergrund-Tints (aktive Chips, sanfte
  // Hervorhebungen) statt verstreuter rgba(147,51,234,...)-Literale pro Datei.
  primarySoft: "rgba(147, 51, 234, 0.12)",
  primarySofter: "rgba(147, 51, 234, 0.06)",
  // Fest weiss fuer Text/Icons auf einer garantiert farbigen Flaeche
  // (primary/bubbleMine/danger-Buttons) - siehe Erklaerung oben.
  onPrimary: "#FFFFFF",
  text: "#1A1625",
  textMuted: "#6E6680",
  // Fuer Meta-Informationen, die noch leiser sein sollen als textMuted
  // (Zeitstempel, sekundaere Captions) - bewusst NICHT fuer Fliesstext, da
  // der Kontrast dafuer zu niedrig waere.
  textFaint: "#9B94A8",
  border: "#E4DEF0",
  // Unveraendert seit dem Kontrast-Audit (4.83:1 fuer weissen Button-Text) -
  // als reine Textfarbe auf dem neuen hellen Hintergrund weiterhin gut
  // lesbar (~5.3:1).
  danger: "#dc2626",
  online: "#22a35a",
  // Eigener Akzent fuer den Creator-Modus - bewusst warm/gold statt violett,
  // damit CreatorBadge auf einen Blick von VerifiedBadge unterscheidbar ist.
  creator: "#C67F00",
  creatorSoft: "rgba(198, 127, 0, 0.14)",
  bubbleMine: "#8B5CF6",
  bubbleTheirs: "#F0ECF7",
};

export default colors;
