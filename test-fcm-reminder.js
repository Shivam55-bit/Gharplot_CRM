// Quick FCM Reminder Test Script
// Run this in React Native development console

console.log('🧪 Starting FCM Reminder Test...');

// Import required services
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const testFCMReminder = async () => {
  try {
    console.log('📱 Testing FCM Token...');
    const token = await messaging().getToken();
    console.log('✅ FCM Token:', token.substring(0, 20) + '...');
    
    console.log('🔔 Testing Notification Permission...');
    const permission = await messaging().requestPermission();
    console.log('✅ Permission Status:', permission);
    
    console.log('🧪 Creating Test Reminder Notification...');
    const testReminder = {
      id: 'test-reminder-' + Date.now(),
      title: 'Test Reminder',
      body: 'This is a test reminder notification',
      data: {
        type: 'reminder',
        reminderData: JSON.stringify({
          title: 'Test Property Visit',
          name: 'Test Client',
          phone: '9999999999',
          location: 'Test Location'
        })
      }
    };
    
    // Create local notification
    await notifee.createChannel({
      id: 'reminder',
      name: 'Property Reminders',
      importance: 4,
    });
    
    await notifee.displayNotification({
      title: testReminder.title,
      body: testReminder.body,
      data: testReminder.data,
      android: {
        channelId: 'reminder',
        importance: 4,
        actions: [
          {
            title: 'View Details',
            pressAction: { id: 'view' }
          },
          {
            title: 'Call Client',
            pressAction: { id: 'call' }
          }
        ]
      }
    });
    
    console.log('✅ Test notification created successfully');
    return 'Test completed successfully';
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return 'Test failed: ' + error.message;
  }
};

// Make available globally for testing
global.testFCMReminder = testFCMReminder;
global.checkNotificationStatus = async () => {
  try {
    const token = await messaging().getToken();
    const permission = await messaging().requestPermission();
    const stored = await AsyncStorage.getItem('fcm_token');
    
    console.log('🔍 FCM Status Check:');
    console.log('  Token exists:', !!token);
    console.log('  Permission:', permission);
    console.log('  Stored token:', !!stored);
    
    return {
      hasToken: !!token,
      permission: permission,
      hasStoredToken: !!stored
    };
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return { error: error.message };
  }
};

console.log('🎯 FCM Test commands ready:');
console.log('  Run: testFCMReminder()');
console.log('  Check: checkNotificationStatus()');