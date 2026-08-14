import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../components/Icon";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { listenAiMessages, sendAiMessage } from "../services/nataAiService";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

// Eigener, schlanker Chat-Screen statt Wiederverwendung von MessageBubble/
// ChatScreen - dort haengen Reaktionen, Bearbeiten/Loeschen, Streaks etc.
// dran, die fuer einen 1:1-KI-Chat ohne zweite Person keinen Sinn ergeben.
export default function NataAIScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenAiMessages(user.uid, setMessages);
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText("");
    setSending(true);
    try {
      await sendAiMessage(user.uid, trimmed, messages);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScreenHeader onBack={() => navigation.goBack()} title="Nata AI" />
      <Text style={styles.disclosure}>
        KI-gestützter Assistent, kein Mensch - Antworten können falsch sein.
      </Text>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.bubbleMine : styles.bubbleAi,
            ]}
          >
            <Text style={item.role === "user" ? styles.bubbleTextMine : styles.bubbleTextAi}>
              {item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="sparkle" size={26} color={colors.primaryLight} />
            <Text style={styles.emptyTitle}>Frag mich etwas</Text>
            <Text style={styles.emptyText}>
              Ich bin Nata AI - ein KI-Assistent in der App. Ich kann nichts an deinem Konto ändern,
              aber gerne Fragen beantworten oder einfach quatschen.
            </Text>
          </View>
        }
      />

      {sending ? (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text style={styles.typingText}>Nata AI schreibt...</Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nachricht an Nata AI..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Nachricht senden"
        >
          <Icon name="send" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  disclosure: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.bubbleMine,
  },
  bubbleAi: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
  },
  bubbleTextMine: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextAi: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },
  typingText: {
    color: colors.textMuted,
    ...typography.caption,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
