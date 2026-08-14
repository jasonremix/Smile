// Snapchat-aehnliche Foto-/Video-Filter, aber bewusst als reine
// Farb-Ueberlagerung umgesetzt statt echter Pixel-Filterung (Graustufen,
// Kontrast, Saettigung): das braeuchte eine native Bildbearbeitungs-
// Bibliothek (z. B. react-native-skia), und ein neues natives Modul wuerde
// die bereits verteilte Standalone-App beim naechsten OTA-Update zum
// Absturz bringen (siehe contentFilter.js/Icon.js fuer dasselbe Prinzip an
// anderer Stelle). Deshalb ehrlich nur "Farbton"-Filter benannt (Warm,
// Kühl, ...), keiner verspricht etwas wie "Schwarz-Weiß", das eine reine
// Ueberlagerung technisch nicht leisten kann.
//
// Das eigentliche Bild bleibt unveraendert (kein Pixel wird umgeschrieben)
// - stattdessen wird die gewaehlte filter-ID mit dem Snap/Moment
// gespeichert und beim Anzeigen (bei JEDER Person, die es sieht) exakt
// dieselbe Ueberlagerung erneut gezeichnet. Das Ergebnis ist optisch
// identisch zu "eingebrannten" Filtern, nur ohne natives Modul.
export const PHOTO_FILTERS = [
  { id: "none", label: "Original", overlayColor: null, opacity: 0 },
  { id: "warm", label: "Warm", overlayColor: "#FF9D42", opacity: 0.18 },
  { id: "cool", label: "Kühl", overlayColor: "#4287FF", opacity: 0.16 },
  { id: "sunset", label: "Sonnenuntergang", overlayColor: "#FF5F6D", opacity: 0.22 },
  { id: "night", label: "Nacht", overlayColor: "#1A1A50", opacity: 0.35 },
  { id: "retro", label: "Retro", overlayColor: "#B98A4A", opacity: 0.24 },
];

export const PHOTO_FILTER_IDS = PHOTO_FILTERS.map((f) => f.id);

export function getFilterById(id) {
  return PHOTO_FILTERS.find((f) => f.id === id) || PHOTO_FILTERS[0];
}
