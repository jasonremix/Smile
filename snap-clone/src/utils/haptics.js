// expo-haptics ist ein natives Modul, das erst mit dem naechsten nativen
// Build in den ausgelieferten Apps steckt - genau wie bei expo-location per
// require im try/catch nachladen, damit ein OTA-Update dieses Moduls
// installierte Alt-Apps (ohne das native Modul) nicht zum Absturz bringt.
// Alle Aufrufe hier sind bewusst best-effort: schlaegt Haptics fehl oder
// fehlt das Modul, passiert einfach nichts - nie ein Blocker fuer die
// eigentliche Aktion.
let Haptics = null;
try {
  Haptics = require("expo-haptics");
} catch (e) {
  Haptics = null;
}

export function hapticLight() {
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium() {
  Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticSuccess() {
  Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticSelection() {
  Haptics?.selectionAsync().catch(() => {});
}
