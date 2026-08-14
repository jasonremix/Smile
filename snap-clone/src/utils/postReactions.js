// Mehrfach-Reaktionen auf Beitraege statt nur "Gefaellt mir" - reine Emoji-
// Zeichen (kein neues Icon-Set/keine Bibliothek noetig, RN rendert Emoji
// nativ ueber Text). "heart" bleibt bewusst der Standard/erste Eintrag,
// damit ein einfacher Tap (siehe PostCard.js) weiterhin wie zuvor "liken"
// bedeutet - Long-Press oeffnet die volle Auswahl.
export const REACTION_TYPES = [
  { id: "heart", emoji: "❤️", label: "Herz" },
  { id: "laugh", emoji: "😂", label: "Lachen" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Traurig" },
  { id: "fire", emoji: "🔥", label: "Feuer" },
];

export function getReactionEmoji(id) {
  return REACTION_TYPES.find((r) => r.id === id)?.emoji || REACTION_TYPES[0].emoji;
}
