import AsyncStorage from "@react-native-async-storage/async-storage";

// Rein lokal (pro Geraet, nicht pro Konto in der Cloud) - vermeidet ein
// neues Feld im users-Dokument samt Regel-Anpassung fuer etwas, das nur
// einmalig pro Installation relevant ist.
function keyFor(uid) {
  return `nata_onboarding_seen_${uid}`;
}

export async function hasSeenOnboarding(uid) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(uid));
    return raw === "true";
  } catch (e) {
    return true;
  }
}

export async function markOnboardingSeen(uid) {
  try {
    await AsyncStorage.setItem(keyFor(uid), "true");
  } catch (e) {
    // Rein kosmetisch - schlaegt das Speichern fehl, sieht die Person das
    // Onboarding im schlimmsten Fall beim naechsten Start noch einmal.
  }
}
