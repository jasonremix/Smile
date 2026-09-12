// Soft-Load: react-native-webrtc ist ein natives Modul, das erst mit einem
// komplett neuen nativen Build in Umlauf kommt (nicht per OTA-Update
// nachlieferbar). Bestehende Beta-Installationen auf den bisherigen
// Laufzeit-Versionen (1.0.0/1.0.1/1.1.0) haben den nativen Code nicht
// kompiliert - ein direktes require() wuerde dort beim Laden abstuerzen.
// Gleiches Muster wie schon bei GradientView/expo-haptics in dieser App.
let RTCPeerConnection = null;
let RTCSessionDescription = null;
let RTCIceCandidate = null;
let mediaDevices = null;

try {
  const webrtc = require("react-native-webrtc");
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
} catch (e) {
  // Laeuft auf einem alten nativen Build ohne WebRTC - Anrufe zeigen einen
  // "Update noetig"-Hinweis statt abzustuerzen.
}

export const isCallingAvailable = !!RTCPeerConnection;

export const ICE_SERVERS = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

export { mediaDevices, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription };
