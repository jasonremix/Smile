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
import { markStoryViewed } from "../services/storyService";
import { colors } from "../theme/colors";

const PHOTO_DURATION_MS = 5000;

export default function StoryViewerScreen({ route, navigation }) {
  const { group } = route.params;
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [reporting, setReporting] = useState(false);
  const timerRef = useRef(null);

  const items = group.items;
  const current = items[index];

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

        {group.ownerId !== user.uid ? (
          <TouchableOpacity style={styles.reportButton} onPress={() => setReporting(true)}>
            <Text style={styles.reportIcon}>⋯</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {current.mediaType === "video" ? (
        <Video
          source={{ uri: current.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) goNext();
          }}
        />
      ) : (
        <Image source={{ uri: current.mediaUrl }} style={styles.media} />
      )}

      <View style={styles.tapZones}>
        <TouchableWithoutFeedback onPress={goPrev}>
          <View style={styles.tapZoneLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={goNext}>
          <View style={styles.tapZoneRight} />
        </TouchableWithoutFeedback>
      </View>

      <ReportModal
        visible={reporting}
        onClose={() => setReporting(false)}
        title="Story melden"
        onSubmit={(reason) =>
          reportContent({
            reporterId: user.uid,
            targetType: "story",
            targetId: current.id,
            targetUserId: group.ownerId,
            reason,
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
});
