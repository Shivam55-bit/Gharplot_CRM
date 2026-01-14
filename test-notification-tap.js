/**
 * Test Notification Tap Navigation
 * Run this in console to test if navigation to EditAlert works
 */

// Test 1: Direct navigation test
export const testDirectNavigation = () => {
  console.log('🧪 Testing direct navigation to EditAlert...');
  
  try {
    const NavigationService = require('./src/services/NavigationService').default;
    const { navigationRef } = require('./src/services/NavigationService');
    
    if (navigationRef?.current) {
      console.log('✅ NavigationRef is available');
      
      const testParams = {
        alertId: 'TEST_123',
        originalReason: 'Test Direct Navigation',
        originalDate: '2024-01-15',
        originalTime: '14:30',
        repeatDaily: false
      };
      
      console.log('📤 Navigating with params:', testParams);
      navigationRef.current.navigate('EditAlert', testParams);
      
      setTimeout(() => {
        const currentRoute = navigationRef.current.getCurrentRoute();
        console.log('📍 Current screen:', currentRoute?.name);
        
        if (currentRoute?.name === 'EditAlert') {
          console.log('✅ SUCCESS! Navigation worked!');
        } else {
          console.error('❌ FAILED! Still on screen:', currentRoute?.name);
        }
      }, 1000);
    } else {
      console.error('❌ NavigationRef not available');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Test 2: Simulate notification tap
export const simulateNotificationTap = () => {
  console.log('🧪 Simulating notification tap...');
  
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    
    // Create mock notification
    const mockNotification = {
      data: {
        type: 'alert',
        notificationType: 'alert',
        alertId: 'TEST_456',
        reason: 'Test Simulated Notification',
        date: '2024-01-15',
        time: '15:00',
        repeatDaily: 'false'
      },
      notification: {
        title: '🔔 Test Alert',
        body: 'This is a test notification'
      }
    };
    
    console.log('📱 Mock notification created:', mockNotification);
    console.log('⚠️ Note: This will NOT trigger the actual handler');
    console.log('💡 Instead, use testDirectNavigation() or create real alert from app');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  }
};

// Test 3: Check navigation setup
export const checkNavigationSetup = () => {
  console.log('🔍 Checking navigation setup...');
  
  try {
    const { navigationRef } = require('./src/services/NavigationService');
    
    console.log('1. NavigationRef available:', !!navigationRef);
    console.log('2. NavigationRef.current:', !!navigationRef?.current);
    
    if (navigationRef?.current) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      console.log('3. Current route:', currentRoute?.name);
      
      // Check if EditAlert screen is registered
      const state = navigationRef.current.getState();
      console.log('4. Navigation state:', state);
      
      console.log('✅ Navigation is properly set up');
    } else {
      console.error('❌ NavigationRef.current is null - app not fully loaded');
    }
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
};

// Test 4: Check notification handler
export const checkNotificationHandler = () => {
  console.log('🔍 Checking notification handler...');
  
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    
    console.log('1. Messaging module:', !!messaging);
    console.log('2. Setting up test listener...');
    
    // Test if onNotificationOpenedApp is working
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('🔥 TEST: Handler triggered!');
      console.log('📱 Message:', remoteMessage);
    });
    
    console.log('✅ Handler registered successfully');
    console.log('💡 Now minimize app and tap a notification to test');
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Handler check failed:', error);
  }
};

// Test 5: Reset navigation stack
export const resetToEditAlert = () => {
  console.log('🧪 Testing navigation reset...');
  
  try {
    const { navigationRef } = require('./src/services/NavigationService');
    const { CommonActions } = require('@react-navigation/native');
    
    if (navigationRef?.current) {
      console.log('📍 Current screen:', navigationRef.current.getCurrentRoute()?.name);
      
      console.log('🚀 Resetting to EditAlert...');
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'EditAlert',
              params: {
                alertId: 'RESET_TEST',
                originalReason: 'Reset Test',
                originalDate: '2024-01-15',
                originalTime: '16:00',
                repeatDaily: false
              }
            }
          ],
        })
      );
      
      setTimeout(() => {
        const newRoute = navigationRef.current.getCurrentRoute();
        console.log('📍 New screen:', newRoute?.name);
        
        if (newRoute?.name === 'EditAlert') {
          console.log('✅ SUCCESS! Reset worked!');
        } else {
          console.error('❌ FAILED! Still on:', newRoute?.name);
        }
      }, 1000);
    } else {
      console.error('❌ NavigationRef not available');
    }
  } catch (error) {
    console.error('❌ Reset test failed:', error);
  }
};

// Make available globally in DEV mode
if (__DEV__) {
  global.testNotificationNav = {
    direct: testDirectNavigation,
    simulate: simulateNotificationTap,
    check: checkNavigationSetup,
    handler: checkNotificationHandler,
    reset: resetToEditAlert
  };
  
  setTimeout(() => {
    console.log('\n🧪 NOTIFICATION NAVIGATION TEST COMMANDS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. global.testNotificationNav.direct()   - Test direct navigation');
    console.log('2. global.testNotificationNav.reset()    - Test navigation reset');
    console.log('3. global.testNotificationNav.check()    - Check navigation setup');
    console.log('4. global.testNotificationNav.handler()  - Check notification handler');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }, 3000);
}

export default {
  testDirectNavigation,
  simulateNotificationTap,
  checkNavigationSetup,
  checkNotificationHandler,
  resetToEditAlert
};
