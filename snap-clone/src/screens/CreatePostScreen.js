import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import FilteredMedia from "../components/FilteredMedia";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";
import { awardChallengeBadge } from "../services/challengeService";
import { listenFriends } from "../services/friendService";
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
  const [textStickers, setTextStickers] = useState([]);
  const [stickerInput, setStickerInput] = useState("");
  const [musicSticker, setMusicSticker] = useState("");
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [friends, setFriends] = useState([]);
  const [showCollabPicker, setShowCollabPicker] = useState(false);
  const [coAuthor, setCoAuthor] = useState(null);

  useEffect(() => {
    const unsubscribe = listenFriends(user.uid, setFriends);
    return unsubscribe;
  }, [user.uid]);

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
        tag: route.params?.challengeTag || null,
        textStickers: photoUri ? textStickers : null,
        musicSticker: photoUri ? musicSticker.trim() || null : null,
        coAuthorId: coAuthor?.uid || null,
        quotedPostId: route.params?.quotedPostId || null,
      });
      if (route.params?.challengeTag) {
        awardChallengeBadge(user.uid, route.params.challengeTag).catch(() => {});
      }
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
      {route.params?.challengeTitle ? (
        <View style={styles.challengeBanner}>
          <Icon name="flame" size={14} color={colors.creator} />
          <Text style={styles.challengeBannerText}>Für Challenge: {route.params.challengeTitle}</Text>
        </View>
      ) : null}

      {route.params?.quotedPostPreview ? (
        <View style={styles.quotePreviewCard}>
          <Icon name="repeat" size={13} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quotePreviewAuthor}>{route.params.quotedPostPreview.authorName}</Text>
            <Text style={styles.quotePreviewText} numberOfLines={2}>
              {route.params.quotedPostPreview.text}
            </Text>
          </View>
        </View>
      ) : null}
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

          {musicSticker ? (
            <View style={styles.musicStickerOverlay}>
              <Icon name="sparkle" size={11} color="#fff" />
              <Text style={styles.musicStickerText} numberOfLines={1}>{musicSticker}</Text>
            </View>
          ) : null}

          {textStickers.length > 0 ? (
            <View style={styles.textStickersOverlay}>
              {textStickers.map((s, i) => (
                <View key={i} style={styles.textStickerChip}>
                  <Text style={styles.textStickerText}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.stickerToolsRow}>
            <TextInput
              style={styles.stickerInput}
              placeholder="Text-Sticker..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={stickerInput}
              onChangeText={setStickerInput}
              onSubmitEditing={() => {
                if (stickerInput.trim() && textStickers.length < 5) {
                  setTextStickers((prev) => [...prev, stickerInput.trim().slice(0, 40)]);
                  setStickerInput("");
                }
              }}
            />
            <TouchableOpacity
              style={styles.stickerAddButton}
              onPress={() => {
                if (stickerInput.trim() && textStickers.length < 5) {
                  setTextStickers((prev) => [...prev, stickerInput.trim().slice(0, 40)]);
                  setStickerInput("");
                }
              }}
            >
              <Icon name="plus" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {showMusicInput ? (
            <TextInput
              style={styles.musicInput}
              placeholder="Künstler - Songtitel"
              placeholderTextColor={colors.textMuted}
              value={musicSticker}
              onChangeText={(t) => setMusicSticker(t.slice(0, 60))}
              autoFocus
              onBlur={() => !musicSticker && setShowMusicInput(false)}
            />
          ) : (
            <TouchableOpacity style={styles.musicToggle} onPress={() => setShowMusicInput(true)}>
              <Icon name="sparkle" size={13} color={colors.creator} />
              <Text style={styles.musicToggleText}>Musik-Sticker hinzufügen</Text>
            </TouchableOpacity>
          )}
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

      {coAuthor ? (
        <View style={styles.collabChosenRow}>
          <Icon name="people" size={14} color={colors.creator} />
          <Text style={styles.collabChosenText}>Gemeinsam mit {coAuthor.displayName}</Text>
          <TouchableOpacity onPress={() => setCoAuthor(null)}>
            <Icon name="close" size={13} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.collabToggle} onPress={() => setShowCollabPicker((v) => !v)}>
          <Icon name="people" size={14} color={colors.creator} />
          <Text style={styles.collabToggleText}>Gemeinsam mit einer Connection posten</Text>
        </TouchableOpacity>
      )}

      {showCollabPicker && !coAuthor ? (
        <View style={styles.collabPicker}>
          {friends.length === 0 ? (
            <Text style={styles.collabEmptyText}>Du hast noch keine Connections.</Text>
          ) : (
            friends.slice(0, 8).map((f) => (
              <TouchableOpacity
                key={f.uid}
                style={styles.collabFriendRow}
                onPress={() => {
                  setCoAuthor(f);
                  setShowCollabPicker(false);
                }}
              >
                <Text style={styles.collabFriendName}>{f.displayName}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}

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
  challengeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.creatorSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  challengeBannerText: {
    color: colors.creator,
    fontSize: 12,
    fontWeight: "700",
  },
  quotePreviewCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
  },
  quotePreviewAuthor: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12.5,
    marginBottom: 2,
  },
  quotePreviewText: {
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 17,
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
    color: colors.primaryDark,
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
  musicStickerOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: "70%",
  },
  musicStickerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  textStickersOverlay: {
    position: "absolute",
    bottom: 60,
    left: spacing.sm,
    gap: 6,
  },
  textStickerChip: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  textStickerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  stickerToolsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.sm,
  },
  stickerInput: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#fff",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  stickerAddButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  musicToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  musicToggleText: {
    color: colors.creator,
    fontSize: 12,
    fontWeight: "700",
  },
  musicInput: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
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
  collabToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  collabToggleText: {
    color: colors.creator,
    fontSize: 13,
    fontWeight: "700",
  },
  collabChosenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.creatorSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  collabChosenText: {
    color: colors.creator,
    fontSize: 12.5,
    fontWeight: "700",
  },
  collabPicker: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    maxHeight: 180,
  },
  collabEmptyText: {
    color: colors.textMuted,
    padding: spacing.md,
    fontSize: 13,
  },
  collabFriendRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  collabFriendName: {
    color: colors.text,
    fontSize: 14,
  },
});
