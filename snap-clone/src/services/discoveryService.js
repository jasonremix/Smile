import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

// "Freunde von Freunden" - schaut in die Freundeslisten der eigenen Freunde
// und schlaegt Leute vor, die noch nicht befreundet sind. Braucht Leserecht
// auf die Freundeslisten befreundeter Personen (siehe isFriendOf-Ausnahme in
// den Firestore-Regeln) - bewusster, ueblicher Privatsphaere-Kompromiss fuer
// "gemeinsame Freunde"-Funktionen, kein voller oeffentlicher Zugriff.
export async function getFriendSuggestions(currentUid, myFriends, limitCount = 15) {
  const excludedIds = new Set(myFriends.map((f) => f.uid));
  excludedIds.add(currentUid);

  const suggestionMap = new Map();
  const sampleFriends = myFriends.slice(0, 12); // Lesevolumen begrenzen

  await Promise.all(
    sampleFriends.map(async (friend) => {
      // Wer seine Connections-Liste auf "Nur ich" gestellt hat, lehnt diesen
      // Read per Firestore-Regel ab - einfach ueberspringen statt die ganze
      // Vorschlagsberechnung platzen zu lassen.
      let snap;
      try {
        snap = await getDocs(collection(db, "users", friend.uid, "friends"));
      } catch (e) {
        return;
      }
      snap.docs.forEach((d) => {
        const data = d.data();
        if (excludedIds.has(data.uid)) return;
        const existing = suggestionMap.get(data.uid);
        if (existing) {
          existing.mutualCount += 1;
        } else {
          suggestionMap.set(data.uid, {
            uid: data.uid,
            displayName: data.displayName,
            username: data.username,
            mutualCount: 1,
          });
        }
      });
    })
  );

  return Array.from(suggestionMap.values()).sort((a, b) => b.mutualCount - a.mutualCount).slice(0, limitCount);
}

// Nata Match - Jaccard-Ueberschneidung der Interessen (Schnittmenge / Vereinigung),
// keine "perfekt zusammenpassen"-Aussage, nur ein ehrlicher Prozentsatz
// gemeinsamer Interessen. "array-contains-any" filtert serverseitig auf
// Personen mit mindestens einer gemeinsamen Interesse vor, statt die ganze
// users-Collection zu lesen - Firestore erlaubt bis zu 10 Werte, unsere
// eigene Interessenliste ist auf 5 begrenzt, passt also immer.
export async function getNataMatches(currentUid, currentInterests, excludeUids = [], limitCount = 10) {
  if (!currentInterests || currentInterests.length === 0) return [];

  const q = query(
    collection(db, "users"),
    where("interests", "array-contains-any", currentInterests.slice(0, 10)),
    limit(50)
  );
  const snap = await getDocs(q);

  const exclude = new Set([currentUid, ...excludeUids]);
  const currentSet = new Set(currentInterests);

  const scored = snap.docs
    .map((d) => d.data())
    .filter((u) => !exclude.has(u.uid) && u.discoverable !== false)
    .map((u) => {
      const theirSet = new Set(u.interests || []);
      const shared = [...currentSet].filter((i) => theirSet.has(i));
      const union = new Set([...currentSet, ...theirSet]);
      const matchPercent = union.size > 0 ? Math.round((shared.length / union.size) * 100) : 0;
      return {
        uid: u.uid,
        displayName: u.displayName,
        username: u.username,
        avatarColor: u.avatarColor,
        verified: u.verified,
        matchPercent,
        sharedInterests: shared,
      };
    });

  return scored
    .filter((u) => u.matchPercent > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, limitCount);
}
