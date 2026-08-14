import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "nata_quiet_hours";
const DEFAULTS = { enabled: false, startHour: 22, endHour: 8 };

let cached = null;

export async function getQuietHours() {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cached = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch (e) {
    cached = DEFAULTS;
  }
  return cached;
}

export async function setQuietHours(prefs) {
  cached = { ...DEFAULTS, ...prefs };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch (e) {
    // Rein lokale Einstellung - schlaegt das Speichern fehl, bleibt es beim
    // aktuellen Session-Zustand.
  }
}

// Nur fuer die In-App-Elemente wirksam (Banner, Sound) - es gibt noch keine
// echten Push-Benachrichtigungen (Cloud Functions sind noch nicht aktiv),
// sonst wuerde das genauso hier greifen. Deckt auch Zeitfenster ueber
// Mitternacht ab (z.B. 22 -> 8).
export function isWithinQuietHoursNow(prefs) {
  if (!prefs?.enabled) return false;
  const hour = new Date().getHours();
  const { startHour, endHour } = prefs;
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}
