import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { getFilterById } from "../utils/photoFilters";

// Rendert ein Foto/Video plus die zum gespeicherten filter-Feld passende
// Farb-Ueberlagerung - siehe utils/photoFilters.js fuer die Begruendung,
// warum das eine Ueberlagerung statt echter Pixel-Filterung ist. Von
// SnapPreviewScreen, SnapViewerScreen und StoryViewerScreen gemeinsam
// genutzt, damit Sender und Empfaenger IMMER denselben Look sehen.
//
// expo-video (Nachfolger von expo-av) braucht einen ueber useVideoPlayer()
// erzeugten Player statt einer rein deklarativen source-Prop - der Hook wird
// unconditionally aufgerufen (source ist null bei Fotos), damit die Regeln
// fuer Hooks nicht verletzt werden. onPlaybackStatusUpdate (frueher ein
// Callback direkt an <Video>) wird jetzt ueber einen eigenen Listener auf
// dem Player nachgebildet, damit ein sich aenderender goNext()-Callback
// (siehe StoryViewerScreen) nicht in einer veralteten Closure haengen bleibt.
export default function FilteredMedia({ uri, mediaType, filterId, style, resizeMode = "cover", videoProps }) {
  const filter = getFilterById(filterId);
  const isVideo = mediaType === "video";
  const { shouldPlay, isLooping, onPlaybackStatusUpdate } = videoProps || {};

  const player = useVideoPlayer(isVideo ? { uri } : null, (p) => {
    p.loop = !!isLooping;
    if (shouldPlay) p.play();
  });

  useEffect(() => {
    if (!isVideo || !onPlaybackStatusUpdate) return;
    const subscription = player.addListener("playToEnd", () => {
      onPlaybackStatusUpdate({ didJustFinish: true });
    });
    return () => subscription.remove();
  }, [player, isVideo, onPlaybackStatusUpdate]);

  return (
    <View style={style}>
      {isVideo ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit={resizeMode}
          nativeControls={false}
        />
      ) : (
        <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode={resizeMode} />
      )}
      {filter.overlayColor ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: filter.overlayColor, opacity: filter.opacity },
          ]}
        />
      ) : null}
    </View>
  );
}
