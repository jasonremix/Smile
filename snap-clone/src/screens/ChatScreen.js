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
  markSharedGoalReached,
  proposeSharedGoal,
  respondToSharedGoal,
  sendMessage,
  sendVoiceMessage,
  setTypingStatus,
  toggleReaction,
} from "../services/chatService";
import {
  blockUser,
  getRestrictionAlert,
  getRestrictionStatus,
  recordStrike,
  reportContent,
} from "../services/moderationService";
import { getActiveChatId, setActiveChatId } from "../state/activeChat";
import { getUserProfile } from "../services/userService";
import { checkContent, getBlockAlert } from "../utils/contentFilter";
import { hapticLight } from "../utils/haptics";
import { playSendSound } from "../utils/soundEffects";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";

const TYPING_TIMEOUT_MS = 3000;

function atTimeToday(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function atTimeTomorrow(hour) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

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
  const [otherAvatarColor, setOtherAvatarColor] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [scheduledFor, setScheduledFor] = useState(null);
  const [sharedGoal, setSharedGoal] = useState(null);
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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Call", {
                role: "caller",
                otherUser: { uid: otherUser.id, displayName: otherUser.name, avatarColor: otherAvatarColor },
              })
            }
            style={{ paddingHorizontal: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${otherUser.name} anrufen`}
          >
            <Icon name="call" size={19} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openChatMenu} style={{ paddingHorizontal: 8 }}>
            <Text style={{ color: colors.text, fontSize: 20 }}>⋯</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, otherUser, streakCount, otherVerified, otherAvatarColor]);

  useEffect(() => {
    getUserProfile(otherUser.id)
      .then((profile) => {
        setOtherVerified(!!profile?.verified);
        setOtherAvatarColor(profile?.avatarColor || null);
      })
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
        const activeStreak = chat && isStreakActive(chat.streakLastDate) ? chat.streakCount || 0 : 0;
        setStreakCount(activeStreak);
        setOtherIsTyping(!!chat?.typing?.[otherUser.id]);
        if (chat?.sharedGoalStatus) {
          setSharedGoal({
            days: chat.sharedGoalDays,
            status: chat.sharedGoalStatus,
            proposedBy: chat.sharedGoalProposedBy,
          });
          if (chat.sharedGoalStatus === "active" && activeStreak >= chat.sharedGoalDays) {
            markSharedGoalReached(id).catch(() => {});
          }
        } else {
          setSharedGoal(null);
        }
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

    const restriction = getRestrictionStatus(user);
    if (restriction.restricted) {
      const alertInfo = getRestrictionAlert(restriction);
      Alert.alert(alertInfo.title, alertInfo.message);
      return;
    }

    const check = checkContent(trimmed);
    if (check.blocked) {
      const alertInfo = getBlockAlert(check.reason);
      Alert.alert(alertInfo.title, alertInfo.message);
      if (check.reason !== "self_harm") recordStrike(user, check.reason);
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

    await sendMessage(id, user.uid, trimmed, scheduledFor);
    setScheduledFor(null);
    playSendSound();
  };

  const handlePickSchedule = () => {
    Alert.alert("Zeitkapsel-Nachricht", "Wann soll die Nachricht sichtbar werden?", [
      { text: "In 1 Stunde", onPress: () => setScheduledFor(new Date(Date.now() + 60 * 60 * 1000)) },
      { text: "Heute Abend (20 Uhr)", onPress: () => setScheduledFor(atTimeToday(20)) },
      { text: "Morgen früh (9 Uhr)", onPress: () => setScheduledFor(atTimeTomorrow(9)) },
      { text: "In 3 Tagen", onPress: () => setScheduledFor(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) },
      scheduledFor ? { text: "Zeitkapsel entfernen", style: "destructive", onPress: () => setScheduledFor(null) } : null,
      { text: "Abbrechen", style: "cancel" },
    ].filter(Boolean));
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

  const handleProposeGoal = (days) => {
    proposeSharedGoal(chatIdRef.current, user.uid, days).catch(() => {});
  };

  const handleRespondGoal = (accept) => {
    respondToSharedGoal(chatIdRef.current, accept).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {sharedGoal?.status === "proposed" ? (
        sharedGoal.proposedBy === user.uid ? (
          <View style={styles.goalBanner}>
            <Text style={styles.goalBannerText}>
              Ziel vorgeschlagen: {sharedGoal.days} Tage Streak halten - wartet auf Antwort.
            </Text>
          </View>
        ) : (
          <View style={styles.goalBanner}>
            <Text style={styles.goalBannerText}>
              {otherUser.name} schlägt vor: {sharedGoal.days} Tage Streak halten.
            </Text>
            <View style={styles.goalBannerActions}>
              <TouchableOpacity onPress={() => handleRespondGoal(true)}>
                <Text style={styles.goalBannerAccept}>Annehmen</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRespondGoal(false)}>
                <Text style={styles.goalBannerDecline}>Ablehnen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : sharedGoal?.status === "active" ? (
        <View style={styles.goalBanner}>
          <Text style={styles.goalBannerText}>
            Gemeinsames Ziel: {streakCount}/{sharedGoal.days} Tage Streak 🔥
          </Text>
        </View>
      ) : sharedGoal?.status === "reached" ? (
        <View style={styles.goalBanner}>
          <Text style={styles.goalBannerText}>🎉 Gemeinsames Ziel von {sharedGoal.days} Tagen erreicht!</Text>
        </View>
      ) : streakCount >= 3 ? (
        <View style={styles.goalBanner}>
          <Text style={styles.goalBannerText}>Gemeinsames Streak-Ziel setzen?</Text>
          <View style={styles.goalBannerActions}>
            {[7, 30, 100].map((d) => (
              <TouchableOpacity key={d} onPress={() => handleProposeGoal(d)}>
                <Text style={styles.goalBannerAccept}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

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

      {scheduledFor ? (
        <View style={styles.editingRow}>
          <Text style={styles.editingText}>
            🕐 Wird sichtbar am {scheduledFor.toLocaleDateString("de-DE")}, {scheduledFor.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
          </Text>
          <TouchableOpacity onPress={() => setScheduledFor(null)}>
            <Icon name="close" size={13} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        {!editingMessage ? (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={handlePickSchedule}
            accessibilityRole="button"
            accessibilityLabel="Zeitkapsel-Nachricht planen"
          >
            <Icon name="ticket" size={16} color={scheduledFor ? colors.primaryLight : colors.textMuted} />
          </TouchableOpacity>
        ) : null}
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
            <Icon name={editingMessage ? "check" : "send"} size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <ReportModal
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title={reportTarget?.type === "message" ? "Nachricht melden" : `${otherUser.name} melden`}
        targetDisplayName={otherUser.name}
        onSubmit={(report) =>
          reportContent({
            reporterId: user.uid,
            targetType: reportTarget.type,
            targetId: reportTarget.messageId,
            targetUserId: otherUser.id,
            targetDisplayName: otherUser.name,
            ...report,
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
  goalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.creatorSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  goalBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "600",
  },
  goalBannerActions: {
    flexDirection: "row",
    gap: 12,
  },
  goalBannerAccept: {
    color: colors.creator,
    fontWeight: "800",
    fontSize: 12.5,
  },
  goalBannerDecline: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12.5,
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
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },
  scheduleButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
