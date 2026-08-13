import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View } from "react-native";
import CreateSheet from "../components/CreateSheet";
import Icon from "../components/Icon";
import DiscoveryScreen from "../screens/DiscoveryScreen";
import FriendsScreen from "../screens/FriendsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  return <Icon name={name} size={22} color={focused ? colors.primary : colors.textMuted} />;
}

function CreateTabIcon({ focused }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: focused ? colors.primaryLight : colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginTop: -14,
        shadowColor: colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <Icon name="plus" size={20} color={colors.text} />
    </View>
  );
}

export default function MainTabNavigator() {
  const navigation = useNavigation();
  const [createVisible, setCreateVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { backgroundColor: "#000", borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
        />
        <Tab.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }}
        />
        <Tab.Screen
          name="Create"
          component={View}
          options={{ tabBarIcon: ({ focused }) => <CreateTabIcon focused={focused} /> }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setCreateVisible(true);
            },
          }}
        />
        <Tab.Screen
          name="Friends"
          component={FriendsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }}
        />
      </Tab.Navigator>

      <CreateSheet visible={createVisible} onClose={() => setCreateVisible(false)} navigation={navigation} />
    </>
  );
}
