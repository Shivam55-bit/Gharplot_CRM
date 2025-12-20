/**
 * Employee Navigator
 * Navigation for employee users with limited access
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Employee Screens
import DashboardEmployee from '../crm/crmscreens/Employee/DashboardEmployee';
import MyLeads from '../screens/Employee/MyLeads';
import MyReminders from '../screens/Employee/MyReminders';
import FollowUps from '../screens/Employee/FollowUps';
import EmployeeReminderAcceptScreen from '../screens/Employee/EmployeeReminderAcceptScreen';
import EmployeeProfile from '../crm/crmscreens/Employee/EmployeeProfile';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="Dashboard" 
      component={DashboardEmployee}
      options={{ title: 'My Dashboard' }}
    />
    <Stack.Screen 
      name="EmployeeProfile" 
      component={EmployeeProfile}
      options={{ title: 'Profile', headerShown: false }}
    />
  </Stack.Navigator>
);

// Leads Stack
const LeadsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="MyLeadsList" 
      component={MyLeads}
      options={{ title: 'My Leads' }}
    />
  </Stack.Navigator>
);

// Reminders Stack
const RemindersStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="MyRemindersList" 
      component={MyReminders}
      options={{ title: 'My Reminders' }}
    />
    <Stack.Screen 
      name="AcceptReminder" 
      component={EmployeeReminderAcceptScreen}
      options={{ title: 'Accept Reminder' }}
    />
  </Stack.Navigator>
);

// Follow-ups Stack
const FollowUpsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="MyFollowUps" 
      component={FollowUps}
      options={{ title: 'Follow-ups' }}
    />
  </Stack.Navigator>
);

const EmployeeNavigator = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'LeadsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'RemindersTab') {
            iconName = focused ? 'alarm' : 'alarm-outline';
          } else if (route.name === 'FollowUpsTab') {
            iconName = focused ? 'call' : 'call-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="LeadsTab"
        component={LeadsStack}
        options={{ tabBarLabel: 'My Leads' }}
      />
      <Tab.Screen
        name="RemindersTab"
        component={RemindersStack}
        options={{ tabBarLabel: 'Reminders' }}
      />
      <Tab.Screen
        name="FollowUpsTab"
        component={FollowUpsStack}
        options={{ tabBarLabel: 'Follow-ups' }}
      />
    </Tab.Navigator>
  );
};

export default EmployeeNavigator;