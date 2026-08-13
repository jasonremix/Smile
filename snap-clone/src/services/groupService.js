import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { bumpNataScore } from "./userService";

export async function createGroup({ creatorUid, creatorName, name, members }) {
  const memberIds = Array.from(new Set([creatorUid, ...members.map((m) => m.uid)]));
  const memberNames = { [creatorUid]: creatorName };
  members.forEach((m) => {
    memberNames[m.uid] = m.displayName;
  });

  const docRef = await addDoc(collection(db, "groups"), {
    name,
    memberIds,
    memberNames,
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export function listenGroups(uid, callback) {
  const q = query(
    collection(db, "groups"),
    where("memberIds", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendGroupMessage(groupId, senderId, senderName, text) {
  const messagesRef = collection(db, "groups", groupId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "groups", groupId), {
    lastMessage: text,
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
  });

  await bumpNataScore(senderId, 1, "Nachricht gesendet");
}

export function listenGroupMessages(groupId, callback) {
  const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function leaveGroup(groupId, uid) {
  await updateDoc(doc(db, "groups", groupId), {
    memberIds: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function addGroupMember(groupId, member) {
  await updateDoc(doc(db, "groups", groupId), {
    memberIds: arrayUnion(member.uid),
    [`memberNames.${member.uid}`]: member.displayName,
    updatedAt: serverTimestamp(),
  });
}
