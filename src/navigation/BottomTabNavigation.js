import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from "react-native";
import { COLORS as THEME_COLORS, FONTS } from '../constants/theme';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import ServicesScreen from "../screens/ServicesScreen";
import SavedScreen from "../screens/SavedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AddSellScreen from "../screens/AddSellScreen";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");
const tabs = ["Home", "Services", "AddSell", "Saved", "Profile"];

// Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const tabWidth = width / state.routes.length;

  return (
    <View style={styles.tabBarContainer} pointerEvents="box-none">
      <View style={styles.tabItemsContainer}>
        {/* simple bar: no active indicator */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = isFocused
            ? options.tabBarIconName.replace("-outline", "")
            : options.tabBarIconName;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // No animations: static sizes and opacities

          if (route.name === "AddSell") {
            return (
              <TouchableOpacity
                key={route.key}
                style={styles.fabButtonContainer}
                onPress={onPress}
                activeOpacity={0.85}
              >
                <View style={styles.fabWrapper}>
                  <View style={styles.fabCircle}>
                    <Icon name="add" size={26} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={{ alignItems: "center" }}>
                <Icon
                  name={iconName}
                  size={isFocused ? 26 : 22} // slightly larger when active to feel bolder
                  color={isFocused ? THEME_COLORS.primary : "#5c6067ff"}
                />
                <Text
                  style={{
                    ...FONTS.caption,
                    fontWeight: isFocused ? '700' : '600',
                    color: isFocused ? THEME_COLORS.primary : "#7d8187ff",
                    marginTop: 3,
                  }}
                >
                  {route.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Main Navigator
const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // hide default labels
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIconName: "home-outline" }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ tabBarIconName: "construct-outline" }}
      />
      <Tab.Screen
        name="AddSell"
        component={AddSellScreen}
        options={{ tabBarIconName: "add-circle-outline" }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{ tabBarIconName: "bookmark-outline" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIconName: "person-outline" }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "transparent",
  },
  tabItemsContainer: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
    backgroundColor: THEME_COLORS.white || '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  fabButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fabWrapper: {
    position: 'absolute',
    top: -6,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    // use app primary blue as fallback instead of orange
    backgroundColor: THEME_COLORS.primary || '#1E90FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  // no active indicator for a simpler look
});

export default BottomTabNavigator;
