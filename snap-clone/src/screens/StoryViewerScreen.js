import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import FilteredMedia from "../components/FilteredMedia";
import Icon from "../components/Icon";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../context/AuthContext";
import { reportContent } from "../services/moderationService";
import {
  archiveStory,
  listenMyPollVote,
  markStoryViewed,
  reactToStory,
  unarchiveStory,
  voteInStoryPoll,
} from "../services/storyService";
import { hapticLight } from "../utils/haptics";
import { colors } from "../theme/colors";

const PHOTO_DURATION_MS = 5000;
const DOUBLE_TAP_MS = 280;

export default function StoryViewerScreen({ route, navigation }) {
  const { group } = route.params;
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [archivedState, setArchivedState] = useState(() =>
    Object.fromEntries(group.items.map((it) => [it.id, !!it.archived]))
  );
  const timerRef = useRef(null);
  const lastTapRef = useRef(0);
  const tapTimerRef = useRef(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const [heartVisible, setHeartVisible] = useState(false);
  const [myPollVote, setMyPollVote] = useState(null);

  const items = group.items;
  const current = items[index];
  const isOwn = group.ownerId === user.uid;
  const isArchived = current ? !!archivedState[current.id] : false;

  const showHeartBurst = () => {
    setHeartVisible(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.delay(350),
      Animated.timing(heartScale, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setHeartVisible(false));
  };

  const handleDoubleTap = () => {
    if (!current) return;
    hapticLight();
    showHeartBurst();
    reactToStory(current.ref, user.uid).catch(() => {});
  };

  // Kein react-native-gesture-handler-Rig fuer die Vor-/Zurueck-Zonen -
  // deshalb Doppel-Tipp per Zeitstempel erkannt: kommt ein zweiter Tap
  // innerhalb DOUBLE_TAP_MS, wird die eigentlich geplante Einzel-Tap-Aktion
  // (naechster/vorheriger Moment) verworfen und stattdessen reagiert.
  const handleZoneTap = (singleTapAction) => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < DOUBLE_TAP_MS;
    lastTapRef.current = now;
    if (isDoubleTap) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      handleDoubleTap();
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        singleTapAction();
      }, DOUBLE_TAP_MS);
    }
  };

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  const toggleArchive = async () => {
    try {
      if (isArchived) {
        await unarchiveStory(current.ref);
      } else {
        await archiveStory(current.ref);
      }
      setArchivedState((prev) => ({ ...prev, [current.id]: !isArchived }));
    } catch (e) {
      Alert.alert("Fehler", "Konnte den Moment nicht im Archiv speichern. Versuch's gleich nochmal.");
    }
  };

  useEffect(() => {
    if (!current) {
      navigation.goBack();
      return;
    }

    markStoryViewed(current.ref, user.uid);

    if (current.mediaType === "photo") {
      timerRef.current = setTimeout(goNext, PHOTO_DURATION_MS);
    }

    return () => clearTimeout(timerRef.current);
  }, [index]);

  useEffect(() => {
    if (!current?.pollOptions) {
      setMyPollVote(null);
      return;
    }
    const unsubscribe = listenMyPollVote(group.ownerId, current.id, user.uid, setMyPollVote);
    return unsubscribe;
  }, [current?.id]);

  const handleVote = (optionIndex) => {
    if (myPollVote != null || !current) return;
    setMyPollVote(optionIndex);
    voteInStoryPoll(group.ownerId, current.id, user.uid, optionIndex).catch(() => setMyPollVote(null));
  };

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      navigation.goBack();
    }
  };

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  if (!current) return null;

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {items.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: i < index ? "100%" : i === index ? "100%" : "0%" },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: group.avatarColor || colors.primary }]}>
            <Text style={styles.avatarText}>{(group.ownerName || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.ownerName}>{group.ownerName}</Text>
        </View>

        {isOwn ? (
          <TouchableOpacity style={styles.archiveButton} onPress={toggleArchive}>
            <Text style={styles.archiveText}>{isArchived ? "Im Archiv ✓" : "Archivieren"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.reportButton} onPress={() => setReporting(true)}>
            <Text style={styles.reportIcon}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>

      <FilteredMedia
        uri={current.mediaUrl}
        mediaType={current.mediaType}
        filterId={current.filter}
        style={styles.media}
        videoProps={{
          shouldPlay: true,
          onPlaybackStatusUpdate: (status) => {
            if (status.didJustFinish) goNext();
          },
        }}
      />

      <View style={styles.tapZones}>
        <TouchableWithoutFeedback onPress={() => handleZoneTap(goPrev)}>
          <View style={styles.tapZoneLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => handleZoneTap(goNext)}>
          <View style={styles.tapZoneRight} />
        </TouchableWithoutFeedback>
      </View>

      {current.pollOptions ? (
        <View style={styles.pollCard} pointerEvents="box-none">
          <Text style={styles.pollQuestion}>{current.pollQuestion}</Text>
          {current.pollOptions.map((opt, i) => {
            const votes = current.pollVotes || {};
            const total = Object.values(votes).reduce((s, v) => s + (v || 0), 0);
            const count = votes[String(i)] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const voted = myPollVote != null;
            const isMine = myPollVote === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.pollOption, isMine && styles.pollOptionMine]}
                onPress={() => handleVote(i)}
                disabled={voted}
              >
                {voted ? (
                  <View style={[styles.pollOptionFill, { width: `${pct}%` }]} />
                ) : null}
                <Text style={styles.pollOptionText}>{opt}</Text>
                {voted ? <Text style={styles.pollOptionPct}>{pct}%</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {heartVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.heartBurst,
            {
              opacity: heartScale,
              transform: [{ scale: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.3] }) }],
            },
          ]}
        >
          <Icon name="heart" size={72} color="#fff" />
        </Animated.View>
      ) : null}

      <ReportModal
        visible={reporting}
        onClose={() => setReporting(false)}
        title="Moment melden"
        targetDisplayName={group.ownerName}
        onSubmit={(report) =>
          reportContent({
            reporterId: user.uid,
            targetType: "story",
            targetId: current.id,
            targetUserId: group.ownerId,
            targetDisplayName: group.ownerName,
            ...report,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  progressRow: {
    position: "absolute",
    top: 44,
    left: 12,
    right: 12,
    flexDirection: "row",
    zIndex: 2,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#fff",
  },
  header: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  ownerName: {
    color: "#fff",
    fontWeight: "600",
  },
  reportButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reportIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  archiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  archiveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  tapZoneLeft: {
    flex: 1,
  },
  tapZoneRight: {
    flex: 2,
  },
  pollCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 100,
    zIndex: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 18,
    padding: 16,
  },
  pollQuestion: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  pollOption: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  pollOptionMine: {
    borderColor: "#fff",
  },
  pollOptionFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(147, 51, 234, 0.55)",
  },
  pollOptionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  pollOptionPct: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  heartBurst: {
    position: "absolute",
    top: "45%",
    left: "50%",
    marginLeft: -36,
    marginTop: -36,
    zIndex: 3,
  },
});
