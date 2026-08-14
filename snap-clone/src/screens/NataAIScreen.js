import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GradientView from "../components/GradientView";
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
export default function NataAIScreen({ navigation, route }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenAiMessages(user.uid, setMessages);
    return unsubscribe;
  }, [user.uid]);

  // Kommt von CameraScreen (intent "nataAiVision") mit dem aufgenommenen
  // Foto zurueck - wird nur lokal als Vorschau gehalten, nicht hochgeladen.
  useEffect(() => {
    if (route.params?.photoUri) {
      setPendingImageUri(route.params.photoUri);
      navigation.setParams({ photoUri: undefined });
    }
  }, [route.params?.photoUri]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingImageUri) || sending) return;
    setText("");
    const imageUri = pendingImageUri;
    setPendingImageUri(null);
    setSending(true);
    try {
      await sendAiMessage(user.uid, trimmed, messages, imageUri);
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
        renderItem={({ item }) =>
          item.role === "user" ? (
            <View style={[styles.bubble, styles.bubbleMine]}>
              {item.hasImage ? (
                <View style={styles.imageTag}>
                  <Icon name="camera" size={11} color={colors.text} />
                  <Text style={styles.imageTagText}>Bild</Text>
                </View>
              ) : null}
              <Text style={styles.bubbleTextMine}>{item.text}</Text>
            </View>
          ) : (
            <View style={styles.aiRow}>
              <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.aiAvatar}>
                <Icon name="sparkle" size={13} color={colors.text} />
              </GradientView>
              <View style={[styles.bubble, styles.bubbleAi]}>
                <Text style={styles.bubbleTextAi}>{item.text}</Text>
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.emptyIcon}>
              <Icon name="sparkle" size={24} color={colors.text} />
            </GradientView>
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

      {pendingImageUri ? (
        <View style={styles.pendingImageRow}>
          <Image source={{ uri: pendingImageUri }} style={styles.pendingImage} />
          <Text style={styles.pendingImageText}>Bild bereit zum Senden</Text>
          <TouchableOpacity onPress={() => setPendingImageUri(null)} hitSlop={8}>
            <Icon name="close" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.navigate("Camera", { intent: "nataAiVision" })}
          accessibilityRole="button"
          accessibilityLabel="Foto an Nata AI schicken"
        >
          <Icon name="camera" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={pendingImageUri ? "Frag etwas zum Bild (optional)..." : "Nachricht an Nata AI..."}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={(!text.trim() && !pendingImageUri) || sending}
          accessibilityRole="button"
          accessibilityLabel="Nachricht senden"
          style={!text.trim() && !pendingImageUri && styles.sendButtonDisabled}
        >
          <GradientView colors={[colors.primaryLight, colors.primary]} style={styles.sendButton}>
            <Icon name="send" size={16} color={colors.text} />
          </GradientView>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.25)",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    alignSelf: "flex-start",
    maxWidth: "90%",
    gap: spacing.xs,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
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
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
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
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  pendingImage: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
  },
  pendingImageText: {
    flex: 1,
    color: colors.textMuted,
    ...typography.caption,
  },
  imageTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  imageTagText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
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
