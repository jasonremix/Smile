import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { getCallHistory } from "../services/callService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const STATUS_META = {
  ended: { label: "Beendet", icon: "call" },
  missed: { label: "Verpasst", icon: "call" },
  declined: { label: "Abgelehnt", icon: "call" },
};

function formatWhen(ts) {
  if (!ts?.toMillis) return "";
  const date = new Date(ts.toMillis());
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

function formatDuration(call) {
  if (call.status !== "ended" || !call.answeredAt?.toMillis || !call.endedAt?.toMillis) return null;
  const totalSeconds = Math.round((call.endedAt.toMillis() - call.answeredAt.toMillis()) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCallHistory(user.uid)
      .then(setCalls)
      .finally(() => setLoading(false));
  }, [user.uid]);

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Anrufe" />
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isOutgoing = item.callerId === user.uid;
          const otherName = isOutgoing ? item.calleeName : item.callerName;
          const otherAvatarColor = isOutgoing ? item.calleeAvatarColor : item.callerAvatarColor;
          const meta = STATUS_META[item.status] || STATUS_META.ended;
          const missed = item.status === "missed" || item.status === "declined";
          const duration = formatDuration(item);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate("Call", {
                  role: "caller",
                  otherUser: { uid: isOutgoing ? item.calleeId : item.callerId, displayName: otherName, avatarColor: otherAvatarColor },
                })
              }
            >
              <View style={[styles.avatar, { backgroundColor: otherAvatarColor || colors.primary }]}>
                <Text style={styles.avatarText}>{(otherName || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{otherName}</Text>
                <View style={styles.metaRow}>
                  <Icon name={isOutgoing ? "send" : "call"} size={11} color={missed ? colors.danger : colors.textMuted} />
                  <Text style={[styles.metaText, missed && styles.metaTextMissed]}>
                    {isOutgoing ? "Ausgehend" : meta.label} · {formatWhen(item.createdAt)}
                    {duration ? ` · ${duration}` : ""}
                  </Text>
                </View>
              </View>
              <Icon name="call" size={17} color={colors.primaryLight} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              Noch keine Anrufe. Ruf eine Connection über ihr Profil oder den Chat an.
            </Text>
          ) : null
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
  },
  name: {
    color: colors.text,
    ...typography.body,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    color: colors.textMuted,
    ...typography.caption,
  },
  metaTextMissed: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.textMuted,
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
