import AsyncStorage from "@react-native-async-storage/async-storage";

// expo-av ist bereits Teil der ausgelieferten Builds (siehe FilteredMedia.js,
// das Video daraus ohne Soft-Load direkt importiert) - kein neues natives
// Modul, also kein Absturzrisiko fuer Alt-Versionen.
let Audio = null;
try {
  Audio = require("expo-av").Audio;
} catch (e) {
  Audio = null;
}

const STORAGE_KEY = "nata_sound_effects_enabled";
let cachedEnabled = null;

export async function getSoundEffectsEnabled() {
  if (cachedEnabled !== null) return cachedEnabled;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cachedEnabled = raw === null ? true : raw === "true";
  } catch (e) {
    cachedEnabled = true;
  }
  return cachedEnabled;
}

export async function setSoundEffectsEnabled(enabled) {
  cachedEnabled = enabled;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch (e) {
    // Einstellung ist rein lokal - schlaegt das Speichern fehl, bleibt es
    // einfach beim aktuellen Session-Zustand.
  }
}

// Kurze, dezente Toene beim Senden/Empfangen - jeweils frisch geladen und
// wieder entladen statt dauerhaft im Speicher gehalten, da sie selten genug
// ausgeloest werden, dass das keine spuerbare Verzoegerung verursacht.
async function play(asset) {
  if (!Audio) return;
  const enabled = await getSoundEffectsEnabled();
  if (!enabled) return;
  try {
    const { sound } = await Audio.Sound.createAsync(asset, { volume: 0.7 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync().catch(() => {});
    });
    await sound.playAsync();
  } catch (e) {
    // Ton ist rein kosmetisch - kein Fehler, der die Nachricht selbst betrifft.
  }
}

export function playSendSound() {
  play(require("../../assets/sound-send.wav"));
}

export function playReceiveSound() {
  play(require("../../assets/sound-receive.wav"));
}
