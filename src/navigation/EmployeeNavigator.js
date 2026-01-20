/**
 * Employee Navigator
 * Navigation for employee users with limited access
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Employee Screens
import DashboardEmployee from '../crm/crmscreens/Employee/DashboardEmployee';
import EmployeeLeads from '../crm/crmscreens/Employee/EmployeeLeads';
import EmployeeReminders from '../crm/crmscreens/Employee/EmployeeReminders';
import EmployeeFollowUps from '../crm/crmscreens/Employee/EmployeeFollowUps';
import EmployeeReminderAcceptScreen from '../screens/Employee/EmployeeReminderAcceptScreen';
import EmployeeProfile from '../crm/crmscreens/Employee/EmployeeProfile';
import CreateAlertScreen from '../crm/crmscreens/Employee/CreateAlertScreen';

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
      <Stack.Screen
        name="CreateAlert"
        component={CreateAlertScreen}
        options={{ title: 'Create Reminder' }}
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
      component={EmployeeLeads}
      options={{ title: 'My Leads', headerShown: false }}
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
      component={EmployeeReminders}
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
      component={EmployeeFollowUps}
      options={{ title: 'Follow-ups', headerShown: false }}
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
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingTop: 8,
        },
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