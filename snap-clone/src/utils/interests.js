// Feste Liste statt freier Texteingabe - kein Moderationsaufwand noetig,
// da nur diese Begriffe ueberhaupt gespeichert werden koennen.
export const INTEREST_OPTIONS = [
  { id: "gaming", emoji: "🎮", label: "Gaming" },
  { id: "music", emoji: "🎵", label: "Musik" },
  { id: "sports", emoji: "⚽", label: "Sport" },
  { id: "books", emoji: "📚", label: "Bücher" },
  { id: "movies", emoji: "🎬", label: "Filme & Serien" },
  { id: "art", emoji: "🎨", label: "Kunst" },
  { id: "creativity", emoji: "✨", label: "Kreativität" },
  { id: "travel", emoji: "✈️", label: "Reisen" },
  { id: "food", emoji: "🍳", label: "Essen" },
  { id: "fitness", emoji: "🏋️", label: "Fitness" },
  { id: "photography", emoji: "📷", label: "Fotografie" },
  { id: "cars", emoji: "🚗", label: "Autos" },
  { id: "tech", emoji: "💻", label: "Tech" },
  { id: "nature", emoji: "🌱", label: "Natur" },
  { id: "fashion", emoji: "👗", label: "Fashion" },
  { id: "animals", emoji: "🐾", label: "Tiere" },
  { id: "dance", emoji: "💃", label: "Tanzen" },
];

export const MAX_INTERESTS = 5;
export const MIN_INTERESTS_ONBOARDING = 3;

export function getInterestById(id) {
  return INTEREST_OPTIONS.find((i) => i.id === id);
}
