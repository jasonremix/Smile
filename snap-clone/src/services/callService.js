import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Sprachanrufe: WebRTC-Signaling komplett ueber Firestore statt eines
// eigenen Signaling-Servers oder Cloud Functions (die auf dem noch
// gesperrten Blaze-Plan warten). Der eigentliche Audio-Stream laeuft
// danach direkt Peer-zu-Peer (WebRTC) - Firestore vermittelt nur kurz
// Angebot/Antwort/ICE-Kandidaten, um die Verbindung aufzubauen.

export async function createCall(caller, callee, offer) {
  const ref = await addDoc(collection(db, "calls"), {
    callerId: caller.uid,
    callerName: caller.displayName,
    callerAvatarColor: caller.avatarColor || null,
    calleeId: callee.uid,
    calleeName: callee.displayName,
    calleeAvatarColor: callee.avatarColor || null,
    status: "ringing",
    offer,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Aktive eingehende Anrufe fuer die eigene Person - kein orderBy noetig
// (erwartet ohnehin hoechstens einen aktiven Ruf gleichzeitig), damit kein
// zusaetzlicher Composite-Index angelegt werden muss.
export function listenIncomingCalls(uid, callback) {
  const q = query(collection(db, "calls"), where("calleeId", "==", uid), where("status", "==", "ringing"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenCall(callId, callback) {
  return onSnapshot(doc(db, "calls", callId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function acceptCall(callId, answer) {
  await updateDoc(doc(db, "calls", callId), {
    status: "accepted",
    answer,
    answeredAt: serverTimestamp(),
  });
}

export async function declineCall(callId) {
  await updateDoc(doc(db, "calls", callId), { status: "declined" });
}

// previousStatus entscheidet, ob es ein beendeter Anruf ("ended") oder ein
// nie angenommener war ("missed") - fuers Anrufverlauf-Icon in der Liste.
export async function endCall(callId, uid, previousStatus) {
  await updateDoc(doc(db, "calls", callId), {
    status: previousStatus === "accepted" ? "ended" : "missed",
    endedAt: serverTimestamp(),
    endedBy: uid,
  });
}

const CANDIDATE_SUBCOLLECTION = { caller: "callerCandidates", callee: "calleeCandidates" };

// callerId/calleeId werden auf JEDEM Kandidaten-Dokument mitgespeichert
// (nicht nur auf dem Call-Hauptdokument) - Firestore-Regeln koennen bei
// Listenabfragen (list) nicht zuverlaessig per get() auf ein ANDERES
// Dokument verweisen, nur bei Einzel-Reads (get). Mit den Feldern direkt
// auf dem Kandidaten-Dokument funktioniert die Leseregel fuer beide Faelle.
export async function sendIceCandidate(callId, role, candidate, participants) {
  await addDoc(collection(db, "calls", callId, CANDIDATE_SUBCOLLECTION[role]), {
    ...candidate.toJSON(),
    callerId: participants.callerId,
    calleeId: participants.calleeId,
  });
}

// Hoert auf die ICE-Kandidaten der JEWEILS ANDEREN Seite (Caller hoert auf
// calleeCandidates und umgekehrt) - nur neu hinzugekommene Dokumente werden
// der WebRTC-Peer-Connection hinzugefuegt, damit bereits verarbeitete
// Kandidaten bei jedem Snapshot nicht doppelt angewendet werden.
//
// WICHTIG: das where() hier ist nicht nur Optimierung, sondern noetig,
// damit die Firestore-Regel (die per ODER auf resource.data.callerId ODER
// resource.data.calleeId prueft) die Listenabfrage ueberhaupt zulaesst -
// bei list-Anfragen kann Firestore eine auf resource.data basierende Regel
// nur pruefen, wenn die Abfrage selbst schon (mindestens) eine Seite des
// ODER durch ein passendes where() nachweislich erfuellt. Live gegen echte
// Testkonten verifiziert (siehe firestore.rules).
export function listenRemoteIceCandidates(callId, role, myUid, onCandidate) {
  const remoteSubcollection = role === "caller" ? CANDIDATE_SUBCOLLECTION.callee : CANDIDATE_SUBCOLLECTION.caller;
  const myField = role === "caller" ? "callerId" : "calleeId";
  const q = query(collection(db, "calls", callId, remoteSubcollection), where(myField, "==", myUid));
  return onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") onCandidate(change.doc.data());
    });
  });
}

export async function getCallDoc(callId) {
  const snap = await getDoc(doc(db, "calls", callId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Eigener Anrufverlauf: zwei getrennte Abfragen (als Anrufer/als
// Angerufene:r), da Firestore kein ODER ueber zwei verschiedene Felder in
// einer Abfrage kann - clientseitig zusammengefuehrt und sortiert, wie
// bereits bei searchUsersByUsername() und getFriendSuggestions().
export async function getCallHistory(uid, limitCount = 50) {
  const [asCaller, asCallee] = await Promise.all([
    getDocs(query(collection(db, "calls"), where("callerId", "==", uid))),
    getDocs(query(collection(db, "calls"), where("calleeId", "==", uid))),
  ]);
  const merged = new Map();
  [...asCaller.docs, ...asCallee.docs].forEach((d) => merged.set(d.id, { id: d.id, ...d.data() }));
  return Array.from(merged.values())
    .filter((c) => c.status !== "ringing")
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    .slice(0, limitCount);
}

// Best-effort fuers Founder-Dashboard - keine Cloud Function fuer echte
// Aggregation vorhanden, daher ein einfacher Client-Read mit vernuenftiger
// Obergrenze statt eines serverseitigen Zaehlers.
export async function getRecentCallStats(sinceDate, limitCount = 500) {
  const snap = await getDocs(query(collection(db, "calls"), where("createdAt", ">=", sinceDate)));
  const calls = snap.docs.map((d) => d.data()).slice(0, limitCount);
  return {
    total: calls.length,
    completed: calls.filter((c) => c.status === "ended").length,
    missed: calls.filter((c) => c.status === "missed" || c.status === "declined").length,
  };
}
