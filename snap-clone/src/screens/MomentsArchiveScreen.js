import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EmptyState from "../components/EmptyState";
import FilteredMedia from "../components/FilteredMedia";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenMyArchivedStories } from "../services/storyService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

const COLUMNS = 3;

// Zeigt archivierte Momente dauerhaft an - technisch dieselben Story-
// Dokumente, die sonst nach 24h clientseitig aus der Ansicht fallen (siehe
// archiveStory() in storyService.js). Keine neue Kopie, kein neuer Upload.
export default function MomentsArchiveScreen({ navigation }) {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const unsubscribe = listenMyArchivedStories(user.uid, setStories);
    return unsubscribe;
  }, [user.uid]);

  const openStory = (story) => {
    navigation.navigate("StoryViewer", {
      group: {
        ownerId: user.uid,
        ownerName: user.displayName,
        avatarColor: user.avatarColor,
        items: [story],
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Momente-Archiv" onBack={() => navigation.goBack()} />
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tile} onPress={() => openStory(item)}>
            <FilteredMedia
              uri={item.mediaUrl}
              mediaType={item.mediaType}
              filterId={item.filter}
              style={styles.tileMedia}
            />
            {item.mediaType === "video" ? (
              <View style={styles.videoBadge}>
                <Icon name="video" size={12} color="#fff" />
              </View>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Noch nichts archiviert"
            text={'Öffne einen deiner Momente und tippe auf „Archivieren", um ihn dauerhaft hier zu behalten - auch nach 24 Stunden.'}
          />
        }
      />
    </View>
  );
}

const TILE_SIZE = `${100 / COLUMNS}%`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: spacing.sm,
  },
  tile: {
    width: TILE_SIZE,
    aspectRatio: 0.75,
    padding: spacing.xs,
  },
  tileMedia: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  videoBadge: {
    position: "absolute",
    bottom: spacing.sm + 4,
    right: spacing.sm + 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
});
