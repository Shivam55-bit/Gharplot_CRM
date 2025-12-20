/**
 * Admin Navigator
 * Navigation for admin users with full access
 * Uses AdminBottomTabs for main admin navigation
 */

import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AdminBottomTabs from './AdminBottomTabsSimple';

// Additional Admin Screens that might be navigated to from the main tabs
import RoleManagementScreen from '../crm/crmscreens/Admin/RoleManagementScreen';
import Reminders from '../crm/crmscreens/Admin/Reminders';
import Alerts from '../crm/crmscreens/Admin/Alerts';
import EmployeeManagementScreen from '../crm/crmscreens/Admin/EmployeeManagementScreen';
import AdminReminderControlScreen from '../crm/crmscreens/Admin/AdminReminderControlScreen';
import AdminMyReminders from '../crm/crmscreens/Admin/AdminMyReminders';
import AdminReminderMonitorScreen from '../crm/crmscreens/Admin/AdminReminderMonitorScreen';
import BadAttendantAlertsScreen from '../crm/crmscreens/Admin/BadAttendantAlertsScreen';
import EnquiriesScreen from '../crm/crmscreens/Admin/EnquiriesScreen';
import BoughtPropertyScreen from '../crm/crmscreens/Admin/BoughtPropertyScreen';
import ServiceManagementScreen from '../crm/crmscreens/Admin/ServiceManagementScreen';
import USPCategoriesScreen from '../crm/crmscreens/Admin/USPCategoriesScreen';
import USPEmployeesScreen from '../crm/crmscreens/Admin/USPEmployeesScreen';
import MyRemindersScreen from '../crm/crmscreens/Employee/MyReminders';
import FollowUpsScreen from '../crm/crmscreens/Employee/FollowUps';

const Stack = createStackNavigator();

const AdminNavigator = ({ onLogout }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {/* Main Admin Bottom Tabs */}
      <Stack.Screen
        name="AdminMainTabs"
        component={AdminBottomTabs}
      />
      
      {/* Additional Admin Screens accessible from tabs */}
      <Stack.Screen
        name="RoleManagement"
        component={RoleManagementScreen}
        options={{
          headerShown: true,
          title: 'Role Management',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="EmployeeManagement"
        component={EmployeeManagementScreen}
        options={{
          headerShown: true,
          title: 'Employee Management',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="AdminReminders"
        component={Reminders}
        options={{
          headerShown: true,
          title: 'Admin Reminders',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="ReminderControl"
        component={AdminReminderControlScreen}
        options={{
          headerShown: true,
          title: 'Reminder Control',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="ReminderMonitor"
        component={AdminReminderMonitorScreen}
        options={{
          headerShown: true,
          title: 'Monitor Reminders',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="AdminAlerts"
        component={Alerts}
        options={{
          headerShown: true,
          title: 'Admin Alerts',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="BadAttendantAlerts"
        component={BadAttendantAlertsScreen}
        options={{
          headerShown: true,
          title: 'Bad Attendant Alerts',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="AdminRemindersControl"
        component={AdminReminderControlScreen}
        options={{
          headerShown: true,
          title: 'Admin Reminders Control',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="AdminMyReminders"
        component={AdminMyReminders}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BoughtProperty"
        component={BoughtPropertyScreen}
        options={{
          headerShown: true,
          title: 'Bought Properties',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="ServiceManagement"
        component={ServiceManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Enquiries"
        component={EnquiriesScreen}
        options={{
          headerShown: true,
          title: 'Enquiries',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="USPCategories"
        component={USPCategoriesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="USPEmployees"
        component={USPEmployeesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyReminders"
        component={MyRemindersScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FollowUps"
        component={FollowUpsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Alerts"
        component={Alerts}
        options={{
          headerShown: true,
          title: 'Alerts',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;