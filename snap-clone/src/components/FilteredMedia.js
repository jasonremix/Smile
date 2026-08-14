import { Video } from "expo-av";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { getFilterById } from "../utils/photoFilters";

// Rendert ein Foto/Video plus die zum gespeicherten filter-Feld passende
// Farb-Ueberlagerung - siehe utils/photoFilters.js fuer die Begruendung,
// warum das eine Ueberlagerung statt echter Pixel-Filterung ist. Von
// SnapPreviewScreen, SnapViewerScreen und StoryViewerScreen gemeinsam
// genutzt, damit Sender und Empfaenger IMMER denselben Look sehen.
export default function FilteredMedia({ uri, mediaType, filterId, style, resizeMode = "cover", videoProps }) {
  const filter = getFilterById(filterId);
  return (
    <View style={style}>
      {mediaType === "video" ? (
        <Video source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode={resizeMode} {...videoProps} />
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
