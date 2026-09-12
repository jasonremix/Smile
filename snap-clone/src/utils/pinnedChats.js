import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "nata:pinnedChatIds";

// Rein lokal auf dem Geraet gespeichert statt als Firestore-Feld - die
// chats-Regeln erlauben nur eine feste Liste an Feldern pro Schreibvorgang
// (siehe firestore.rules), eine neue Freigabe dafuer laesst sich in dieser
// Session nicht deployen. "Angepinnt" ist ausserdem ohnehin eine reine
// Anzeige-Praeferenz ohne Sicherheitsrelevanz, dafuer muss nichts synchron
// zwischen Geraeten sein.
export async function getPinnedChatIds() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function togglePinnedChat(id) {
  try {
    const pinned = await getPinnedChatIds();
    const next = pinned.includes(id) ? pinned.filter((p) => p !== id) : [...pinned, id];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    // Rein lokaler Komfort-Zustand - bei einem Speicherfehler bleibt der
    // bisherige Pin-Status einfach unveraendert, kein Absturz.
    return getPinnedChatIds();
  }
}
