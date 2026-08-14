import React, { useEffect, useState } from "react";
import {
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
import { addComment, listenComments } from "../services/postService";
import { timeAgo } from "../utils/timeAgo";
import { colors } from "../theme/colors";
import { shadow } from "../theme/shadow";

export default function CommentsScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = listenComments(postId, setComments);
    return unsubscribe;
  }, [postId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await addComment(postId, { authorId: user.uid, authorName: user.displayName, text: trimmed });
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScreenHeader onBack={() => navigation.goBack()} title="Kommentare" />

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{item.authorName}</Text>
              <Text style={styles.commentTime}>
                {item.createdAt?.toDate ? timeAgo(item.createdAt.toDate()) : ""}
              </Text>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Noch keine Kommentare. Sei die erste Person.</Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Kommentieren..."
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  commentRow: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentAuthor: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  commentTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  commentText: {
    color: colors.text,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 19,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
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
