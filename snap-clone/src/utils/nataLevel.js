// Level-Kurve fuer den Nata Score: quadratisch wachsende Schwellen, damit
// fruehe Level schnell und spaetere Level spuerbar schwerer erreichbar sind.
// Bewusst rein auf Aktionen bezogen (nicht auf die Person) - siehe
// ACHIEVEMENTS-Texte, die immer "du hast X gemacht" statt "du bist X" sagen.
function thresholdForLevel(level) {
  return 25 * (level - 1) * (level - 1);
}

export function getLevelInfo(score) {
  const safeScore = Math.max(0, score || 0);
  let level = 1;
  while (thresholdForLevel(level + 1) <= safeScore) level++;

  const currentThreshold = thresholdForLevel(level);
  const nextThreshold = thresholdForLevel(level + 1);
  const span = nextThreshold - currentThreshold;
  const progress = span > 0 ? (safeScore - currentThreshold) / span : 1;

  return {
    level,
    score: safeScore,
    currentThreshold,
    nextThreshold,
    pointsToNext: Math.max(0, nextThreshold - safeScore),
    progress: Math.max(0, Math.min(1, progress)),
  };
}

export const ACHIEVEMENTS = [
  { id: "level_2", icon: "sparkle", title: "Level 2", description: "Level 2 erreicht.", requiredLevel: 2 },
  { id: "level_3", icon: "flame", title: "Level 3", description: "Level 3 erreicht.", requiredLevel: 3 },
  { id: "level_5", icon: "star", title: "Level 5", description: "Level 5 erreicht.", requiredLevel: 5 },
  { id: "level_8", icon: "diamond", title: "Level 8", description: "Level 8 erreicht.", requiredLevel: 8 },
  { id: "level_12", icon: "crown", title: "Level 12", description: "Level 12 erreicht.", requiredLevel: 12 },
];

export function getAchievementsProgress(score) {
  const { level } = getLevelInfo(score);
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: level >= a.requiredLevel }));
}
