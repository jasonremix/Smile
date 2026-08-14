import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, listAll, ref } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";

// Loescht so viel wie moeglich von den Daten eines Nutzers ueber
// Client-Firestore-Regeln (siehe firestore.rules) und danach das
// Firebase-Auth-Konto selbst.
//
// Bekannte Einschraenkung: Chat-Nachrichten sowie Kommentare/Reaktionen AUF
// eigenen Beitraegen (von ANDEREN Personen verfasst) sind laut Regeln
// unveraenderlich bzw. nicht durch diese Person loeschbar, daher bleiben sie
// nach dem Loeschen der zugehoerigen Eltern-Dokumente als verwaiste, aber
// unlesbare Daten zurueck (der Berechtigungscheck braucht das
// Eltern-Dokument, das dann nicht mehr existiert). Vollstaendige
// Bereinigung braucht eine serverseitige Cloud Function.
export async function deleteAccount({ uid, email, password }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Nicht eingeloggt.");

  // Firebase verlangt fuer sicherheitsrelevante Aktionen wie das Loeschen
  // eines Kontos einen kuerzlich erfolgten Login - deshalb hier erneut mit
  // Passwort bestaetigen.
  const credential = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, credential);

  await deleteOwnFriendEntries(uid);
  await deleteCollectionDocs(query(collection(db, "users", uid, "blocked")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "stories")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "scoreEvents")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "pushTokens")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "aiMessages")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "savedPosts")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "referrals")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "moderationStrikes")));
  await deleteCollectionDocs(query(collection(db, "users", uid, "notifications")));
  await deleteStorageFolder(`snaps/${uid}`);
  await deleteStorageFolder(`stories/${uid}`);

  await deleteCollectionDocs(query(collection(db, "snaps"), where("senderId", "==", uid)));
  await deleteCollectionDocs(query(collection(db, "snaps"), where("recipientId", "==", uid)));

  await deleteCollectionDocs(
    query(collection(db, "chats"), where("participants", "array-contains", uid))
  );

  // Eigene Beitraege - vorher unvollstaendig: blieben nach "Loeschen" mit
  // eingefrorenem Namen/Avatar im Feed und auf fremden Profilen sichtbar.
  // Kommentare/Likes AUF diesen Beitraegen (von anderen Personen) werden
  // dabei nicht einzeln entfernt (siehe Einschraenkung oben).
  await deleteCollectionDocs(query(collection(db, "posts"), where("authorId", "==", uid)));

  await deleteDoc(doc(db, "users", uid));

  await deleteUser(user);
}

async function deleteOwnFriendEntries(uid) {
  const mySnap = await getDocs(collection(db, "users", uid, "friends"));
  for (const friendDoc of mySnap.docs) {
    // Eigene Freundschaftseintraege...
    await deleteDoc(friendDoc.ref);
    // ...und der Spiegel-Eintrag im Freund-Dokument (dafuer erlauben die
    // Regeln explizit auch dem "friendId"-Nutzer den Zugriff).
    await deleteDoc(doc(db, "users", friendDoc.id, "friends", uid)).catch(() => {});
  }
}

// Best effort pro Dokument statt alles-oder-nichts: manche Subcollections
// (scoreEvents, aiMessages, moderationStrikes, referrals) sind mit Absicht
// unveraenderlich (allow delete: if false in firestore.rules), damit
// niemand die eigene Punkte-/Verstoss-Historie manipulieren kann. Ohne
// dieses Abfangen wuerde ein einzelner abgelehnter Schreibvorgang die
// gesamte Kontoloeschung mitten drin abbrechen. Diese Dokumente bleiben
// zurueck, sind aber praktisch unlesbar, sobald das Konto selbst geloescht
// ist (die Leseregel verlangt isOwner(userId), was ein geloeschtes
// Auth-Konto nie wieder erfuellen kann) - dasselbe Prinzip wie bei
// verwaisten Chat-Nachrichten.
async function deleteCollectionDocs(q) {
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
}

async function deleteStorageFolder(path) {
  try {
    const folderRef = ref(storage, path);
    const list = await listAll(folderRef);
    await Promise.all(list.items.map((item) => deleteObject(item).catch(() => {})));
  } catch {
    // Ordner existiert nicht oder Storage ist nicht aktiviert - kein Problem.
  }
}
