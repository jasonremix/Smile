import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import NewMessageBanner from "../components/NewMessageBanner";
import AddFriendsScreen from "../screens/AddFriendsScreen";
import BlockedUsersScreen from "../screens/BlockedUsersScreen";
import ChatScreen from "../screens/ChatScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import FriendsScreen from "../screens/FriendsScreen";
import LegalScreen from "../screens/LegalScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import ProfileScreen from "../screens/ProfileScreen";
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
      {user && !needsProfileSetup ? <NewMessageBanner /> : null}
      {needsProfileSetup ? (
        <CompleteProfileScreen />
      ) : user ? (
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={MainTabNavigator} options={{ headerShown: false }} />
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
              title: "Freunde hinzufuegen",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="Friends"
            component={FriendsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false, presentation: "modal" }}
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
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
