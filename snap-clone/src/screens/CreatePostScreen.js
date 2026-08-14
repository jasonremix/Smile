import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../services/postService";
import { checkContent, getBlockAlert } from "../utils/contentFilter";
import { colors } from "../theme/colors";

const MAX_LENGTH = 500;

export default function CreatePostScreen({ navigation }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting) return;

    const check = checkContent(trimmed);
    if (check.blocked) {
      const alertInfo = getBlockAlert(check.reason);
      Alert.alert(alertInfo.title, alertInfo.message);
      return;
    }

    setPosting(true);
    try {
      await createPost({
        authorId: user.uid,
        authorName: user.displayName,
        authorUsername: user.username,
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
      <ScreenHeader onBack={() => navigation.goBack()} backIcon="close" title="Neuer Beitrag" />

      <View style={styles.content}>
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
