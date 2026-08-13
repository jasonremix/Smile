import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

const HOLD_THRESHOLD_MS = 250;

export default function CameraScreen({ navigation, route }) {
  const { user } = useAuth();
  const intent = route.params?.intent;
  const cameraRef = useRef(null);
  const pressTimer = useRef(null);
  const isRecording = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [recording, setRecording] = useState(false);

  if (!permission || !micPermission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted || !micPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Nata braucht Zugriff auf Kamera und Mikrofon, um Snaps aufzunehmen.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            await requestPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Zugriff erlauben</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    navigation.navigate("SnapPreview", { uri: photo.uri, mediaType: "photo", intent });
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording.current) return;
    isRecording.current = true;
    setRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 15 });
      if (video?.uri) {
        navigation.navigate("SnapPreview", { uri: video.uri, mediaType: "video", intent });
      }
    } finally {
      isRecording.current = false;
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording.current) {
      cameraRef.current.stopRecording();
    }
  };

  const handlePressIn = () => {
    pressTimer.current = setTimeout(startRecording, HOLD_THRESHOLD_MS);
  };

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (isRecording.current) {
      stopRecording();
    } else {
      takePhoto();
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash} mode="video">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
              <Text style={styles.avatarText}>
                {(user?.displayName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>{flash === "off" ? "⚡️" : "🔆"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sideButton} onPress={() => navigation.navigate("Chats")}>
            <Text style={styles.sideButtonText}>💬{"\n"}Chat</Text>
          </TouchableOpacity>

          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.shutter, recording && styles.shutterRecording]}
          >
            <View style={[styles.shutterInner, recording && styles.shutterInnerRecording]} />
          </Pressable>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <Text style={styles.sideButtonText}>🔄{"\n"}Wechseln</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hintContainer}>
          <Text style={styles.hint}>Tippen fuer Foto - Halten fuer Video</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionText: {
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: {
    color: "#000",
    fontWeight: "700",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
  hintContainer: {
    position: "absolute",
    bottom: 130,
    width: "100%",
    alignItems: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 32,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sideButton: {
    width: 56,
    alignItems: "center",
  },
  sideButtonText: {
    color: "#fff",
    fontSize: 11,
    textAlign: "center",
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterRecording: {
    borderColor: colors.danger,
  },
  shutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
  },
  shutterInnerRecording: {
    borderRadius: 10,
    backgroundColor: colors.danger,
    width: 40,
    height: 40,
  },
});
