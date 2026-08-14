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
import VoiceRecorderButton from "../components/VoiceRecorderButton";
import { useAuth } from "../context/AuthContext";
import {
  deleteGroupMessage,
  editGroupMessage,
  leaveGroup,
  listenGroupMessageReactions,
  listenGroupMessages,
  sendGroupMessage,
  sendGroupVoiceMessage,
  toggleGroupMessageReaction,
} from "../services/groupService";
import { reportContent } from "../services/moderationService";
import { colors } from "../theme/colors";

export default function GroupChatScreen({ route, navigation }) {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const listRef = useRef(null);

  const openGroupMenu = () => {
    Alert.alert(groupName, "Was möchtest du tun?", [
      {
        text: "Gruppe verlassen",
        style: "destructive",
        onPress: confirmLeave,
      },
      { text: "Abbrechen", style: "cancel" },
    ]);
  };

  const confirmLeave = () => {
    Alert.alert("Gruppe verlassen", `"${groupName}" wirklich verlassen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Verlassen",
        style: "destructive",
        onPress: async () => {
          await leaveGroup(groupId, user.uid);
          navigation.goBack();
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: groupName,
      headerRight: () => (
        <TouchableOpacity onPress={openGroupMenu} style={{ paddingHorizontal: 8 }}>
          <Text style={{ color: colors.text, fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, groupName]);

  useEffect(() => {
    const unsubscribe = listenGroupMessages(groupId, setMessages);
    return unsubscribe;
  }, [groupId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessage) {
      setText("");
      const editingId = editingMessage.id;
      setEditingMessage(null);
      await editGroupMessage(groupId, editingId, trimmed);
      return;
    }

    setText("");
    await sendGroupMessage(groupId, user.uid, user.displayName, trimmed);
  };

  const handleSendVoice = async (localUri, durationMs) => {
    try {
      await sendGroupVoiceMessage(groupId, user.uid, user.displayName, localUri, durationMs);
    } catch (e) {
      Alert.alert(
        "Noch nicht bereit",
        "Sprachnachrichten sind vorbereitet, aber der Cloud-Speicher dafür ist noch nicht eingerichtet. Bitte später erneut versuchen."
      );
    }
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setText("");
  };

  const handleLongPressMessage = (message) => {
    const isMine = message.senderId === user.uid;
    const options = [
      {
        text: "Mit Herz reagieren",
        onPress: () => toggleGroupMessageReaction(groupId, message.id, user.uid, true),
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
        onPress: () => deleteGroupMessage(groupId, message.id),
      });
    } else {
      options.push({ text: "Melden", onPress: () => setReportTarget({ messageId: message.id, senderId: message.senderId }) });
    }
    options.push({ text: "Abbrechen", style: "cancel" });
    Alert.alert("Nachricht", "Was möchtest du tun?", options);
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
            senderName={item.senderName}
            currentUid={user.uid}
            onLongPress={handleLongPressMessage}
            listenReactions={(messageId, cb) => listenGroupMessageReactions(groupId, messageId, cb)}
            toggleReaction={(messageId, uid, isReacting) =>
              toggleGroupMessageReaction(groupId, messageId, uid, isReacting)
            }
          />
        )}
      />

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
          onChangeText={setText}
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
        title="Nachricht melden"
        onSubmit={(reason) =>
          reportContent({
            reporterId: user.uid,
            targetType: "message",
            targetId: reportTarget.messageId,
            targetUserId: reportTarget.senderId,
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
});
