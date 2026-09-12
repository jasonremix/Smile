// Feste Liste statt freier Texteingabe (siehe interests.js) - hilft aktuell
// nur der Personalisierung/Discovery-Erklaerung, nicht als hartes
// Ranking-Signal, da das ohne echte Nutzungsdaten reine Spekulation waere.
export const GOAL_OPTIONS = [
  { id: "meet_people", emoji: "👋", label: "Menschen kennenlernen" },
  { id: "connect_friends", emoji: "🤝", label: "Bestehende Freunde verbinden" },
  { id: "shared_interests", emoji: "💜", label: "Gemeinsame Interessen entdecken" },
  { id: "share_moments", emoji: "📸", label: "Momente teilen" },
  { id: "find_communities", emoji: "🌐", label: "Neue Communities finden" },
];

export function getGoalById(id) {
  return GOAL_OPTIONS.find((g) => g.id === id);
}
