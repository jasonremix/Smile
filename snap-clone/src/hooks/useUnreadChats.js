import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listenChats } from "../services/chatService";

function toMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : 0;
}

export function isChatUnread(chat, uid) {
  if (!chat.lastSenderId || chat.lastSenderId === uid) return false;
  return toMillis(chat.updatedAt) > toMillis(chat.lastReadAt?.[uid]);
}

// Liefert alle Chats des Nutzers plus die Anzahl der ungelesenen - eine
// gemeinsame Basis fuer Tab-Badge und die fett hervorgehobenen Zeilen in der
// Chat-Liste, damit beide garantiert dieselbe Definition von "ungelesen"
// verwenden.
export function useUnreadChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenChats(user.uid, (next) => {
      setChats(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.uid]);

  const unreadCount = user?.uid ? chats.filter((c) => isChatUnread(c, user.uid)).length : 0;

  return { chats, unreadCount, loading };
}
