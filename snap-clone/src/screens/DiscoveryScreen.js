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
import EmptyState from "../components/EmptyState";
import GradientView from "../components/GradientView";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { getFriendSuggestions, getNataMatches } from "../services/discoveryService";
import { listenFriends, searchUsersByUsername, sendFriendRequest } from "../services/friendService";
import { listenBlockedUsers } from "../services/moderationService";
import { searchRecentPosts } from "../services/postService";
import { getInterestById } from "../utils/interests";
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
  const [nataMatches, setNataMatches] = useState([]);

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

  useEffect(() => {
    if (!user?.interests || user.interests.length === 0) {
      setNataMatches([]);
      return;
    }
    let cancelled = false;
    getNataMatches(user.uid, user.interests, friends.map((f) => f.uid))
      .then((results) => {
        if (!cancelled) setNataMatches(results.filter((m) => !blocked.includes(m.uid)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user.uid, user?.interests, friends, blocked]);

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
          <TouchableOpacity
            onPress={() => setSearchTerm("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Suche löschen"
          >
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
              <EmptyState title="Keine Treffer" text={`Nichts gefunden für "${searchTerm.trim()}".`} />
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

          <Text style={styles.sectionTitle}>Nata Match</Text>
          {!user?.interests || user.interests.length === 0 ? (
            <TouchableOpacity
              style={styles.matchEmptyCard}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={styles.matchEmptyEmoji}>💜</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchEmptyTitle}>Leg deine Interessen fest</Text>
                <Text style={styles.matchEmptyText}>
                  Damit findet Nata Match Menschen, mit denen du wirklich etwas gemeinsam hast.
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ) : nataMatches.length === 0 ? (
            <View style={styles.matchEmptyCard}>
              <Text style={styles.matchEmptyEmoji}>💜</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchEmptyTitle}>Noch keine Übereinstimmungen</Text>
                <Text style={styles.matchEmptyText}>
                  Sobald mehr Personen ihre Interessen festlegen, tauchen sie hier auf.
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={nataMatches}
              keyExtractor={(item) => item.uid}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchListContent}
              renderItem={({ item }) => (
                <View style={styles.matchCard}>
                  <View style={[styles.matchAvatar, { backgroundColor: avatarColorForUid(item.uid) }]}>
                    <Text style={styles.matchAvatarText}>
                      {(item.displayName || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.matchName} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  <Text style={styles.matchPercent}>💜 {item.matchPercent}% gemeinsame Interessen</Text>
                  <View style={styles.matchChipsRow}>
                    {item.sharedInterests.slice(0, 3).map((id) => {
                      const interest = getInterestById(id);
                      return interest ? (
                        <Text key={id} style={styles.matchChipEmoji}>
                          {interest.emoji}
                        </Text>
                      ) : null;
                    })}
                  </View>
                  <TouchableOpacity
                    style={styles.matchButton}
                    onPress={() => navigation.navigate("UserProfile", { uid: item.uid })}
                  >
                    <GradientView colors={[colors.primaryLight, colors.primary]} style={StyleSheet.absoluteFill} />
                    <Text style={styles.matchButtonText}>Verbindung entdecken</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

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
                <EmptyState
                  title="Noch nichts für dich entdeckt"
                  text="Verbinde dich mit Menschen, um personalisierte Empfehlungen zu erhalten."
                  actionLabel="Menschen entdecken"
                  onAction={() => navigation.navigate("AddFriends")}
                />
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
  matchListContent: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  matchEmptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.25)",
  },
  matchEmptyEmoji: {
    fontSize: 22,
  },
  matchEmptyTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  matchEmptyText: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
    lineHeight: 16,
  },
  matchCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.3)",
  },
  matchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  matchAvatarText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 17,
  },
  matchName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  matchPercent: {
    color: colors.primaryDark,
    ...typography.caption,
    fontWeight: "700",
    marginTop: 4,
  },
  matchChipsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  matchChipEmoji: {
    fontSize: 16,
  },
  matchButton: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
    overflow: "hidden",
  },
  matchButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 11,
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
    color: colors.onPrimary,
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
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },
});
