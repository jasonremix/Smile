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
// Bekannte Einschraenkung: Chat-Nachrichten sind laut Regeln unveraenderlich
// (kein delete), daher bleiben sie nach dem Loeschen der zugehoerigen
// Chat-Dokumente als verwaiste, aber unlesbare Daten zurueck (der
// Berechtigungscheck fuer Nachrichten braucht das Eltern-Chat-Dokument, das
// dann nicht mehr existiert). Vollstaendige Bereinigung braucht eine
// serverseitige Cloud Function.
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
  await deleteStorageFolder(`snaps/${uid}`);
  await deleteStorageFolder(`stories/${uid}`);

  await deleteCollectionDocs(query(collection(db, "snaps"), where("senderId", "==", uid)));
  await deleteCollectionDocs(query(collection(db, "snaps"), where("recipientId", "==", uid)));

  await deleteCollectionDocs(
    query(collection(db, "chats"), where("participants", "array-contains", uid))
  );

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

async function deleteCollectionDocs(q) {
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
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
