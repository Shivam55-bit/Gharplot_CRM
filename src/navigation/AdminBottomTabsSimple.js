import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Admin Screens
import DashboardAdmin from '../crm/crmscreens/Admin/DashboardAdmin';
import PropertyManagementScreen from '../crm/crmscreens/Admin/PropertyManagementScreen';
import UserManagementScreen from '../crm/crmscreens/Admin/UserManagementScreen';
import UserLeadAssignmentsScreen from '../crm/crmscreens/Admin/UserLeadAssignmentsScreen';
import EmployeeManagementScreen from '../crm/crmscreens/Admin/EmployeeManagementScreen';
import EmployeeReportsScreen from '../crm/crmscreens/Admin/EmployeeReportsScreen';
import SettingsScreen from '../profile/SettingsScreen';
import AllLeadsScreen from '../crm/crmscreens/Admin/AllLeadsScreen';
import RoleManagementScreen from '../crm/crmscreens/Admin/RoleManagementScreen';
import BadAttendantAlertsScreen from '../crm/crmscreens/Admin/BadAttendantAlertsScreen';
import AdminReminderControlScreen from '../crm/crmscreens/Admin/AdminReminderControlScreen';
import EnquiriesScreen from '../crm/crmscreens/Admin/EnquiriesScreen';

// Placeholder screens for all admin features
const UserAssignmentsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="assignment" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>User Assignments</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Assign tasks and roles</Text>
  </View>
);

const EmployeeManagementListScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="badge" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Employee Management</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Manage employee records</Text>
  </View>
);

const AdminRemindersControlScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="schedule" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Admin Reminders Control</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Control reminder system</Text>
  </View>
);

const PropertyListingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="list" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Property Listings</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>All property listings</Text>
  </View>
);

const BoughtPropertyScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="home-work" size={64} color="#28a745" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Bought Property</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Sold properties record</Text>
  </View>
);

const ServiceManagementScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="room-service" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Service Management</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Manage services offered</Text>
  </View>
);

const USPCategoriesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="category" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>USP Categories</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Unique selling point categories</Text>
  </View>
);

const USPEmployeesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="person-pin" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>USP Employees</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Employee USP management</Text>
  </View>
);

const MyRemindersScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="notifications" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>My Reminders</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Personal reminders</Text>
  </View>
);

const FollowUpsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="follow-the-signs" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Follow Ups</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Track follow-ups</Text>
  </View>
);

const AlertsListScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="notification-important" size={64} color="#ef4444" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Alerts</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>System alerts</Text>
  </View>
);

const ReportsComplaintsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="report-problem" size={64} color="#ef4444" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Reports & Complaints</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Handle reports and complaints</Text>
  </View>
);

const SystemSettingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="settings" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>System Settings</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Configure system settings</Text>
  </View>
);

const SecurityScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="security" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Security</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Security settings</Text>
  </View>
);

const AddPropertyScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <MaterialIcons name="add-home" size={64} color="#007AFF" />
    <Text style={{ fontSize: 18, color: '#333', marginTop: 16 }}>Add Property</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Add new property to system</Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack Navigator
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
    <Stack.Screen
      name="DashboardMain"
      component={DashboardAdmin}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Properties Stack Navigator
const PropertiesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
    <Stack.Screen
      name="PropertyManagement"
      component={PropertyManagementScreen}
      options={{ title: 'Property Management' }}
    />
    <Stack.Screen
      name="PropertyListings"
      component={PropertyListingsScreen}
      options={{ title: 'Property Listings' }}
    />
    <Stack.Screen
      name="AddProperty"
      component={AddPropertyScreen}
      options={{ title: 'Add Property' }}
    />
    <Stack.Screen
      name="BoughtProperty"
      component={BoughtPropertyScreen}
      options={{ title: 'Bought Properties' }}
    />
  </Stack.Navigator>
);

// Management Stack Navigator
const ManagementStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
    <Stack.Screen
      name="UserManagement"
      component={UserManagementScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="UserAssignments"
      component={UserLeadAssignmentsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="RoleManagement"
      component={RoleManagementScreen}
      options={{ title: 'Role Management' }}
    />
    <Stack.Screen
      name="EmployeeManagement"
      component={EmployeeManagementListScreen}
      options={{ title: 'Employee Management' }}
    />
    <Stack.Screen
      name="EmployeeReports"
      component={EmployeeReportsScreen}
      options={{ title: 'Employee Reports' }}
    />
    <Stack.Screen
      name="BadAttendantAlerts"
      component={BadAttendantAlertsScreen}
      options={{ title: 'Bad Attendant Alerts' }}
    />
    <Stack.Screen
      name="AdminRemindersControl"
      component={AdminReminderControlScreen}
      options={{ title: 'Admin Reminders Control' }}
    />
    <Stack.Screen
      name="ServiceManagement"
      component={ServiceManagementScreen}
      options={{ title: 'Service Management' }}
    />
    <Stack.Screen
      name="Enquiries"
      component={EnquiriesScreen}
      options={{ title: 'Enquiries' }}
    />
    <Stack.Screen
      name="USPCategories"
      component={USPCategoriesScreen}
      options={{ title: 'USP Categories' }}
    />
    <Stack.Screen
      name="USPEmployees"
      component={USPEmployeesScreen}
      options={{ title: 'USP Employees' }}
    />
  </Stack.Navigator>
);

// Employee Management Stack Navigator
const EmployeeManagementStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen
      name="EmployeeManagementList"
      component={EmployeeManagementScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="EmployeeReports"
      component={EmployeeReportsScreen}
      options={{ title: 'Employee Reports' }}
    />
  </Stack.Navigator>
);

// Operations Stack Navigator
const OperationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen
      name="AllLeads"
      component={AllLeadsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MyReminders"
      component={MyRemindersScreen}
      options={{ title: 'My Reminders' }}
    />
    <Stack.Screen
      name="FollowUps"
      component={FollowUpsScreen}
      options={{ title: 'Follow Ups' }}
    />
    <Stack.Screen
      name="Alerts"
      component={AlertsListScreen}
      options={{ title: 'Alerts' }}
    />
    <Stack.Screen
      name="ReportsComplaints"
      component={ReportsComplaintsScreen}
      options={{ title: 'Reports & Complaints' }}
    />
  </Stack.Navigator>
);

// Admin Bottom Tabs Navigator with All Features
const AdminBottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Management') {
            iconName = 'settings';
          } else if (route.name === 'Operations') {
            iconName = 'analytics';
          } else if (route.name === 'Properties') {
            iconName = 'home';
          } else if (route.name === 'Employees') {
            iconName = 'badge';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e1e1',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Management"
        component={ManagementStack}
        options={{
          tabBarLabel: 'Management',
        }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeeManagementStack}
        options={{
          tabBarLabel: 'Employees',
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesStack}
        options={{
          tabBarLabel: 'Properties',
        }}
      />
      <Tab.Screen
        name="Operations"
        component={OperationsStack}
        options={{
          tabBarLabel: 'Operations',
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminBottomTabs;