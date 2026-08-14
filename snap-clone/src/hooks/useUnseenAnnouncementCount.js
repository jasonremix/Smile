import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { listenAnnouncements } from "../services/adminService";
import { getSeenAnnouncementIds } from "../utils/announcementSeen";

// Kombiniert die live Ankuendigungen-Collection mit dem lokal gespeicherten
// "gesehen"-Stand - genutzt fuer den Glocke-Badge auf dem Home-Screen, damit
// neue Ankuendigungen dort genauso auffallen wie neue Benachrichtigungen.
export function useUnseenAnnouncementCount() {
  const [announcements, setAnnouncements] = useState([]);
  const [seenIds, setSeenIds] = useState([]);

  useEffect(() => {
    const unsubscribe = listenAnnouncements(setAnnouncements);
    return unsubscribe;
  }, []);

  // Bei jedem Fokussieren neu laden (nicht nur beim Mount) - nach einem
  // Besuch im Benachrichtigungen-Screen sollen frisch gesehene
  // Ankuendigungen sofort aus dem Badge verschwinden.
  useFocusEffect(
    useCallback(() => {
      getSeenAnnouncementIds().then(setSeenIds);
    }, [])
  );

  return announcements.filter((a) => !seenIds.includes(a.id)).length;
}
