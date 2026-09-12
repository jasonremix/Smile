// Erweitert app.json um Werte, die NIE im Git-Repo landen duerfen (z.B. den
// Gemini-API-Schluessel) - wird aus der Umgebungsvariable GEMINI_API_KEY
// gelesen, die beim Ausfuehren von "expo export"/"eas update" gesetzt sein
// muss (siehe README). GitHub blockiert Pushes mit erkennbaren API-
// Schluesseln automatisch (Push Protection) - dieser Weg umgeht das nicht,
// sondern vermeidet das Problem an der Wurzel: der Schluessel steckt nie im
// Quelltext.
const appJson = require("./app.json");

module.exports = ({ config }) => {
  const merged = { ...appJson.expo, ...config };
  merged.extra = {
    ...merged.extra,
    geminiApiKey: process.env.GEMINI_API_KEY || null,
  };
  return merged;
};
