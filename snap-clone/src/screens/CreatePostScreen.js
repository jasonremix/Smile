import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import FilteredMedia from "../components/FilteredMedia";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../services/postService";
import { getRestrictionAlert, getRestrictionStatus, recordStrike } from "../services/moderationService";
import { checkContent, getBlockAlert } from "../utils/contentFilter";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

const MAX_LENGTH = 500;

export default function CreatePostScreen({ navigation, route }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [photoFilter, setPhotoFilter] = useState("none");

  // Kommt zurueck von CameraScreen (intent="post") mit dem aufgenommenen
  // Foto - route.params aendert sich auch bei erneutem Aufnehmen, waehrend
  // dieser Screen die ganze Zeit gemountet bleibt.
  useEffect(() => {
    if (route.params?.photoUri) {
      setPhotoUri(route.params.photoUri);
      setPhotoFilter(route.params.filter || "none");
    }
  }, [route.params?.photoUri]);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting) return;

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

    setPosting(true);
    try {
      await createPost({
        authorId: user.uid,
        authorName: user.displayName,
        authorUsername: user.username,
        authorAvatarColor: user.avatarColor,
        authorVerified: user.verified,
        text: trimmed,
        localMediaUri: photoUri,
        filter: photoFilter,
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

      {photoUri ? (
        <View style={styles.photoPreviewWrap}>
          <FilteredMedia uri={photoUri} mediaType="photo" filterId={photoFilter} style={styles.photoPreview} />
          <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPhotoUri(null)}>
            <Icon name="close" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={() => navigation.navigate("Camera", { intent: "post" })}
        >
          <Icon name="camera" size={16} color={colors.primaryLight} />
          <Text style={styles.addPhotoText}>Foto hinzufügen</Text>
        </TouchableOpacity>
      )}

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
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  addPhotoText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "600",
  },
  photoPreviewWrap: {
    marginTop: spacing.md,
  },
  photoPreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLight,
  },
  removePhotoButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  postButton: {
    marginTop: 24,
  },
});
