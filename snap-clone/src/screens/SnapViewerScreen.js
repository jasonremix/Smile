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
import BetaBadge from "../components/BetaBadge";
import Icon from "../components/Icon";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../context/AuthContext";
import { reportContent } from "../services/moderationService";
import { deleteSnap, markSnapReplayed, markSnapViewed } from "../services/snapService";
import { colors } from "../theme/colors";

export default function SnapViewerScreen({ route, navigation }) {
  const { snap } = route.params;
  const { user } = useAuth();
  const [round, setRound] = useState(0); // 0 = erste Ansicht, 1 = Replay
  const [secondsLeft, setSecondsLeft] = useState(snap.viewDuration || 5);
  const [phase, setPhase] = useState("viewing"); // "viewing" | "replayPrompt"
  const [reporting, setReporting] = useState(false);
  const closed = useRef(false);
  const replayUsedRef = useRef(!!snap.replayUsed);

  useEffect(() => {
    if (round === 0) {
      markSnapViewed(snap.id, user.uid);
    }

    setSecondsLeft(snap.viewDuration || 5);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          handleViewEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [round]);

  const handleViewEnd = () => {
    if (replayUsedRef.current) {
      closeSnap();
    } else {
      setPhase("replayPrompt");
    }
  };

  const closeSnap = () => {
    if (closed.current) return;
    closed.current = true;
    deleteSnap(snap.id).finally(() => navigation.goBack());
  };

  const handleReplay = () => {
    replayUsedRef.current = true;
    setPhase("viewing");
    setRound((r) => r + 1);
    markSnapReplayed(snap.id).catch(() => {
      // Best effort - lokal ist das Replay in dieser Sitzung trotzdem verbraucht.
    });
  };

  const handleTap = () => {
    if (phase === "replayPrompt") {
      closeSnap();
    } else {
      handleViewEnd();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {snap.mediaType === "video" ? (
          <Video
            key={round}
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
            {phase === "viewing" ? (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{secondsLeft}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {phase === "replayPrompt" ? (
          <View style={styles.replayOverlay}>
            <BetaBadge style={styles.replayBadge} />
            <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
              <Icon name="repeat" size={15} color={colors.text} style={styles.replayIcon} />
              <Text style={styles.replayButtonText}>Nochmal ansehen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={closeSnap}>
              <Text style={styles.doneButtonText}>Fertig</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
  replayOverlay: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignItems: "center",
  },
  replayBadge: {
    marginBottom: 10,
  },
  replayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 12,
  },
  replayIcon: {
    marginRight: 8,
  },
  replayButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
});
