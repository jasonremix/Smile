import { requestRecordingPermissionsAsync } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import {
  acceptCall,
  createCall,
  endCall,
  listenCall,
  listenRemoteIceCandidates,
  sendIceCandidate,
} from "../services/callService";
import { colors } from "../theme/colors";
import { hapticLight } from "../utils/haptics";
import {
  ICE_SERVERS,
  isCallingAvailable,
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "../utils/webrtcModule";

// Sprachanrufe (Beta): Peer-zu-Peer-Audio ueber WebRTC, Firestore
// vermittelt nur kurz Angebot/Antwort/ICE-Kandidaten (siehe callService.js).
// role="caller": diese Person hat den Anruf gestartet, baut das Angebot.
// role="callee": diese Person nimmt einen eingehenden Anruf an, baut die
// Antwort auf ein bereits vorliegendes Angebot.
export default function CallScreen({ navigation, route }) {
  const { user } = useAuth();
  const { role, otherUser, callId: incomingCallId, offer: incomingOffer } = route.params;

  const [callId, setCallId] = useState(incomingCallId || null);
  const [status, setStatus] = useState(incomingCallId ? "accepted" : "ringing");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [setupError, setSetupError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const callIdRef = useRef(incomingCallId || null);
  const statusRef = useRef(incomingCallId ? "accepted" : "ringing");
  const endedRef = useRef(false);
  const timerRef = useRef(null);
  // Der ICE-Kandidaten-Listener startet sofort beim Mounten, die
  // Peer-Connection existiert aber erst, nachdem Mikrofon-Berechtigung +
  // getUserMedia() durchgelaufen sind - trifft in der Zwischenzeit ein
  // Kandidat ein, geht er sonst stillschweigend verloren (pcRef.current
  // waere noch null). Deshalb zwischenspeichern und nach der pc-Erstellung
  // nachtraeglich anwenden.
  const pendingCandidatesRef = useRef([]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  };

  const hangUp = async (silent = false) => {
    if (endedRef.current) return;
    endedRef.current = true;
    cleanup();
    if (!silent && callIdRef.current) {
      try {
        await endCall(callIdRef.current, user.uid, statusRef.current);
      } catch (e) {
        // Bestenfalls beenden - lokal ist der Anruf so oder so vorbei.
      }
    }
    navigation.goBack();
  };

  useEffect(() => {
    if (!isCallingAvailable) return;

    let cancelled = false;

    const setup = async () => {
      try {
        // getUserMedia() von react-native-webrtc fragt auf Android KEINE
        // Laufzeit-Berechtigung selbststaendig ab (anders als expo-camera/
        // expo-audio) - ohne diesen expliziten Request schlaegt der Anruf auf
        // einem Geraet, das Nata noch nie um Mikrofonzugriff gebeten hat,
        // sonst still fehl. expo-audio ist bereits fuer Sprachnachrichten im
        // Einsatz und deckt iOS+Android einheitlich ab.
        const { status } = await requestRecordingPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setSetupError("Kein Mikrofon-Zugriff - in den Geräteeinstellungen erlauben.");
          return;
        }

        const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) return;
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        if (pendingCandidatesRef.current.length > 0) {
          pendingCandidatesRef.current.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
          pendingCandidatesRef.current = [];
        }

        const participants =
          role === "caller" ? { callerId: user.uid, calleeId: otherUser.uid } : { callerId: otherUser.uid, calleeId: user.uid };

        pc.onicecandidate = (event) => {
          if (event.candidate && callIdRef.current) {
            sendIceCandidate(callIdRef.current, role, event.candidate, participants).catch(() => {});
          }
        };

        if (role === "caller") {
          const offer = await pc.createOffer({});
          await pc.setLocalDescription(offer);
          const newCallId = await createCall(user, otherUser, { type: offer.type, sdp: offer.sdp });
          if (cancelled) {
            await endCall(newCallId, user.uid, "ringing").catch(() => {});
            return;
          }
          callIdRef.current = newCallId;
          setCallId(newCallId);
        } else {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await acceptCall(incomingCallId, { type: answer.type, sdp: answer.sdp });
        }
      } catch (e) {
        if (!cancelled) setSetupError("Mikrofon konnte nicht aktiviert werden.");
      }
    };

    setup();
    return () => {
      cancelled = true;
      if (!endedRef.current) cleanup();
    };
  }, []);

  // Auf den eigenen Call-Eintrag hoeren, sobald die ID bekannt ist -
  // Statuswechsel (angenommen/abgelehnt/beendet) und die Antwort-SDP des
  // Gegenparts (nur relevant fuer role="caller") kommen von hier.
  useEffect(() => {
    if (!callId) return undefined;
    const unsubscribe = listenCall(callId, async (call) => {
      if (!call || endedRef.current) return;
      statusRef.current = call.status;

      if (role === "caller" && call.answer && pcRef.current && !pcRef.current.remoteDescription) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(call.answer));
        } catch (e) {
          // Ignorieren - naechster Snapshot bringt ggf. konsistenten Stand.
        }
      }

      if (call.status === "accepted" && status !== "accepted") {
        setStatus("accepted");
        hapticLight();
      } else if (["declined", "ended", "missed"].includes(call.status)) {
        hangUp(true);
      }
    });
    return unsubscribe;
  }, [callId]);

  useEffect(() => {
    if (!callId) return undefined;
    const unsubscribe = listenRemoteIceCandidates(callId, role, user.uid, async (candidateJson) => {
      if (!pcRef.current) {
        pendingCandidatesRef.current.push(candidateJson);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateJson));
      } catch (e) {
        // Einzelner Kandidat fehlgeschlagen ist normal (Timing) - kein Abbruch.
      }
    });
    return unsubscribe;
  }, [callId]);

  useEffect(() => {
    if (status === "accepted" && !timerRef.current) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (status !== "accepted" && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  const toggleMute = () => {
    hapticLight();
    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isCallingAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.updateEmoji}>📞</Text>
        <Text style={styles.updateTitle}>Update nötig</Text>
        <Text style={styles.updateText}>
          Anrufe brauchen die neueste Nata-Version. Aktualisiere die App über deinen Beta-Kanal, um
          telefonieren zu können.
        </Text>
        <TouchableOpacity style={styles.endButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: otherUser.avatarColor || colors.primary }]}>
        <Text style={styles.avatarText}>{(otherUser.displayName || "?").charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{otherUser.displayName}</Text>
      <Text style={styles.status}>
        {setupError
          ? setupError
          : status === "accepted"
          ? formatDuration(seconds)
          : role === "caller"
          ? "Rufe an…"
          : "Anruf wird verbunden…"}
      </Text>

      <View style={styles.spacer} />

      <View style={styles.controlsRow}>
        <TouchableOpacity style={[styles.controlButton, muted && styles.controlButtonActive]} onPress={toggleMute}>
          <Icon name="mic" size={22} color={muted ? "#000" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.endButton} onPress={() => hangUp(false)}>
          <Icon name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 60,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarText: {
    color: "#000",
    fontSize: 34,
    fontWeight: "800",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  status: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
  },
  spacer: {
    flex: 1,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "#fff",
  },
  endButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  updateEmoji: {
    fontSize: 48,
    marginTop: 140,
    marginBottom: 16,
  },
  updateTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  updateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 60,
  },
});
