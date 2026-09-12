import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const SNAPSHOT_MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000;

// Woechentlicher Punktestand-Schnappschuss (siehe firestore.rules:
// scoreSnapshotAt/scoreAtSnapshot) - bewusst KEINE Listen-Abfrage ueber
// fremde scoreEvents-Subcollections fuers Leaderboard (Firestore kann
// exists()/get()-Aufrufe in Regeln nicht fuer Listen-Anfragen auswerten,
// empirisch waehrend der Regel-Tests bestaetigt), sondern ein simpler,
// selbst geschriebener Wert auf dem ohnehin oeffentlich lesbaren
// users-Dokument. Wird bei jedem App-Start aufgerufen (siehe HomeScreen.js);
// erneuert sich selbst nach 6 Tagen.
export async function ensureWeeklySnapshot(uid, currentScore) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const snapshotAt = data.scoreSnapshotAt?.toMillis?.() || 0;
  if (Date.now() - snapshotAt > SNAPSHOT_MAX_AGE_MS) {
    await updateDoc(ref, {
      scoreSnapshotAt: serverTimestamp(),
      scoreAtSnapshot: currentScore || 0,
    });
  }
}

// Rangliste unter Connections: Zuwachs seit dem letzten Schnappschuss
// (siehe oben) - alle noetigen Felder (nataScore, scoreAtSnapshot,
// scoreSnapshotAt) stehen bereits auf dem users-Dokument jeder Person,
// das fuer alle signed-in Nutzer:innen lesbar ist (siehe firestore.rules),
// deshalb reicht ein einzelner get() pro Connection statt einer Query.
export async function getWeeklyLeaderboard(friends, ownUser) {
  const entries = await Promise.all(
    friends.map(async (f) => {
      const snap = await getDoc(doc(db, "users", f.uid));
      const data = snap.data();
      if (!data) return null;
      const delta = Math.max(0, (data.nataScore || 0) - (data.scoreAtSnapshot ?? data.nataScore ?? 0));
      return {
        uid: f.uid,
        displayName: data.displayName || f.displayName,
        avatarColor: data.avatarColor,
        verified: !!data.verified,
        isCreator: !!data.isCreator,
        weeklyDelta: delta,
      };
    })
  );

  const ownDelta = Math.max(
    0,
    (ownUser.nataScore || 0) - (ownUser.scoreAtSnapshot ?? ownUser.nataScore ?? 0)
  );
  entries.push({
    uid: ownUser.uid,
    displayName: ownUser.displayName,
    avatarColor: ownUser.avatarColor,
    verified: !!ownUser.verified,
    isCreator: !!ownUser.isCreator,
    weeklyDelta: ownDelta,
    isMe: true,
  });

  return entries.filter(Boolean).sort((a, b) => b.weeklyDelta - a.weeklyDelta);
}
