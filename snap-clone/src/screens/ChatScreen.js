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
import Icon from "../components/Icon";
import MessageBubble from "../components/MessageBubble";
import ReportModal from "../components/ReportModal";
import VerifiedBadge from "../components/VerifiedBadge";
import VoiceRecorderButton from "../components/VoiceRecorderButton";
import { useAuth } from "../context/AuthContext";
import { shadow } from "../theme/shadow";
import {
  deleteMessage,
  editMessage,
  getOrCreateChat,
  isStreakActive,
  listenChat,
  listenMessages,
  listenReactions,
  markChatRead,
  sendMessage,
  sendVoiceMessage,
  setTypingStatus,
  toggleReaction,
} from "../services/chatService";
import { blockUser, reportContent } from "../services/moderationService";
import { getActiveChatId, setActiveChatId } from "../state/activeChat";
import { getUserProfile } from "../services/userService";
import { BLOCK_REASON_MESSAGES, checkContent } from "../utils/contentFilter";
import { hapticLight } from "../utils/haptics";
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
  const [otherVerified, setOtherVerified] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
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
      `${otherUser.name} blockieren? Ihr seid danach keine Connections mehr und seht euch gegenseitig nicht mehr.`,
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
      headerTitle: () => (
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {otherUser.name}
          </Text>
          {otherVerified ? <VerifiedBadge size={15} style={styles.headerBadge} /> : null}
          {streakCount > 0 ? (
            <View style={styles.headerStreak}>
              <Icon name="flame" size={13} color={colors.textMuted} />
              <Text style={styles.headerStreakText}>{streakCount}</Text>
            </View>
          ) : null}
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={openChatMenu} style={{ paddingHorizontal: 8 }}>
          <Text style={{ color: colors.text, fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser, streakCount, otherVerified]);

  useEffect(() => {
    getUserProfile(otherUser.id)
      .then((profile) => setOtherVerified(!!profile?.verified))
      .catch(() => {});
  }, [otherUser.id]);

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

    const check = checkContent(trimmed);
    if (check.blocked) {
      Alert.alert("Nachricht nicht möglich", BLOCK_REASON_MESSAGES[check.reason]);
      return;
    }

    hapticLight();

    if (editingMessage) {
      setText("");
      const editingId = editingMessage.id;
      setEditingMessage(null);
      await editMessage(chatIdRef.current, editingId, trimmed);
      return;
    }

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

  const handleSendVoice = async (localUri, durationMs) => {
    let id = chatId;
    if (!id) {
      id = await getOrCreateChat(user, { uid: otherUser.id, displayName: otherUser.name });
      setChatId(id);
      chatIdRef.current = id;
    }
    try {
      await sendVoiceMessage(id, user.uid, localUri, durationMs);
    } catch (e) {
      Alert.alert(
        "Noch nicht bereit",
        "Sprachnachrichten sind vorbereitet, aber der Cloud-Speicher dafür ist noch nicht eingerichtet. Bitte später erneut versuchen."
      );
    }
  };

  const handleLongPressMessage = (message) => {
    const isMine = message.senderId === user.uid;
    const options = [
      {
        text: "Mit Herz reagieren",
        onPress: () => toggleReaction(chatIdRef.current, message.id, user.uid, true),
      },
    ];
    if (isMine) {
      options.push({
        text: "Bearbeiten",
        onPress: () => {
          setEditingMessage(message);
          setText(message.text);
        },
      });
      options.push({
        text: "Löschen",
        style: "destructive",
        onPress: () => deleteMessage(chatIdRef.current, message.id),
      });
    } else {
      options.push({ text: "Melden", onPress: () => setReportTarget({ type: "message", messageId: message.id }) });
    }
    options.push({ text: "Abbrechen", style: "cancel" });
    Alert.alert("Nachricht", "Was möchtest du tun?", options);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setText("");
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
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMine={item.senderId === user.uid}
            currentUid={user.uid}
            onLongPress={handleLongPressMessage}
            listenReactions={(messageId, cb) => listenReactions(chatIdRef.current, messageId, cb)}
            toggleReaction={(messageId, uid, isReacting) =>
              toggleReaction(chatIdRef.current, messageId, uid, isReacting)
            }
          />
        )}
      />

      {otherIsTyping ? (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>{otherUser.name} tippt...</Text>
        </View>
      ) : null}

      {editingMessage ? (
        <View style={styles.editingRow}>
          <Text style={styles.editingText}>Nachricht bearbeiten</Text>
          <TouchableOpacity onPress={cancelEditing}>
            <Icon name="close" size={13} color={colors.textMuted} />
          </TouchableOpacity>
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
        {!text.trim() && !editingMessage ? (
          <VoiceRecorderButton onRecorded={handleSendVoice} />
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!text.trim()}>
            <Icon name={editingMessage ? "check" : "send"} size={16} color={colors.text} />
          </TouchableOpacity>
        )}
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
  },
  headerTitleText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  headerBadge: {
    marginTop: 1,
  },
  headerStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 2,
  },
  headerStreakText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
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
  editingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  editingText: {
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
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },
});
