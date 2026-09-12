import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export async function submitFeedback({ uid, displayName, category, message }) {
  await addDoc(collection(db, "feedback"), {
    uid,
    displayName,
    category,
    message,
    appVersion: "1.0.0-beta",
    createdAt: serverTimestamp(),
  });
}

export const FEEDBACK_CATEGORIES = [
  { id: "bug", label: "Fehler melden", icon: "bug" },
  { id: "idea", label: "Idee / Wunsch", icon: "bulb" },
  { id: "other", label: "Sonstiges", icon: "chat" },
];
