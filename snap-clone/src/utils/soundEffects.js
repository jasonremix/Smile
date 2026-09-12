import AsyncStorage from "@react-native-async-storage/async-storage";

// expo-audio (Nachfolger von expo-av) ist bereits Teil der ausgelieferten
// Builds (siehe FilteredMedia.js, das expo-video ohne Soft-Load direkt
// importiert) - kein neues natives Modul, also kein Absturzrisiko fuer
// Alt-Versionen.
let createAudioPlayer = null;
try {
  createAudioPlayer = require("expo-audio").createAudioPlayer;
} catch (e) {
  createAudioPlayer = null;
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
  if (!createAudioPlayer) return;
  const enabled = await getSoundEffectsEnabled();
  if (!enabled) return;
  try {
    const player = createAudioPlayer(asset);
    player.volume = 0.7;
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) player.remove();
    });
    player.play();
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
