import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import PostCard from "../components/PostCard";
import ScreenHeader from "../components/ScreenHeader";
import { getChallengeParticipantCount, listenChallengeFeed } from "../services/challengeService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function ChallengeFeedScreen({ navigation, route }) {
  const { tag, title } = route.params;
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const unsubscribe = listenChallengeFeed(tag, setPosts);
    return unsubscribe;
  }, [tag]);

  useEffect(() => {
    getChallengeParticipantCount(tag).then(setStats).catch(() => {});
  }, [tag, posts.length]);

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title={title} />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {stats ? `${stats.postCount} Beiträge · ${stats.participantCount} Teilnehmer:innen` : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="flame" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>Noch keine Beiträge zu dieser Challenge.</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreatePost", { challengeTag: tag, challengeTitle: title })}
      >
        <Icon name="plus" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  statsRow: { paddingVertical: spacing.sm },
  statsText: { color: colors.textMuted, ...typography.caption },
  emptyState: { alignItems: "center", paddingVertical: spacing.xxxl },
  emptyText: { color: colors.textMuted, ...typography.footnote, marginTop: spacing.md },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
