import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import StoryCircle from "../components/StoryCircle";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { listenStoriesForUsers } from "../services/storyService";
import { colors } from "../theme/colors";

export default function StoriesScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const uids = [user.uid, ...friends.map((f) => f.uid)];
    const unsubscribe = listenStoriesForUsers(uids, setStoryGroups, user.uid);
    return unsubscribe;
  }, [user.uid, friends]);

  const myStory = storyGroups.find((g) => g.ownerId === user.uid);
  const friendStories = storyGroups.filter((g) => g.ownerId !== user.uid);

  const openMyStory = () => {
    if (myStory) {
      navigation.navigate("StoryViewer", { group: myStory });
    } else {
      navigation.navigate("Camera", { intent: "story" });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Storys</Text>

      <View style={styles.myStoryRow}>
        <StoryCircle
          label="Meine Story"
          color={user.avatarColor}
          viewed={!myStory}
          isSelf={!myStory}
          onPress={openMyStory}
        />
        {myStory ? (
          <Text style={styles.addMore} onPress={() => navigation.navigate("Camera", { intent: "story" })}>
            + Neuer Beitrag
          </Text>
        ) : null}
      </View>

      <Text style={styles.subHeader}>Freunde</Text>
      <FlatList
        data={friendStories}
        keyExtractor={(item) => item.ownerId}
        renderItem={({ item }) => {
          const hasUnseen = item.items.some((s) => !s.viewers?.includes(user.uid));
          return (
            <StoryCircle
              label={item.ownerName}
              color={item.avatarColor}
              viewed={!hasUnseen}
              onPress={() => navigation.navigate("StoryViewer", { group: item })}
            />
          );
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Noch keine Storys von deinen Freunden.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  header: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  myStoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addMore: {
    color: colors.primary,
    marginLeft: 12,
  },
  subHeader: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 20,
    textTransform: "uppercase",
  },
  emptyText: {
    color: colors.textMuted,
    paddingVertical: 12,
  },
});
