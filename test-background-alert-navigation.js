/**
 * Test Background Alert Navigation
 * This file tests notification tap navigation to EditAlertScreen from background state
 */

import messaging from '@react-native-firebase/messaging';
import NavigationService from './src/services/NavigationService';
import { handleNotificationAction } from './src/services/notificationService';

/**
 * Test 1: Check if notification handlers are properly set up
 */
export const checkNotificationHandlers = () => {
  console.log('🔍 Checking notification handlers...');
  
  // Check if background handler is set
  try {
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('✅ onNotificationOpenedApp handler is active');
      return true;
    });
  } catch (error) {
    console.error('❌ onNotificationOpenedApp handler not working:', error);
    return false;
  }
  
  // Check if getInitialNotification works
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('✅ getInitialNotification found notification:', remoteMessage);
      } else {
        console.log('ℹ️ No initial notification found (app not opened from notification)');
      }
    })
    .catch((error) => {
      console.error('❌ getInitialNotification error:', error);
    });
};

/**
 * Test 2: Simulate alert notification data from backend
 */
export const simulateAlertNotification = () => {
  console.log('🧪 Simulating alert notification...');
  
  const mockAlertNotification = {
    data: {
      type: 'alert',
      notificationType: 'alert',
      alertId: '6961e48e699454acd18097f4',
      reason: 'Test Alert Reason',
      date: '2024-01-15',
      time: '14:30',
      repeatDaily: 'false'
    },
    notification: {
      title: '🔔 अलर्ट सूचना',
      body: 'Test Alert Reason'
    }
  };
  
  console.log('📱 Mock notification data:', JSON.stringify(mockAlertNotification, null, 2));
  
  // Test navigation with mock data
  if (NavigationService.navigationRef?.current) {
    console.log('✅ NavigationRef is available');
    handleNotificationAction(mockAlertNotification.data, NavigationService.navigationRef.current);
  } else {
    console.error('❌ NavigationRef not available yet');
  }
};

/**
 * Test 3: Test direct navigation to EditAlertScreen
 */
export const testDirectNavigation = () => {
  console.log('🧪 Testing direct navigation to EditAlertScreen...');
  
  const params = {
    alertId: '6961e48e699454acd18097f4',
    originalReason: 'Test Direct Navigation',
    originalDate: '2024-01-15',
    originalTime: '14:30',
    repeatDaily: false
  };
  
  console.log('📤 Navigation params:', params);
  
  if (NavigationService.navigationRef?.current) {
    try {
      NavigationService.navigate('EditAlert', params);
      console.log('✅ Navigation command sent successfully');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  } else {
    console.error('❌ NavigationRef not available');
  }
};

/**
 * Test 4: Monitor all notification events
 */
export const monitorNotificationEvents = () => {
  console.log('👀 Monitoring notification events...');
  
  // Monitor background notifications
  const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('📱 BACKGROUND TAP DETECTED:');
    console.log('  Type:', remoteMessage.data?.type);
    console.log('  Alert ID:', remoteMessage.data?.alertId);
    console.log('  Full data:', JSON.stringify(remoteMessage.data, null, 2));
    
    // Test if navigation happens
    if (remoteMessage.data?.type === 'alert') {
      console.log('🎯 Alert notification detected, navigation should happen now...');
      
      setTimeout(() => {
        console.log('🔍 Checking if EditAlertScreen opened...');
        const currentRoute = NavigationService.navigationRef?.current?.getCurrentRoute();
        console.log('📍 Current route:', currentRoute?.name);
        
        if (currentRoute?.name === 'EditAlert') {
          console.log('✅ SUCCESS! Navigated to EditAlertScreen');
        } else {
          console.error('❌ FAILED! Current screen is:', currentRoute?.name);
        }
      }, 2000);
    }
  });
  
  // Monitor killed state notifications
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('📱 KILLED STATE TAP DETECTED:');
        console.log('  Type:', remoteMessage.data?.type);
        console.log('  Alert ID:', remoteMessage.data?.alertId);
        console.log('  Full data:', JSON.stringify(remoteMessage.data, null, 2));
      }
    });
  
  console.log('✅ Monitoring active - tap notification from background to test');
  return unsubscribeBackground;
};

/**
 * CURL Command to send test alert notification
 */
export const getTestAlertCurl = (fcmToken) => {
  const curl = `
curl -X POST https://fcm.googleapis.com/fcm/send \\
  -H "Authorization: key=YOUR_SERVER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${fcmToken || 'YOUR_FCM_TOKEN'}",
    "data": {
      "type": "alert",
      "notificationType": "alert",
      "alertId": "6961e48e699454acd18097f4",
      "reason": "Test Alert from CURL",
      "date": "2024-01-15",
      "time": "14:30",
      "repeatDaily": "false"
    },
    "notification": {
      "title": "🔔 अलर्ट सूचना",
      "body": "Test Alert from CURL"
    }
  }'
`;
  
  console.log('📋 Copy this CURL command to send test notification:');
  console.log(curl);
  return curl;
};

// Make functions globally available
if (__DEV__) {
  global.testBackgroundAlertNav = {
    check: checkNotificationHandlers,
    simulate: simulateAlertNotification,
    testDirect: testDirectNavigation,
    monitor: monitorNotificationEvents,
    getCurl: getTestAlertCurl
  };
  
  setTimeout(() => {
    console.log('\n🧪 BACKGROUND ALERT NAVIGATION TEST COMMANDS:');
    console.log('  • global.testBackgroundAlertNav.check() - Check if handlers are set up');
    console.log('  • global.testBackgroundAlertNav.simulate() - Simulate alert notification');
    console.log('  • global.testBackgroundAlertNav.testDirect() - Test direct navigation');
    console.log('  • global.testBackgroundAlertNav.monitor() - Monitor notification taps');
    console.log('  • global.testBackgroundAlertNav.getCurl(token) - Get CURL for test notification');
    console.log('\n💡 Steps to test:');
    console.log('  1. Run: global.testBackgroundAlertNav.monitor()');
    console.log('  2. Put app in background (press home button)');
    console.log('  3. Send notification from backend or use CURL');
    console.log('  4. Tap notification');
    console.log('  5. Check console logs for navigation results\n');
  }, 5000);
}

export default {
  checkNotificationHandlers,
  simulateAlertNotification,
  testDirectNavigation,
  monitorNotificationEvents,
  getTestAlertCurl
};
