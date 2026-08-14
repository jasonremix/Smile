import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Wie in EditProfileScreen.js: expo-location ist erst ab dem naechsten
// nativen Build sicher vorhanden, deshalb per require im try/catch
// nachladen statt eines Top-Level-Imports.
let Location = null;
try {
  Location = require("expo-location");
} catch (e) {
  Location = null;
}

// Aelter als das gilt als "nicht mehr live" und wird ausgeblendet - reine
// Vordergrund-Standortfreigabe ohne Hintergrund-Tracking, deshalb ein
// vergleichsweise kurzes Zeitfenster.
const STALE_MS = 30 * 60 * 1000;
const CANDIDATES_LIMIT = 30;

export function isLocationSharingAvailable() {
  return !!Location;
}

// Fordert einmalig die Vordergrund-Standort-Berechtigung an und schreibt die
// aktuelle Position - kein Hintergrund-Tracking (kein expo-task-manager,
// kein zusaetzliches natives Risiko). Wird sowohl beim Aktivieren als auch
// beim manuellen "Aktualisieren" aufgerufen.
export async function shareLiveLocationNow(uid) {
  if (!Location) {
    throw Object.assign(new Error("Standort-Teilen braucht die neueste App-Version."), {
      code: "module_unavailable",
    });
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw Object.assign(new Error("Kein Zugriff auf den Standort."), { code: "permission_denied" });
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await setDoc(doc(db, "users", uid, "liveLocation", "current"), {
    ownerId: uid,
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    updatedAt: serverTimestamp(),
  });
}

export async function stopSharingLiveLocation(uid) {
  await deleteDoc(doc(db, "users", uid, "liveLocation", "current"));
}

export function listenMyLiveLocationSharing(uid, callback) {
  return onSnapshot(doc(db, "users", uid, "liveLocation", "current"), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

function isFresh(loc) {
  const ms = loc.updatedAt?.toMillis ? loc.updatedAt.toMillis() : 0;
  return Date.now() - ms < STALE_MS;
}

// Zwei verschachtelte Listener statt eines einzelnen Reads: (1) wer hat MICH
// in die eigene "enge Freunde"-Liste aufgenommen (nicht zwingend
// symmetrisch zu meiner eigenen Liste!), (2) von genau diesen Personen die
// jeweils aktuelle liveLocation - beides live, damit neu hinzugefuegte enge
// Freunde oder neue Standort-Updates sofort ankommen.
export function listenCloseFriendsSharingWithMe(myUid, callback) {
  const candidatesQuery = query(collection(db, "users"), where("closeFriends", "array-contains", myUid));
  let unsubLocations = () => {};

  const unsubCandidates = onSnapshot(candidatesQuery, (snap) => {
    unsubLocations();
    const candidateUids = snap.docs.map((d) => d.id).slice(0, CANDIDATES_LIMIT);
    const candidateInfo = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));

    if (candidateUids.length === 0) {
      callback([]);
      unsubLocations = () => {};
      return;
    }

    const locQuery = query(collectionGroup(db, "liveLocation"), where("ownerId", "in", candidateUids));
    unsubLocations = onSnapshot(locQuery, (locSnap) => {
      const results = locSnap.docs
        .map((d) => d.data())
        .filter(isFresh)
        .map((loc) => ({
          ownerId: loc.ownerId,
          lat: loc.lat,
          lng: loc.lng,
          updatedAt: loc.updatedAt,
          displayName: candidateInfo[loc.ownerId]?.displayName || "Jemand",
          avatarColor: candidateInfo[loc.ownerId]?.avatarColor,
        }));
      callback(results);
    });
  });

  return () => {
    unsubCandidates();
    unsubLocations();
  };
}
