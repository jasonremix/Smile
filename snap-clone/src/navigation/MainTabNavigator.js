import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import CreateSheet from "../components/CreateSheet";
import Icon from "../components/Icon";
import DiscoveryScreen from "../screens/DiscoveryScreen";
import FriendsScreen from "../screens/FriendsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";
import { shadow } from "../theme/shadow";

const Tab = createBottomTabNavigator();

// Labels unter den Icons statt reiner Icon-Leiste - eindeutiger als
// Symbole allein zu deuten, gerade bei "Entdecken" vs. "Connections".
function TabIcon({ name, label, focused }) {
  const color = focused ? colors.primary : colors.textMuted;
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Icon name={name} size={22} color={color} />
      <Text style={{ fontSize: 10, fontWeight: "600", color }}>{label}</Text>
    </View>
  );
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
        ...shadow.sm,
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
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: 64,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" label="Home" focused={focused} /> }}
        />
        <Tab.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="search" label="Entdecken" focused={focused} />,
          }}
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
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="people" label="Connections" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="person" label="Profil" focused={focused} />,
          }}
        />
      </Tab.Navigator>

      <CreateSheet visible={createVisible} onClose={() => setCreateVisible(false)} navigation={navigation} />
    </>
  );
}
