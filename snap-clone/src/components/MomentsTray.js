import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import StoryCircle from "./StoryCircle";
import { useAuth } from "../context/AuthContext";
import { listenFriends } from "../services/friendService";
import { listenStoriesForUsers } from "../services/storyService";
import { colors } from "../theme/colors";

// Nata Moments - bewusst ruhiger dargestellt als eine typische "Story"-Leiste:
// keine eigene Tab, sondern direkt im Home eingebettet.
export default function MomentsTray({ navigation }) {
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

  const myMoment = storyGroups.find((g) => g.ownerId === user.uid);
  const friendMoments = storyGroups.filter((g) => g.ownerId !== user.uid);

  const openMyMoment = () => {
    if (myMoment) {
      navigation.navigate("StoryViewer", { group: myMoment });
    } else {
      navigation.navigate("Camera", { intent: "story" });
    }
  };

  if (friendMoments.length === 0 && !myMoment) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moments</Text>
      <FlatList
        data={[{ id: "self" }, ...friendMoments]}
        keyExtractor={(item) => item.ownerId || item.id}
        renderItem={({ item }) =>
          item.id === "self" ? (
            <StoryCircle
              label="Du"
              color={user.avatarColor}
              viewed={!myMoment}
              isSelf={!myMoment}
              onPress={openMyMoment}
            />
          ) : (
            <StoryCircle
              label={item.ownerName}
              color={item.avatarColor}
              viewed={!item.items.some((s) => !s.viewers?.includes(user.uid))}
              onPress={() => navigation.navigate("StoryViewer", { group: item })}
            />
          )
        }
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
});
