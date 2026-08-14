import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "nata:seenAnnouncementIds";
const MAX_STORED = 100;

// Ankuendigungen liegen in EINER gemeinsamen Firestore-Collection fuer alle
// Nutzer:innen (siehe adminService.js) - "gelesen" ist deshalb rein lokal
// auf dem Geraet gespeichert, nicht in Firestore. Von Banner, Glocke-Badge
// und Benachrichtigungen-Liste gemeinsam genutzt, damit alle drei denselben
// Stand zeigen (einmal gesehen = ueberall gesehen).
export async function getSeenAnnouncementIds() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function markAnnouncementSeen(id) {
  try {
    const seen = await getSeenAnnouncementIds();
    if (seen.includes(id)) return;
    const next = [...seen, id].slice(-MAX_STORED);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Rein lokaler Komfort-Zustand - bei einem Speicherfehler bleibt die
    // Ankuendigung halt einmal mehr als ungesehen markiert, kein Absturz.
  }
}
