import { collection, getDocs } from "firebase/firestore";
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
