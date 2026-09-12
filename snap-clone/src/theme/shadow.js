// Einheitliche, dezente Schatten statt der bisherigen farbigen "Glow"-
// Schatten (shadowColor: colors.primary mit hoher Opacity) - die wirkten
// mit ihrem satten Lila-Leuchten sehr verspielt/game-artig statt ruhig und
// hochwertig. Neutral (schwarz) und schwach gehalten, naeher an nativen
// iOS-Karten. "none" fuer flache Elemente wie ausgewaehlte Chips, bei denen
// die Fuellfarbe allein den Zustand traegt.
export const shadow = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

export default shadow;
