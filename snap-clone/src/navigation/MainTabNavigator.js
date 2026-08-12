import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Text } from "react-native";
import CameraScreen from "../screens/CameraScreen";
import ChatListScreen from "../screens/ChatListScreen";
import StoriesScreen from "../screens/StoriesScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Camera"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: "#000", borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📸" focused={focused} /> }}
      />
      <Tab.Screen
        name="Stories"
        component={StoriesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⭐️" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
