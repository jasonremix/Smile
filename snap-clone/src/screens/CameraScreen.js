import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FilterPickerRow from "../components/FilterPickerRow";
import Icon from "../components/Icon";
import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { getFilterById } from "../utils/photoFilters";

const HOLD_THRESHOLD_MS = 250;

export default function CameraScreen({ navigation, route }) {
  const intent = route.params?.intent;
  const cameraRef = useRef(null);
  const pressTimer = useRef(null);
  const isRecording = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [recording, setRecording] = useState(false);
  const [filter, setFilter] = useState("none");
  const filterMeta = getFilterById(filter);

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
    if (intent === "post") {
      // Beitraege haben eine eigene, einfachere Vorschau (kein
      // Empfaenger-/Timer-Auswahl wie bei Snaps/Momenten) - direkt zurueck
      // zum Beitrag-erstellen-Screen mit dem aufgenommenen Foto.
      navigation.navigate("CreatePost", { photoUri: photo.uri, filter });
    } else if (intent === "nataAiVision") {
      // Nata AI mit Bild: keine Vorschau/Timer noetig, direkt zurueck zum
      // Chat - das Bild wird dort nur inline an Gemini geschickt, nicht
      // hochgeladen (Firebase Storage ist noch nicht aktiv).
      navigation.navigate("NataAI", { photoUri: photo.uri });
    } else {
      navigation.navigate("SnapPreview", { uri: photo.uri, mediaType: "photo", intent, filter });
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording.current) return;
    isRecording.current = true;
    setRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 15 });
      if (video?.uri) {
        navigation.navigate("SnapPreview", { uri: video.uri, mediaType: "video", intent, filter });
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
    if (intent === "post") return; // Beitraege unterstuetzen kein Video.
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
        {filterMeta.overlayColor ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: filterMeta.overlayColor, opacity: filterMeta.opacity },
            ]}
          />
        ) : null}

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Icon name="close" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
            style={styles.iconButton}
          >
            <Icon name={flash === "off" ? "flashOff" : "flash"} size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sideButton} onPress={() => navigation.navigate("Chats")}>
            <Icon name="chat" size={20} color="#fff" />
            <Text style={styles.sideButtonText}>Chat</Text>
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
            <Icon name="flip" size={20} color="#fff" />
            <Text style={styles.sideButtonText}>Wechseln</Text>
          </TouchableOpacity>
        </View>

        <FilterPickerRow value={filter} onChange={setFilter} style={styles.filterRow} />

        <View style={styles.hintContainer}>
          <Text style={styles.hint}>
            {intent === "post" ? "Tippen fuer Foto" : "Tippen fuer Foto - Halten fuer Video"}
          </Text>
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
    borderRadius: radius.pill,
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    position: "absolute",
    bottom: 160,
    width: "100%",
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
    marginTop: 4,
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
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
    borderRadius: radius.pill,
    backgroundColor: "#fff",
  },
  shutterInnerRecording: {
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
    width: 40,
    height: 40,
  },
});
