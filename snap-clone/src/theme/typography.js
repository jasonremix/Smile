// Gemeinsame Typografie-Skala (angelehnt an die iOS-Textstile), damit
// "Bildschirmtitel" oder "Sektions-Label" ueberall gleich aussehen statt
// mit leicht abweichenden Werten pro Datei neu erfunden zu werden.
export const typography = {
  largeTitle: { fontSize: 30, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "700" },
  headline: { fontSize: 17, fontWeight: "700" },
  body: { fontSize: 15, fontWeight: "400" },
  subhead: { fontSize: 13, fontWeight: "600" },
  footnote: { fontSize: 12, fontWeight: "400" },
  caption: { fontSize: 11, fontWeight: "600" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
};

export default typography;
