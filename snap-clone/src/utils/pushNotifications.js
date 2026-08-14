import { Platform } from "react-native";
import Constants from "expo-constants";
import { navigationRef } from "../navigation/navigationRef";

// expo-notifications ist ein natives Modul, das erst mit dem naechsten
// nativen Build in den ausgelieferten Apps steckt - genau wie bei
// expo-haptics/expo-location per require im try/catch nachladen, damit ein
// OTA-Update dieses Moduls installierte Alt-Apps (ohne das native Modul)
// nicht zum Absturz bringt.
let Notifications = null;
try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  Notifications = null;
}

// Best effort und niemals ein Blocker fuer den Login-Fluss - schlaegt
// Registrierung/Berechtigung fehl (oder fehlt das native Modul auf einer
// alten Alt-App), passiert einfach nichts.
export async function registerForPushNotifications(uid, savePushToken) {
  if (!Notifications || !uid) return;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Nata",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 100, 150],
        lightColor: "#9333EA",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (token) await savePushToken(uid, token);
  } catch (e) {
    // Push-Registrierung ist ein Zusatz - darf den Login nie kaputt machen.
  }
}

// Bei Tap auf eine Push-Benachrichtigung (App im Hintergrund/geschlossen)
// zur passenden Stelle navigieren - dieselbe type-Taxonomie wie im
// In-App-Notification-Center (siehe notificationService.js/NotificationsScreen.js).
export function addNotificationResponseListener() {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    if (!navigationRef.isReady()) return;
    switch (data.type) {
      case "message":
        if (data.chatId) navigationRef.navigate("Chat", { chatId: data.chatId, otherUser: data.otherUser });
        break;
      case "like":
      case "comment":
        if (data.postId) navigationRef.navigate("Comments", { postId: data.postId, postAuthorId: data.postAuthorId });
        break;
      case "friendRequest":
      case "friendAccepted":
        navigationRef.navigate("Friends");
        break;
      case "announcement":
        navigationRef.navigate("Notifications");
        break;
      default:
        navigationRef.navigate("Notifications");
    }
  });
  return () => subscription.remove();
}
