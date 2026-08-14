import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { savePushToken } from "../services/userService";
import { addNotificationResponseListener, registerForPushNotifications } from "../utils/pushNotifications";
import FounderAnnouncementBanner from "../components/FounderAnnouncementBanner";
import LevelUpCelebration from "../components/LevelUpCelebration";
import NewMessageBanner from "../components/NewMessageBanner";
import UpdateAnnouncementBanner from "../components/UpdateAnnouncementBanner";
import VerifiedCelebration from "../components/VerifiedCelebration";
import AboutScreen from "../screens/AboutScreen";
import AddFriendsScreen from "../screens/AddFriendsScreen";
import BlockedUsersScreen from "../screens/BlockedUsersScreen";
import CameraScreen from "../screens/CameraScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";
import CloseFriendsScreen from "../screens/CloseFriendsScreen";
import CommentsScreen from "../screens/CommentsScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import FounderAnnouncementScreen from "../screens/FounderAnnouncementScreen";
import FounderReportsScreen from "../screens/FounderReportsScreen";
import FounderStatsScreen from "../screens/FounderStatsScreen";
import FounderTicketsScreen from "../screens/FounderTicketsScreen";
import FounderUsersScreen from "../screens/FounderUsersScreen";
import FounderVerificationRequestsScreen from "../screens/FounderVerificationRequestsScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import LegalScreen from "../screens/LegalScreen";
import NataAIScreen from "../screens/NataAIScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import QRCodeScreen from "../screens/QRCodeScreen";
import ReferralScreen from "../screens/ReferralScreen";
import RoadmapScreen from "../screens/RoadmapScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import SavedPostsScreen from "../screens/SavedPostsScreen";
import ScoreHistoryScreen from "../screens/ScoreHistoryScreen";
import SecurityScreen from "../screens/SecurityScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SnapPreviewScreen from "../screens/SnapPreviewScreen";
import TicketsScreen from "../screens/TicketsScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import VerificationRequestScreen from "../screens/VerificationRequestScreen";
import SnapViewerScreen from "../screens/SnapViewerScreen";
import StoryViewerScreen from "../screens/StoryViewerScreen";
import { colors } from "../theme/colors";
import AuthNavigator from "./AuthNavigator";
import MainTabNavigator from "./MainTabNavigator";
import { navigationRef } from "./navigationRef";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function RootNavigator() {
  const { user, initializing, needsProfileSetup } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    registerForPushNotifications(user.uid, savePushToken);
  }, [user?.uid]);

  useEffect(() => addNotificationResponseListener(), []);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {user && !needsProfileSetup ? (
        <>
          <NewMessageBanner />
          <UpdateAnnouncementBanner />
          <FounderAnnouncementBanner />
          <LevelUpCelebration />
          <VerifiedCelebration />
        </>
      ) : null}
      {needsProfileSetup ? (
        <CompleteProfileScreen />
      ) : user ? (
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="Chats"
            component={ChatListScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SnapPreview"
            component={SnapPreviewScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="SnapViewer"
            component={SnapViewerScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="StoryViewer"
            component={StoryViewerScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="AddFriends"
            component={AddFriendsScreen}
            options={{
              title: "Verbinden",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="BlockedUsers"
            component={BlockedUsersScreen}
            options={{
              title: "Blockierte Nutzer",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="DeleteAccount"
            component={DeleteAccountScreen}
            options={{
              title: "Konto löschen",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{
              title: "Rechtliches",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{
              title: "Neue Gruppe",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{
              title: "Feedback geben",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="ScoreHistory"
            component={ScoreHistoryScreen}
            options={{
              title: "Punkte-Historie",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="QRCode"
            component={QRCodeScreen}
            options={{
              title: "Mein Code",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="ScanQR"
            component={ScanQRScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Roadmap" component={RoadmapScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CloseFriends" component={CloseFriendsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NataAI" component={NataAIScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Tickets" component={TicketsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="FounderTickets"
            component={FounderTicketsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FounderReports"
            component={FounderReportsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FounderUsers"
            component={FounderUsersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FounderStats"
            component={FounderStatsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FounderAnnouncement"
            component={FounderAnnouncementScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FounderVerificationRequests"
            component={FounderVerificationRequestsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerificationRequest"
            component={VerificationRequestScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Referral"
            component={ReferralScreen}
            options={{
              title: "Einladungen",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false, presentation: "modal" }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
