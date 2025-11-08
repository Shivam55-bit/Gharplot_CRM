import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// --- MAIN SCREENS ---
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OtpScreen from '../screens/OtpScreen';
import ServicesScreen from '../screens/ServicesScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import AllPropertiesScreen from '../screens/AllPropertiesScreen';
// ⚠️ Note: AppointmentChatScreen not found in your folder screenshot,
// comment it for now if it doesn’t exist
// import AppointmentChatScreen from '../screens/AppointmentChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
// --- PROFILE SCREENS ---
import EditProfileScreen from '../profile/EditProfileScreen';
import NotificationsScreen from '../profile/NotificationsScreen';
import SettingsScreen from '../profile/SettingsScreen';
import HelpScreen from '../profile/HelpScreen';
import ChangePasswordScreen from '../profile/ChangePasswordScreen';
// import ServiceDetailsScreen from '../screens/ServiceDetailsScreen';
// import ScheduleScreen from '../screens/ScheduleScreen';
import BookingConfirmedScreen from '../screens/BookingConfirmedScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import CategoryServicesScreen from '../screens/CategoryServicesScreen';
import PropertyInquiryFormScreen from '../screens/PropertyInquiryFormScreen';

// --- OTHER SCREENS PRESENT ---
import SavedScreen from '../screens/SavedScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';
import TestFCMScreen from '../screens/TestFCMScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import TestLoginScreen from '../screens/TestLoginScreen';

// --- NAVIGATION ---
import BottomTabNavigation from '../navigation/BottomTabNavigation';

// --- QUICK ACTION SCREENS ---
import AddSellScreen from '../screens/AddSellScreen';
// ⚠️ You have `AddSellScreen.js` but not BuyScreen or RentScreen in the folder
// If you add them later, uncomment below
import BuyScreen from '../screens/Quick_Action/BuyScreen';
import RentScreen from '../screens/Quick_Action/RentScreen';
import SellScreen from '../screens/Quick_Action/SellScreen';

const Stack = createStackNavigator();

const AppNavigator = React.forwardRef((props, ref) => {
  return (
    <NavigationContainer ref={ref}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Onboarding + Auth Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />

        {/* Core App */}
        <Stack.Screen name="Home" component={BottomTabNavigation} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} />
        <Stack.Screen name="PropertyDetailsScreen" component={PropertyDetailsScreen} />
        {/* <Stack.Screen name="AppointmentChat" component={AppointmentChatScreen} /> */}
        <Stack.Screen name="AllPropertiesScreen" component={AllPropertiesScreen} />
        {/* <Stack.Screen name='ServiceDetailsScreen' component={ServiceDetailsScreen}/> */}
        {/* <Stack.Screen name='ScheduleScreen' component={ScheduleScreen}/> */}
        <Stack.Screen name='BookingConfirmedScreen' component={BookingConfirmedScreen}/>
        <Stack.Screen name='MyBookingsScreen' component={MyBookingsScreen}/>
        <Stack.Screen name='CategoryServicesScreen' component={CategoryServicesScreen}/>
        <Stack.Screen name='EditPropertyScreen' component={EditPropertyScreen}/>
        <Stack.Screen name='ChatListScreen' component={ChatListScreen}/>
        <Stack.Screen name='ChatDetailScreen' component={ChatDetailScreen}/>
        <Stack.Screen name='PropertyInquiryFormScreen' component={PropertyInquiryFormScreen}/>

        {/* Profile Section */}
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Saved" component={SavedScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />

        {/* Quick Action */}
        <Stack.Screen name="AddSell" component={AddSellScreen} />
        <Stack.Screen name="BuyScreen" component={BuyScreen} />
        <Stack.Screen name="RentScreen" component={RentScreen} />
        <Stack.Screen name='SellScreen' component={SellScreen}/>
        
        {/* FCM Test Screen */}
        <Stack.Screen name="TestFCM" component={TestFCMScreen} />
        
        {/* Notification List Screen */}
        <Stack.Screen name="NotificationList" component={NotificationListScreen} />
        
        {/* Test Login Screen */}
        <Stack.Screen name="TestLogin" component={TestLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;
