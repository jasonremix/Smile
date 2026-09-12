import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import CreateSheet from "../components/CreateSheet";
import GradientView from "../components/GradientView";
import Icon from "../components/Icon";
import DiscoveryScreen from "../screens/DiscoveryScreen";
import FriendsScreen from "../screens/FriendsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";
import { shadow } from "../theme/shadow";
import { hapticSelection } from "../utils/haptics";

const Tab = createBottomTabNavigator();

// Labels unter den Icons statt reiner Icon-Leiste - eindeutiger als Symbole
// allein zu deuten. numberOfLines/adjustsFontSizeToFit verhindert, dass
// "Connections" auf schmalen Geraeten in zwei Zeilen umbricht (die Tab-Leiste
// teilt die Breite gleichmaessig auf 5 Tabs auf, ohne feste Textbreite haette
// ein zu langes Label sonst umgebrochen und die Leiste verzerrt).
function TabIcon({ name, label, focused }) {
  const color = focused ? colors.primary : colors.textMuted;
  return (
    <View style={{ alignItems: "center", gap: 3, width: 64 }}>
      {focused ? (
        <GradientView
          colors={["rgba(192, 132, 252, 0.22)", "rgba(147, 51, 234, 0.1)"]}
          style={styles.activeIconGlow}
        >
          <Icon name={name} size={21} color={color} />
        </GradientView>
      ) : (
        <Icon name={name} size={21} color={color} />
      )}
      <Text
        style={{ fontSize: 10, fontWeight: "600", color, letterSpacing: -0.1 }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
    </View>
  );
}

// Etwas kleiner/dezenter als vorher - soll der visuelle Mittelpunkt bleiben,
// aber nicht wie ein ueberdimensionierter Floating Action Button wirken.
function CreateTabIcon({ focused }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: focused ? colors.primaryLight : colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginTop: -10,
        ...shadow.sm,
      }}
    >
      <Icon name="plus" size={18} color={colors.text} />
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
            height: 58,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="home" label="Home" focused={focused} />,
            tabBarAccessibilityLabel: "Home",
          }}
        />
        <Tab.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="search" label="Entdecken" focused={focused} />,
            tabBarAccessibilityLabel: "Entdecken",
          }}
        />
        <Tab.Screen
          name="Create"
          component={View}
          options={{
            tabBarIcon: ({ focused }) => <CreateTabIcon focused={focused} />,
            tabBarAccessibilityLabel: "Erstellen",
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              hapticSelection();
              setCreateVisible(true);
            },
          }}
        />
        <Tab.Screen
          name="Friends"
          component={FriendsScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="people" label="Connections" focused={focused} />,
            tabBarAccessibilityLabel: "Connections",
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="person" label="Profil" focused={focused} />,
            tabBarAccessibilityLabel: "Profil",
          }}
        />
      </Tab.Navigator>

      <CreateSheet visible={createVisible} onClose={() => setCreateVisible(false)} navigation={navigation} />
    </>
  );
}

const styles = StyleSheet.create({
  activeIconGlow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
});
