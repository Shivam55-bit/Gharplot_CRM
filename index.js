/**
 * @format
 */

// CRITICAL: Import Reanimated fix FIRST before any other imports
import './src/utils/reanimatedFix';

import { AppRegistry, Platform } from 'react-native';

// Initialize HMR configuration (fixes HMRClient.setup() error)
import './src/utils/hmrConfig';

// Initialize worklets error handler
import './src/utils/workletsErrorHandler';

import App from './App';
// Import app name from app.json - use the correct 'name' property
const appName = 'Gharplot'; // Directly use the app name that matches MainActivity.kt

// ============================================
// FCM BACKGROUND HANDLER
// ============================================
// Only import Firebase messaging for mobile platforms with error handling
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    
    // Register background handler for FCM
    // This MUST be done at the top level, not inside a component
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📩 Background Message received in index.js:', remoteMessage);
      
      // Save notification to local storage for when app opens
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        
        if (remoteMessage && remoteMessage.notification) {
          // Get existing notifications
          const existingData = await AsyncStorage.getItem('app_notifications');
          const existingNotifications = existingData ? JSON.parse(existingData) : [];
          
          // Create new notification
          const newNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: remoteMessage.data?.type || 'system',
            title: remoteMessage.notification.title,
            message: remoteMessage.notification.body,
            propertyId: remoteMessage.data?.propertyId,
            chatId: remoteMessage.data?.chatId,
            inquiryId: remoteMessage.data?.inquiryId,
            image: remoteMessage.data?.image,
            timestamp: new Date().toISOString(),
            read: false
          };
          
          // Add to beginning of array
          const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50);
          
          // Save updated notifications
          await AsyncStorage.setItem('app_notifications', JSON.stringify(updatedNotifications));
          
          // Update notification count
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          await AsyncStorage.setItem('notification_count', unreadCount.toString());
          
          console.log('✅ Background notification saved successfully');
        }
      } catch (error) {
        console.error('❌ Error saving background notification:', error);
      }
    });
  } catch (fcmError) {
    console.warn('⚠️ FCM setup failed in index.js:', fcmError.message);
  }
}

// Register the main App component
AppRegistry.registerComponent(appName, () => App);
