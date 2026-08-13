import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../context/AuthContext";
import {
  getOrCreateChat,
  isStreakActive,
  listenChat,
  listenMessages,
  markChatRead,
  sendMessage,
  setTypingStatus,
} from "../services/chatService";
import { blockUser, reportContent } from "../services/moderationService";
import { getActiveChatId, setActiveChatId } from "../state/activeChat";
import { colors } from "../theme/colors";

const TYPING_TIMEOUT_MS = 3000;

export default function ChatScreen({ route, navigation }) {
  const { chatId: initialChatId, otherUser } = route.params;
  const { user } = useAuth();
  const [chatId, setChatId] = useState(initialChatId);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [reportTarget, setReportTarget] = useState(null);
  const [streakCount, setStreakCount] = useState(0);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const listRef = useRef(null);
  const chatIdRef = useRef(chatId);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const openChatMenu = () => {
    Alert.alert(otherUser.name, "Was möchtest du tun?", [
      {
        text: "Nutzer melden",
        onPress: () => setReportTarget({ type: "user" }),
      },
      {
        text: "Nutzer blockieren",
        style: "destructive",
        onPress: confirmBlockUser,
      },
      { text: "Abbrechen", style: "cancel" },
    ]);
  };

  const confirmBlockUser = () => {
    Alert.alert(
      "Blockieren",
      `${otherUser.name} blockieren? Ihr seid danach keine Freunde mehr und seht euch gegenseitig nicht mehr.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Blockieren",
          style: "destructive",
          onPress: async () => {
            await blockUser(user.uid, { uid: otherUser.id, displayName: otherUser.name });
            navigation.goBack();
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: streakCount > 0 ? `${otherUser.name}  🔥 ${streakCount}` : otherUser.name,
      headerRight: () => (
        <TouchableOpacity onPress={openChatMenu} style={{ paddingHorizontal: 8 }}>
          <Text style={{ color: colors.text, fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser, streakCount]);

  useEffect(() => {
    let unsubscribeMessages;
    let unsubscribeChat;

    (async () => {
      let id = chatId;
      if (!id) {
        id = await getOrCreateChat(user, { uid: otherUser.id, displayName: otherUser.name });
        setChatId(id);
      }
      chatIdRef.current = id;
      setActiveChatId(id);
      markChatRead(id, user.uid).catch(() => {});
      unsubscribeMessages = listenMessages(id, setMessages);
      unsubscribeChat = listenChat(id, (chat) => {
        setStreakCount(chat && isStreakActive(chat.streakLastDate) ? chat.streakCount || 0 : 0);
        setOtherIsTyping(!!chat?.typing?.[otherUser.id]);
      });
    })();

    return () => {
      unsubscribeMessages && unsubscribeMessages();
      unsubscribeChat && unsubscribeChat();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && chatIdRef.current) {
        setTypingStatus(chatIdRef.current, user.uid, false).catch(() => {});
      }
      if (getActiveChatId() === chatIdRef.current) setActiveChatId(null);
    };
  }, []);

  // Neue Nachrichten, die eintrudeln, waehrend man den Chat bereits offen
  // hat, sollen ihn nicht ungelesen erscheinen lassen.
  useEffect(() => {
    if (!chatId || messages.length === 0) return;
    markChatRead(chatId, user.uid).catch(() => {});
  }, [messages, chatId]);

  const handleChangeText = (value) => {
    setText(value);
    const id = chatIdRef.current;
    if (!id) return; // Tipp-Status erst relevant, sobald der Chat wirklich existiert.

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        setTypingStatus(id, user.uid, true).catch(() => {});
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        setTypingStatus(id, user.uid, false).catch(() => {});
      }, TYPING_TIMEOUT_MS);
    } else if (isTypingRef.current) {
      isTypingRef.current = false;
      setTypingStatus(id, user.uid, false).catch(() => {});
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");

    let id = chatId;
    if (!id) {
      id = await getOrCreateChat(user, { uid: otherUser.id, displayName: otherUser.name });
      setChatId(id);
      chatIdRef.current = id;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      setTypingStatus(id, user.uid, false).catch(() => {});
    }

    await sendMessage(id, user.uid, trimmed);
  };

  const handleLongPressMessage = (message) => {
    if (message.senderId === user.uid) return; // eigene Nachrichten nicht meldbar
    setReportTarget({ type: "message", messageId: message.id });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMine = item.senderId === user.uid;
          return (
            <View style={[styles.bubbleRow, isMine ? styles.rowRight : styles.rowLeft]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleLongPressMessage(item)}
                style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
              >
                <Text style={styles.bubbleText}>{item.text}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {otherIsTyping ? (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{otherUser.name} tippt...</Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nachricht senden..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={handleChangeText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!text.trim()}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      <ReportModal
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title={reportTarget?.type === "message" ? "Nachricht melden" : `${otherUser.name} melden`}
        onSubmit={(reason) =>
          reportContent({
            reporterId: user.uid,
            targetType: reportTarget.type,
            targetId: reportTarget.messageId,
            targetUserId: otherUser.id,
            reason,
          })
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bubbleRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.bubbleMine,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.bubbleTheirs,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 15,
  },
  typingRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  typingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
