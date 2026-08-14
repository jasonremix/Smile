import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import {
  listenNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const ICON_BY_TYPE = {
  like: "heart",
  comment: "chat",
  friend_request: "people",
  friend_accept: "check",
};

const TEXT_BY_TYPE = {
  like: "hat deinen Beitrag geliked",
  comment: "hat kommentiert",
  friend_request: "moechte sich mit dir verbinden",
  friend_accept: "hat deine Anfrage angenommen",
};

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Gruppiert nach Heute/Gestern/Frueher statt einer langen, undifferenzierten
// Liste - macht auf einen Blick klar, was neu ist.
function groupNotifications(items) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Heute: [], Gestern: [], Frueher: [] };
  for (const n of items) {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : null;
    if (date && isSameDay(date, today)) groups.Heute.push(n);
    else if (date && isSameDay(date, yesterday)) groups.Gestern.push(n);
    else groups.Frueher.push(n);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([title, data]) => ({ title, data }));
}

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = listenNotifications(user.uid, setNotifications);
    return unsubscribe;
  }, [user.uid]);

  const sections = useMemo(() => groupNotifications(notifications), [notifications]);
  const hasUnread = notifications.some((n) => !n.read);

  const handlePress = (n) => {
    if (!n.read) markNotificationRead(user.uid, n.id);

    if (n.type === "like" || n.type === "comment") {
      navigation.navigate("Comments", { postId: n.postId, postAuthorId: user.uid });
    } else if (n.type === "friend_request") {
      navigation.navigate("Friends");
    } else if (n.type === "friend_accept") {
      navigation.navigate("UserProfile", { uid: n.fromUid });
    }
  };

  const flatData = sections.flatMap((s) => [{ isHeader: true, title: s.title }, ...s.data]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Benachrichtigungen"
        onBack={() => navigation.goBack()}
        right={
          hasUnread ? (
            <TouchableOpacity
              onPress={() => markAllNotificationsRead(user.uid, notifications)}
              accessibilityRole="button"
              accessibilityLabel="Alle als gelesen markieren"
            >
              <Text style={styles.markAllText}>Alle gelesen</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={flatData}
        keyExtractor={(item, index) => (item.isHeader ? `header-${item.title}` : item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.isHeader ? (
            <Text style={styles.sectionLabel}>{item.title}</Text>
          ) : (
            <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
              {!item.read ? <View style={styles.unreadDot} /> : <View style={styles.unreadDotSpacer} />}
              <View style={[styles.avatar, { backgroundColor: item.fromAvatarColor || colors.primary }]}>
                <Icon name={ICON_BY_TYPE[item.type] || "bell"} size={15} color={colors.text} />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.rowText}>
                  <Text style={styles.rowName}>{item.fromDisplayName}</Text>{" "}
                  {TEXT_BY_TYPE[item.type] || ""}
                </Text>
                {item.preview ? (
                  <Text style={styles.preview} numberOfLines={1}>
                    "{item.preview}"
                  </Text>
                ) : null}
              </View>
              <Text style={styles.time}>
                {item.createdAt?.toDate ? timeAgo(item.createdAt.toDate()) : ""}
              </Text>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell" size={26} color={colors.textMuted} />
            <Text style={styles.emptyText}>Noch keine Benachrichtigungen.</Text>
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
  markAllText: {
    color: colors.primaryLight,
    ...typography.footnote,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.sectionLabel,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  unreadDotSpacer: {
    width: 7,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  rowText: {
    color: colors.text,
    ...typography.footnote,
    lineHeight: 18,
  },
  rowName: {
    fontWeight: "700",
  },
  preview: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: 2,
  },
  time: {
    color: colors.textMuted,
    ...typography.caption,
    marginLeft: spacing.sm,
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
  },
});
