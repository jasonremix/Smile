import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { navigationRef } from "../navigation/navigationRef";
import { declineCall, listenIncomingCalls } from "../services/callService";
import { colors } from "../theme/colors";
import { hapticMedium } from "../utils/haptics";
import { isCallingAvailable } from "../utils/webrtcModule";
import Icon from "./Icon";

// Eingehende Anrufe muessen von ueberall in der App sichtbar sein, nicht
// nur auf einem bestimmten Screen - gleiches Prinzip wie NewMessageBanner,
// direkt in RootNavigator neben dem NavigationContainer gerendert.
export default function IncomingCallOverlay() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState(null);
  const [seenIds, setSeenIds] = useState(() => new Set());

  useEffect(() => {
    if (!user?.uid || !isCallingAvailable) return undefined;
    const unsubscribe = listenIncomingCalls(user.uid, (calls) => {
      const call = calls[0] || null;
      if (call && !seenIds.has(call.id)) {
        hapticMedium();
        setSeenIds((prev) => new Set(prev).add(call.id));
      }
      setIncoming(call);
    });
    return unsubscribe;
  }, [user?.uid]);

  if (!incoming) return null;

  const handleAccept = () => {
    setIncoming(null);
    if (navigationRef.isReady()) {
      navigationRef.navigate("Call", {
        role: "callee",
        callId: incoming.id,
        offer: incoming.offer,
        otherUser: {
          uid: incoming.callerId,
          displayName: incoming.callerName,
          avatarColor: incoming.callerAvatarColor,
        },
      });
    }
  };

  const handleDecline = () => {
    declineCall(incoming.id).catch(() => {});
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.avatar, { backgroundColor: incoming.callerAvatarColor || colors.primary }]}>
        <Text style={styles.avatarText}>{(incoming.callerName || "?").charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{incoming.callerName}</Text>
        <Text style={styles.subtitle}>Nata-Anruf …</Text>
      </View>
      <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={handleDecline}>
        <Icon name="close" size={18} color={colors.onPrimary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
        <Icon name="check" size={18} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 56,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 12,
    gap: 10,
    zIndex: 999,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontWeight: "800",
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 1,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: colors.danger,
  },
  acceptButton: {
    backgroundColor: colors.online,
  },
});
