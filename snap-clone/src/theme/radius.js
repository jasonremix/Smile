// Gemeinsame Radius-Skala statt Werten zwischen 8 und 48 quer durch die App.
// Etwas grosszuegiger als zuvor (Design-Auffrischung) - wirkt weicher/
// moderner, ohne die relativen Abstufungen zwischen den Stufen zu aendern.
export const radius = {
  sm: 10, // kleine Chips, Eingabefelder
  md: 16, // Zeilen innerhalb einer Gruppenliste
  lg: 20, // Karten
  xl: 28, // grosse Karten (Score-Card etc.)
  sheet: 32, // Bottom-Sheets, Modal-Oberkanten
  pill: 999, // Buttons, Badges
};

export default radius;
