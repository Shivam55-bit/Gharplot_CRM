/**
 * Test Script for Notification Navigation Fix
 * Run this in React Native debugger console to test notification flow
 */

// Test notification navigation
global.testNotificationNavigation = {
  // Test 1: Test reminder notification for specific enquiry
  testReminderNotification: () => {
    try {
      const mockReminderData = {
        id: `test_reminder_${Date.now()}`,
        clientName: "Divya Test Client",
        message: "Follow up with Divya regarding property inquiry - TEST",
        scheduledDate: new Date(Date.now() + 5000), // 5 seconds from now
        enquiryId: "test_enquiry_123",
        enquiry: {
          _id: "test_enquiry_123",
          clientName: "Divya Test Client",
          email: "divya@test.com",
          contactNumber: "9876543210",
          propertyLocation: "Test Location",
          status: "active"
        },
        targetScreen: 'EnquiryDetails',
        navigationType: 'nested',
        navigationData: {
          enquiryId: "test_enquiry_123",
          clientName: "Divya Test Client",
          reminderType: 'test_reminder',
          showDetails: true,
          scrollToEnquiry: true
        }
      };

      console.log('🧪 Scheduling test reminder notification...');
      
      // Import and schedule reminder
      import('./src/services/ReminderNotificationService')
        .then((ReminderNotificationService) => {
          return ReminderNotificationService.default.scheduleReminder(mockReminderData);
        })
        .then((result) => {
          console.log('✅ Test reminder scheduled:', result);
          console.log('⏰ Notification will appear in 5 seconds');
          console.log('📱 Tap the notification to test navigation');
          return result;
        })
        .catch((error) => {
          console.error('❌ Test reminder failed:', error);
        });
    } catch (error) {
      console.error('❌ Test setup failed:', error);
    }
  },

  // Test 2: Test immediate notification (for testing)
  testImmediateNotification: () => {
    try {
      console.log('🧪 Creating immediate test notification...');
      
      import('@notifee/react-native')
        .then((notifee) => {
          const notification = {
            id: `test_immediate_${Date.now()}`,
            title: '🧪 Test Notification',
            body: 'Tap to test navigation to Divya enquiry',
            data: {
              type: 'enquiry_reminder',
              targetScreen: 'EnquiryDetails',
              navigationType: 'nested',
              enquiryId: 'test_enquiry_123',
              clientName: 'Divya Test Client',
              navigationData: JSON.stringify({
                enquiryId: 'test_enquiry_123',
                clientName: 'Divya Test Client',
                showDetails: true,
                scrollToEnquiry: true,
                fromNotification: true
              })
            }
          };

          return notifee.default.displayNotification(notification);
        })
        .then(() => {
          console.log('✅ Immediate notification displayed');
          console.log('📱 Pull down notification panel and tap to test');
        })
        .catch((error) => {
          console.error('❌ Immediate notification failed:', error);
        });
    } catch (error) {
      console.error('❌ Immediate test failed:', error);
    }
  },

  // Test 3: Test navigation without notification (direct navigation test)
  testDirectNavigation: () => {
    try {
      console.log('🧪 Testing direct navigation...');
      
      import('./src/services/NavigationService')
        .then((NavigationService) => {
          const navData = {
            targetScreen: 'EnquiryDetails',
            navigationType: 'nested',
            enquiryId: 'test_enquiry_123',
            clientName: 'Divya Test Client',
            navigationData: {
              enquiryId: 'test_enquiry_123',
              clientName: 'Divya Test Client',
              showDetails: true,
              scrollToEnquiry: true,
              fromNotification: true
            }
          };

          return NavigationService.default.navigateFromNotification(navData);
        })
        .then((result) => {
          console.log(result ? '✅ Direct navigation successful' : '❌ Direct navigation failed');
        })
        .catch((error) => {
          console.error('❌ Direct navigation error:', error);
        });
    } catch (error) {
      console.error('❌ Direct navigation test failed:', error);
    }
  },

  // Test 4: Debug current navigation state
  debugNavigationState: () => {
    try {
      import('./src/services/NavigationService')
        .then((NavigationService) => {
          console.log('🔍 Navigation Debug Info:');
          console.log('  - Navigation Ready:', NavigationService.default.isReady());
          console.log('  - Current Route:', NavigationService.default.getCurrentRouteName());
          console.log('  - Navigation Ref:', !!NavigationService.navigationRef);
        })
        .catch((error) => {
          console.error('❌ Navigation debug failed:', error);
        });
    } catch (error) {
      console.error('❌ Debug failed:', error);
    }
  }
};

// Instructions
setTimeout(() => {
  console.log('');
  console.log('🧪 NOTIFICATION NAVIGATION TEST COMMANDS:');
  console.log('');
  console.log('1. Test scheduled notification (5 second delay):');
  console.log('   global.testNotificationNavigation.testReminderNotification()');
  console.log('');
  console.log('2. Test immediate notification:');
  console.log('   global.testNotificationNavigation.testImmediateNotification()');
  console.log('');
  console.log('3. Test direct navigation (no notification):');
  console.log('   global.testNotificationNavigation.testDirectNavigation()');
  console.log('');
  console.log('4. Debug navigation state:');
  console.log('   global.testNotificationNavigation.debugNavigationState()');
  console.log('');
  console.log('💡 Run these commands in the React Native debugger console');
  console.log('📱 Make sure you are on the CRM app (not main app) for testing');
}, 2000);

export default global.testNotificationNavigation;