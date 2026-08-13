import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function bumpNataScore(uid, amount = 1) {
  await updateDoc(doc(db, "users", uid), {
    nataScore: increment(amount),
  });
}
