import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import LevelUpCelebration from "../components/LevelUpCelebration";
import NewMessageBanner from "../components/NewMessageBanner";
import AddFriendsScreen from "../screens/AddFriendsScreen";
import BlockedUsersScreen from "../screens/BlockedUsersScreen";
import CameraScreen from "../screens/CameraScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";
import CommentsScreen from "../screens/CommentsScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import LegalScreen from "../screens/LegalScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import QRCodeScreen from "../screens/QRCodeScreen";
import ReferralScreen from "../screens/ReferralScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import ScoreHistoryScreen from "../screens/ScoreHistoryScreen";
import SnapPreviewScreen from "../screens/SnapPreviewScreen";
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
          <LevelUpCelebration />
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
            name="Referral"
            component={ReferralScreen}
            options={{
              title: "Einladungen",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
