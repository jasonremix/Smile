import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../config/firebase";

// Gemeinsamer Upload-Helfer fuer Snaps, Momente und Fotos in Beitraegen -
// identische Logik, vorher separat in snapService.js/storyService.js
// dupliziert. folder bestimmt den Storage-Pfad (siehe storage.rules:
// <folder>/<uid>/<dateiname>).
export async function uploadMedia(localUri, folder, uid, mediaType = "photo") {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const extension = mediaType === "video" ? "mp4" : "jpg";
  const contentType = mediaType === "video" ? "video/mp4" : "image/jpeg";
  const filename = `${folder}/${uid}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}
