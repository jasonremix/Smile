import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../services/postService";
import { colors } from "../theme/colors";

const MAX_LENGTH = 500;

export default function CreatePostScreen({ navigation }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      await createPost({
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatarColor: user.avatarColor,
        authorVerified: user.verified,
        text: trimmed,
      });
      navigation.goBack();
    } catch (e) {
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Icon name="close" size={16} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neuer Beitrag</Text>
        <View style={{ width: 32 }} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Was moechtest du teilen?"
        placeholderTextColor={colors.textMuted}
        multiline
        autoFocus
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX_LENGTH))}
      />
      <Text style={styles.counter}>{text.length}/{MAX_LENGTH}</Text>

      <PrimaryButton
        title="Posten"
        onPress={handlePost}
        disabled={!text.trim() || posting}
        loading={posting}
        style={styles.postButton}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 140,
    textAlignVertical: "top",
  },
  counter: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  postButton: {
    marginTop: 24,
  },
});
