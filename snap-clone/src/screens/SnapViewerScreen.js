import { Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../context/AuthContext";
import { reportContent } from "../services/moderationService";
import { deleteSnap, markSnapViewed } from "../services/snapService";
import { colors } from "../theme/colors";

export default function SnapViewerScreen({ route, navigation }) {
  const { snap } = route.params;
  const { user } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(snap.viewDuration || 5);
  const [reporting, setReporting] = useState(false);
  const closed = useRef(false);

  useEffect(() => {
    markSnapViewed(snap.id, user.uid);

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          closeSnap();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const closeSnap = () => {
    if (closed.current) return;
    closed.current = true;
    deleteSnap(snap.id).finally(() => navigation.goBack());
  };

  return (
    <TouchableWithoutFeedback onPress={closeSnap}>
      <View style={styles.container}>
        {snap.mediaType === "video" ? (
          <Video
            source={{ uri: snap.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
            shouldPlay
          />
        ) : (
          <Image source={{ uri: snap.mediaUrl }} style={styles.media} />
        )}

        <View style={styles.topBar}>
          <Text style={styles.sender}>{snap.senderName}</Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.reportButton} onPress={() => setReporting(true)}>
              <Text style={styles.reportIcon}>⋯</Text>
            </TouchableOpacity>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{secondsLeft}</Text>
            </View>
          </View>
        </View>

        <ReportModal
          visible={reporting}
          onClose={() => setReporting(false)}
          title="Snap melden"
          onSubmit={(reason) =>
            reportContent({
              reporterId: user.uid,
              targetType: "snap",
              targetId: snap.id,
              targetUserId: snap.senderId,
              reason,
            })
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  media: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sender: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  reportIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  timerBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
