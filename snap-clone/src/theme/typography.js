// Gemeinsame Typografie-Skala (angelehnt an die iOS-Textstile), damit
// "Bildschirmtitel" oder "Sektions-Label" ueberall gleich aussehen statt
// mit leicht abweichenden Werten pro Datei neu erfunden zu werden.
//
// Jede Stufe hat jetzt eine explizite lineHeight (vorher dem RN-Standard
// ueberlassen, der bei mehrzeiligem Text oft zu eng wirkt) und die groesseren
// Stufen ein etwas engeres Letter Spacing - beides zusammen liest sich
// hochwertiger, ohne dass sich an Screens etwas anpassen muss: bestehende
// lokale Overrides in einzelnen Screens gewinnen weiterhin, da sie nach dem
// Spread von typography.xxx im jeweiligen StyleSheet stehen.
export const typography = {
  // "Hero" fuer wenige, bewusst grosse Momente (Feier-Screens, Onboarding) -
  // wird sparsam eingesetzt, nicht als Standard-Screen-Titel.
  hero: { fontSize: 36, fontWeight: "800", letterSpacing: -0.6, lineHeight: 40 },
  // "Display" fuer grosse Screen-Titel (Entdecken, Connections, Profil) -
  // leicht engeres Letter Spacing wirkt hochwertiger als reines Bold allein.
  largeTitle: { fontSize: 30, fontWeight: "800", letterSpacing: -0.4, lineHeight: 36 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.2, lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: "700", lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 21 },
  subhead: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  footnote: { fontSize: 12, fontWeight: "400", lineHeight: 17 },
  caption: { fontSize: 11, fontWeight: "600", lineHeight: 15 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    lineHeight: 16,
  },
};

export default typography;
