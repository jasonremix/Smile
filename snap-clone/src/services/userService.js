import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../config/firebase";

// "Was ist gerade los" bleibt so lange sichtbar, danach gilt der Status
// clientseitig als abgelaufen (keine Cloud Function fuer serverseitiges
// Aufraeumen vorhanden - dasselbe Muster wie bei Storys/Streaks).
export const STATUS_TTL_MS = 8 * 60 * 60 * 1000;

export function isStatusActive(status) {
  if (!status?.updatedAt?.toMillis) return false;
  return Date.now() - status.updatedAt.toMillis() < STATUS_TTL_MS;
}

export async function setStatus(uid, text) {
  await updateDoc(doc(db, "users", uid), {
    status: { text: text.trim(), updatedAt: serverTimestamp() },
  });
}

export async function clearStatus(uid) {
  await updateDoc(doc(db, "users", uid), { status: null });
}

// Live-Status mehrerer Connections in einer einzigen Abfrage statt eines
// Listeners pro Person - Firestore erlaubt bis zu 30 Werte in "in".
export function listenFriendsStatuses(uids, callback) {
  if (!uids || uids.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "users"), where(documentId(), "in", uids.slice(0, 30)));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs
        .map((d) => d.data())
        .filter((u) => isStatusActive(u.status))
    );
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Nur die tatsaechlich geaenderten Felder mitschicken (nicht das ganze
// Profil), damit die Firestore-Regel-Diffs pro Feld greifen und man sich
// nicht versehentlich an unveraenderten Feldern (z.B. Score) stoert.
export async function updateProfileFields(uid, { displayName, bio, avatarColor }) {
  const data = {};
  if (displayName !== undefined) data.displayName = displayName.trim();
  if (displayName !== undefined) data.displayNameLower = displayName.trim().toLowerCase();
  if (bio !== undefined) data.bio = bio.trim() ? bio.trim() : null;
  if (avatarColor !== undefined) data.avatarColor = avatarColor;
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "users", uid), data);
}

// Standort ist ausschliesslich Opt-in (nie automatisch/im Hintergrund) und
// wird bewusst nur als Stadtname gespeichert, nie als exakte Koordinaten -
// das eigentliche GPS-Ergebnis verlaesst das Geraet nie in voller Praezision.
export async function shareLocationCity(uid, city, region) {
  await updateDoc(doc(db, "users", uid), {
    location: { city, region: region || null, updatedAt: serverTimestamp() },
  });
}

export async function clearLocation(uid) {
  await updateDoc(doc(db, "users", uid), { location: null });
}

// Zwei unabhaengige Sichtbarkeits-Stufen (siehe PrivacyScreen): discoverable
// betrifft nur Suche/Vorschlaege, connectionsVisibility nur die eigene
// Connections-Liste - beide aendern nichts am generellen Leserecht auf das
// Profil selbst.
export async function updatePrivacyPrefs(uid, { discoverable, connectionsVisibility }) {
  const data = {};
  if (discoverable !== undefined) data.discoverable = discoverable;
  if (connectionsVisibility !== undefined) data.connectionsVisibility = connectionsVisibility;
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, "users", uid), data);
}

// "Enge Freunde": dauerhafte Liste (uids) fuer Momente, siehe
// CloseFriendsScreen.js. Wird ueberschrieben statt einzeln toggle-basiert
// geschrieben - einfacher und die Liste ist ohnehin klein.
export async function setCloseFriends(uid, closeFriendUids) {
  await updateDoc(doc(db, "users", uid), { closeFriends: closeFriendUids });
}

// "verified" selbst ist per Firestore-Regel nie client-schreibbar (siehe
// firestore.rules) - dieser Flag ist rein dafuer da, die Glueckwunsch-
// Anzeige nach einer frischen Verifizierung genau einmal zu zeigen.
export async function markVerifiedSeen(uid) {
  await updateDoc(doc(db, "users", uid), { verifiedSeen: true });
}

// Firestore-Regel begrenzt den nataScore-Zuwachs pro Schreibvorgang (Schutz
// gegen manipulierte Clients). Groessere Betraege hier deckeln, damit eine
// einzelne Aktion die Regel nicht verletzt und der Score-Write abgelehnt
// wird. Muss zum Wert in firestore.rules passen.
export const MAX_SCORE_PER_ACTION = 20;

// "reason" ist ein kurzer, fuer Menschen lesbarer Text (z.B. "Snap gesendet"),
// der in der Score-Historie angezeigt wird - kein interner Code.
// WICHTIG: Der Score ist ein Zusatz. Schlaegt der Schreibvorgang fehl (z.B.
// weil eine Regel greift oder das Netz weg ist), darf das die eigentliche
// Aktion (Beitrag posten, Nachricht senden, Snap verschicken) NICHT kaputt
// machen - deshalb komplett in try/catch und nie nach oben weiterwerfen.
export async function bumpNataScore(uid, amount = 1, reason = "Aktivitaet") {
  const safeAmount = Math.max(0, Math.min(amount, MAX_SCORE_PER_ACTION));
  if (safeAmount === 0) return;
  try {
    await updateDoc(doc(db, "users", uid), {
      nataScore: increment(safeAmount),
    });
    await addDoc(collection(db, "users", uid, "scoreEvents"), {
      amount: safeAmount,
      reason,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Punktevergabe ist best effort - Aktion war trotzdem erfolgreich.
  }
}

// Eigene, nur fuer die Person selbst lesbare Subcollection statt eines
// Feldes auf dem (fuer alle Signed-in-Nutzer lesbaren) Hauptdokument - siehe
// Begruendung in firestore.rules bei pushTokens. tokenId = der Token-String
// selbst, damit erneutes Registrieren (z.B. bei jedem Login) idempotent ist
// statt Duplikate anzuhaeufen. Best effort: schlaegt das fehl, bleibt die
// Person einfach ohne Push-Benachrichtigungen auf diesem Geraet - kein
// Blocker fuer den Login.
export async function savePushToken(uid, token) {
  try {
    await setDoc(
      doc(db, "users", uid, "pushTokens", token),
      { token, platform: Platform.OS, createdAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    // Siehe Kommentar oben - bewusst kein Fehler nach oben.
  }
}

export function listenScoreEventsSince(uid, sinceDate, callback) {
  const q = query(
    collection(db, "users", uid, "scoreEvents"),
    where("createdAt", ">=", sinceDate),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
