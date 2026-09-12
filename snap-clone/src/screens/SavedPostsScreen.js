import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import PostCard from "../components/PostCard";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenSavedPosts } from "../services/postService";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export default function SavedPostsScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = listenSavedPosts(user.uid, setPosts);
    return unsubscribe;
  }, [user.uid]);

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Gespeicherte Beiträge" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bookmark" size={26} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Noch nichts gemerkt. Tippe auf das Lesezeichen bei einem Beitrag, um ihn hier
              wiederzufinden.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 18,
  },
});
