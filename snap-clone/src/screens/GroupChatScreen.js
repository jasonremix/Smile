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
import { useAuth } from "../context/AuthContext";
import { leaveGroup, listenGroupMessages, sendGroupMessage } from "../services/groupService";
import { colors } from "../theme/colors";

export default function GroupChatScreen({ route, navigation }) {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
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
    setText("");
    await sendGroupMessage(groupId, user.uid, user.displayName, trimmed);
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
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                {!isMine ? <Text style={styles.senderName}>{item.senderName}</Text> : null}
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nachricht senden..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!text.trim()}>
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
  senderName: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 15,
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
