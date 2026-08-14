import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { getFriendSuggestions } from "../services/discoveryService";
import { listenFriends, searchUsersByUsername, sendFriendRequest } from "../services/friendService";
import { listenBlockedUsers } from "../services/moderationService";
import { searchRecentPosts } from "../services/postService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { avatarColorForUid } from "../theme/avatarPalette";

export default function DiscoveryScreen({ navigation }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [peopleResults, setPeopleResults] = useState([]);
  const [postResults, setPostResults] = useState([]);

  useEffect(() => {
    const unsubFriends = listenFriends(user.uid, setFriends);
    const unsubBlocked = listenBlockedUsers(user.uid, (b) => setBlocked(b.map((x) => x.uid)));
    return () => {
      unsubFriends();
      unsubBlocked();
    };
  }, [user.uid]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFriendSuggestions(user.uid, friends)
      .then((results) => {
        if (!cancelled) setSuggestions(results);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid, friends]);

  const visibleSuggestions = useMemo(
    () => suggestions.filter((s) => !blocked.includes(s.uid)),
    [suggestions, blocked]
  );

  const isSearchActive = searchTerm.trim().length >= 2;

  // Kleines Debounce, damit nicht bei jedem Tastenanschlag sofort ein
  // Postsuche-Request (200 Dokumente) losgeschickt wird.
  useEffect(() => {
    if (!isSearchActive) {
      setPeopleResults([]);
      setPostResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      Promise.all([searchUsersByUsername(searchTerm, user.uid), searchRecentPosts(searchTerm)])
        .then(([people, posts]) => {
          if (cancelled) return;
          setPeopleResults(people.filter((p) => !blocked.includes(p.uid)));
          setPostResults(posts.filter((p) => !blocked.includes(p.authorId)));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, isSearchActive, user.uid, blocked]);

  const handleAdd = async (target) => {
    await sendFriendRequest(user, target);
    setSentTo((prev) => [...prev, target.uid]);
  };

  const openPostAuthor = (post) => {
    if (post.authorId === user.uid) navigation.navigate("Profile");
    else navigation.navigate("UserProfile", { uid: post.authorId });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Entdecken" />
      <View style={styles.content}>

      <View style={styles.searchBox}>
        <Icon name="search" size={15} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Personen oder Beiträge suchen"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchTerm("")} hitSlop={8}>
            <Icon name="close" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isSearchActive ? (
        searching ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={[
              ...(peopleResults.length > 0 ? [{ isHeader: true, key: "h-people", title: "Personen" }] : []),
              ...peopleResults.map((p) => ({ isPerson: true, key: `p-${p.uid}`, item: p })),
              ...(postResults.length > 0 ? [{ isHeader: true, key: "h-posts", title: "Beiträge" }] : []),
              ...postResults.map((p) => ({ isPost: true, key: `post-${p.id}`, item: p })),
            ]}
            keyExtractor={(entry) => entry.key}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item: entry }) => {
              if (entry.isHeader) {
                return <Text style={styles.sectionTitle}>{entry.title}</Text>;
              }
              if (entry.isPerson) {
                const item = entry.item;
                const alreadySent = sentTo.includes(item.uid);
                return (
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.rowTouchable}
                      onPress={() => navigation.navigate("UserProfile", { uid: item.uid })}
                    >
                      <View style={[styles.rowAvatar, { backgroundColor: avatarColorForUid(item.uid) }]}>
                        <Text style={styles.rowAvatarText}>
                          {(item.displayName || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rowTextBlock}>
                        <Text style={styles.name}>{item.displayName}</Text>
                        <Text style={styles.mutual}>@{item.username}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addButton, alreadySent && styles.addButtonDisabled]}
                      onPress={() => handleAdd(item)}
                      disabled={alreadySent}
                    >
                      <Text style={styles.addButtonText}>{alreadySent ? "Gesendet" : "Verbinden"}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              const post = entry.item;
              return (
                <TouchableOpacity style={styles.postRow} onPress={() => openPostAuthor(post)}>
                  <View style={[styles.rowAvatar, { backgroundColor: avatarColorForUid(post.authorId) }]}>
                    <Text style={styles.rowAvatarText}>
                      {(post.authorName || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rowTextBlock}>
                    <Text style={styles.name}>{post.authorName}</Text>
                    <Text style={styles.postSnippet} numberOfLines={2}>
                      {post.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Keine Treffer für "{searchTerm.trim()}".</Text>
            }
          />
        )
      ) : (
        <>
          <TouchableOpacity style={styles.qrRow} onPress={() => navigation.navigate("QRCode")}>
            <Icon name="grid" size={20} color={colors.primary} style={styles.qrIcon} />
            <View style={styles.qrTextBlock}>
              <Text style={styles.qrTitle}>Mein Nata-Code</Text>
              <Text style={styles.qrSubtitle}>Zeigen oder scannen, um sich sofort zu vernetzen</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Vielleicht kennst du diese Person</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={visibleSuggestions}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => {
                const alreadySent = sentTo.includes(item.uid);
                return (
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.rowTouchable}
                      onPress={() => navigation.navigate("UserProfile", { uid: item.uid })}
                    >
                      <View style={[styles.rowAvatar, { backgroundColor: avatarColorForUid(item.uid) }]}>
                        <Text style={styles.rowAvatarText}>
                          {(item.displayName || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rowTextBlock}>
                        <Text style={styles.name}>{item.displayName}</Text>
                        <Text style={styles.mutual}>
                          {item.mutualCount} gemeinsame Connection{item.mutualCount === 1 ? "" : "s"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addButton, alreadySent && styles.addButtonDisabled]}
                      onPress={() => handleAdd(item)}
                      disabled={alreadySent}
                    >
                      <Text style={styles.addButtonText}>{alreadySent ? "Gesendet" : "Verbinden"}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Icon name="people" size={26} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Noch nichts für dich entdeckt.</Text>
                  <Text style={styles.emptyText}>
                    Verbinde dich mit Menschen, um personalisierte Empfehlungen zu erhalten.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAction}
                    onPress={() => navigation.navigate("AddFriends")}
                  >
                    <Text style={styles.emptyActionText}>Menschen entdecken</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    padding: 0,
  },
  postRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postSnippet: {
    color: colors.textMuted,
    ...typography.footnote,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  qrIcon: {
    marginRight: 14,
  },
  qrTextBlock: {
    flex: 1,
  },
  qrTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  qrSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  rowAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowAvatarText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  rowTextBlock: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontWeight: "600",
  },
  mutual: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  emptyActionText: {
    color: colors.primaryLight,
    fontWeight: "700",
    fontSize: 13,
  },
});
