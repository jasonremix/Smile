export const colors = {
  background: "#0d0d0d",
  surface: "#1a1a1a",
  surfaceLight: "#262626",
  // Fuer Karten-in-Karten (z.B. Statistik-Kacheln innerhalb einer Sektion) -
  // eine Stufe heller als surfaceLight, damit Verschachtelung sichtbar wird,
  // ohne auf eine Rahmenlinie angewiesen zu sein.
  surfaceElevated: "#313131",
  // Etwas dunkler als das reine #A855F7 - bei weissem Text auf primary
  // (Buttons, aktive Tabs) lag der Kontrast vorher bei 3.96:1 und damit
  // unter dem WCAG-AA-Minimum (4.5:1) fuer normalen Text. #9333EA schafft
  // 5.38:1, bleibt aber sichtbar dasselbe Violett.
  primary: "#9333EA", // Nata-Violett
  primaryDark: "#7C3AED",
  primaryLight: "#C084FC",
  // Gedaempfte Violett-Toene fuer Hintergrund-Tints (aktive Chips, sanfte
  // Hervorhebungen) statt verstreuter rgba(147,51,234,...)-Literale pro Datei.
  primarySoft: "rgba(147, 51, 234, 0.16)",
  primarySofter: "rgba(147, 51, 234, 0.08)",
  text: "#ffffff",
  textMuted: "#8e8e8e",
  // Fuer Meta-Informationen, die noch leiser sein sollen als textMuted
  // (Zeitstempel, sekundaere Captions) - bewusst NICHT fuer Fliesstext, da
  // der Kontrast dafuer zu niedrig waere.
  textFaint: "#666666",
  border: "#2e2e2e",
  // Etwas dunkler als das reine #ff3b30 - weisser Text auf einem
  // "Loeschen"-Button in diesem Rot lag nur bei 3.55:1 (unter AA-Minimum
  // 4.5:1), gerade bei einer unwiderruflichen Aktion (Konto loeschen)
  // sicherheitsrelevant. #dc2626 schafft 4.83:1 fuer Button-Text und bleibt
  // als reine Textfarbe auf dunklem Hintergrund weiterhin gut lesbar.
  danger: "#dc2626",
  online: "#2ecc71",
  // Eigener Akzent fuer den Creator-Modus - bewusst warm/gold statt violett,
  // damit CreatorBadge auf einen Blick von VerifiedBadge unterscheidbar ist.
  creator: "#F5A524",
  creatorSoft: "rgba(245, 165, 36, 0.16)",
  bubbleMine: "#8B5CF6",
  bubbleTheirs: "#262626",
};

export default colors;
