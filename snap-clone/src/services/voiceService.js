import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../config/firebase";

// Gemeinsam von chatService/groupService genutzt, damit der Upload-Pfad
// ("voiceMessages/<uid>/<datei>", siehe storage.rules) an nur einer Stelle
// gepflegt wird. Wirft weiter, wenn Firebase Storage noch nicht eingerichtet
// ist (kein Bucket) - die Aufrufer fangen das ab und erklaeren es der Person
// statt einen generischen Fehler zu zeigen.
export async function uploadVoiceMessage(localUri, uid) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const filename = `voiceMessages/${uid}/${Date.now()}-${Math.round(Math.random() * 1e6)}.m4a`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob, { contentType: "audio/m4a" });
  return getDownloadURL(storageRef);
}
