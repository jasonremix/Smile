// Nata Wrapped: jedes Jahr ein eigener, kuratierter Stil statt eines
// generischen Zufallsschemas - fuenf handgewaehlte Paletten, die sich nach
// Jahr durchrotieren, damit "2026" und "2027" nie zufaellig identisch
// aussehen. Bewusst als fester Fallback statt algorithmischer Farbgenerierung
// (die oft unschoene Kombinationen erzeugt).
const THEMES = [
  {
    name: "Violett-Feuer",
    bg: "#150a24",
    accent: "#C084FC",
    accentSoft: "rgba(192, 132, 252, 0.18)",
    heading: "#ffffff",
  },
  {
    name: "Sonnenaufgang",
    bg: "#1f1208",
    accent: "#FB923C",
    accentSoft: "rgba(251, 146, 60, 0.18)",
    heading: "#FFF7ED",
  },
  {
    name: "Ozeanblau",
    bg: "#071b26",
    accent: "#38BDF8",
    accentSoft: "rgba(56, 189, 248, 0.18)",
    heading: "#F0F9FF",
  },
  {
    name: "Smaragd",
    bg: "#0a1f14",
    accent: "#34D399",
    accentSoft: "rgba(52, 211, 153, 0.18)",
    heading: "#ECFDF5",
  },
  {
    name: "Kirschrot",
    bg: "#210a10",
    accent: "#FB7185",
    accentSoft: "rgba(251, 113, 133, 0.18)",
    heading: "#FFF1F2",
  },
];

export function getWrappedTheme(year) {
  return THEMES[year % THEMES.length];
}
