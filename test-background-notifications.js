/**
 * TEST BACKGROUND NOTIFICATIONS
 * Quick test to verify notifications work when app is closed/background
 */

import ReminderNotificationService from './src/services/ReminderNotificationService';
import AlertNotificationService from './src/services/AlertNotificationService';

// ============================================
// TEST: Background Notification (2 minutes)
// ============================================
export async function testBackgroundNotification() {
  console.log('🧪 Testing Background Notification\n');
  
  try {
    // Initialize service
    await ReminderNotificationService.initialize();
    
    // Create reminder for 2 minutes from now
    const scheduledDate = new Date(Date.now() + 2 * 60 * 1000);
    
    const reminderData = {
      id: `bg_test_${Date.now()}`,
      clientName: 'Background Test',
      message: 'This notification should appear even if app is closed!',
      scheduledDate: scheduledDate,
      enquiryId: 'test_enquiry_bg',
    };

    const result = await ReminderNotificationService.scheduleReminder(reminderData);
    
    if (result.success) {
      console.log('✅ Background notification scheduled successfully!');
      console.log('📅 Scheduled for:', result.scheduledFor);
      console.log('\n📋 TEST INSTRUCTIONS:');
      console.log('1. Wait 5 seconds');
      console.log('2. Close the app completely (swipe from recent apps)');
      console.log('3. Wait for 2 minutes');
      console.log('4. Notification should appear even though app is closed');
      console.log('5. Click notification to verify app opens\n');
      
      // Auto-close app after 5 seconds for testing
      setTimeout(() => {
        console.log('⏰ 5 seconds elapsed - Close the app NOW for testing!');
      }, 5000);
      
      return result;
    } else {
      console.log('❌ Failed to schedule:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Test Error:', error);
    return null;
  }
}

// ============================================
// TEST: Killed State Notification (1 minute)
// ============================================
export async function testKilledStateNotification() {
  console.log('🧪 Testing Killed State Notification\n');
  
  try {
    await AlertNotificationService.initialize();
    
    const scheduledDate = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
    
    const year = scheduledDate.getFullYear();
    const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0');
    const day = scheduledDate.getDate().toString().padStart(2, '0');
    const hours = scheduledDate.getHours().toString().padStart(2, '0');
    const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');

    const alertData = {
      id: `killed_test_${Date.now()}`,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      reason: 'Testing notification in killed state - should work!',
      repeatDaily: false,
    };

    const result = await AlertNotificationService.scheduleAlert(alertData);
    
    if (result.success) {
      console.log('✅ Killed state notification scheduled!');
      console.log('📅 Scheduled for:', result.scheduledFor);
      console.log('\n📋 TEST INSTRUCTIONS:');
      console.log('1. Kill the app IMMEDIATELY (swipe from recent apps)');
      console.log('2. Wait for 1 minute');
      console.log('3. Notification should appear');
      console.log('4. Click Edit button to verify app launches\n');
      
      return result;
    } else {
      console.log('❌ Failed to schedule:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Test Error:', error);
    return null;
  }
}

// ============================================
// DIAGNOSTIC: Check Background Setup
// ============================================
export async function checkBackgroundSetup() {
  console.log('🔍 Checking Background Notification Setup\n');
  
  try {
    const notifee = require('@notifee/react-native').default;
    
    // 1. Check if exact alarm permission granted
    let canScheduleExact = false;
    if (typeof notifee.canScheduleExactAlarms === 'function') {
      canScheduleExact = await notifee.canScheduleExactAlarms();
      console.log(`${canScheduleExact ? '✅' : '❌'} Exact Alarm Permission: ${canScheduleExact ? 'GRANTED' : 'DENIED'}`);
    } else {
      console.log('⚠️ canScheduleExactAlarms not available');
    }
    
    // 2. Check notification settings
    const settings = await notifee.getNotificationSettings();
    console.log(`${settings.authorizationStatus === 1 ? '✅' : '❌'} Notification Permission: ${settings.authorizationStatus === 1 ? 'GRANTED' : 'DENIED'}`);
    
    // 3. Check channels
    const channels = await notifee.getChannels();
    console.log(`✅ Notification Channels: ${channels.length} created`);
    
    // 4. Check pending notifications
    const triggerNotifications = await notifee.getTriggerNotifications();
    console.log(`📋 Pending Scheduled Notifications: ${triggerNotifications.length}`);
    
    if (triggerNotifications.length > 0) {
      console.log('\n📅 Scheduled Notifications:');
      triggerNotifications.forEach((item, index) => {
        const scheduledTime = new Date(item.trigger.timestamp);
        console.log(`  ${index + 1}. ${item.notification.title}`);
        console.log(`     Scheduled: ${scheduledTime.toLocaleString()}`);
      });
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('━'.repeat(50));
    
    if (canScheduleExact && settings.authorizationStatus === 1) {
      console.log('✅ Background notifications should work!');
      console.log('✅ All permissions granted');
      console.log('✅ Ready to test');
    } else {
      console.log('⚠️ Some permissions missing:');
      if (!canScheduleExact) {
        console.log('   - Need to grant "Alarms & reminders" permission');
        console.log('   - Go to: Settings > Apps > GharPlot > Alarms & reminders');
      }
      if (settings.authorizationStatus !== 1) {
        console.log('   - Need to grant notification permission');
      }
    }
    
    return {
      canScheduleExact,
      notificationPermission: settings.authorizationStatus === 1,
      channelCount: channels.length,
      pendingCount: triggerNotifications.length,
    };
  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
    return null;
  }
}

// ============================================
// COMPLETE TEST SUITE
// ============================================
export async function runBackgroundTests() {
  console.log('🚀 BACKGROUND NOTIFICATION TEST SUITE');
  console.log('='.repeat(50));
  console.log('');
  
  // Step 1: Check setup
  console.log('STEP 1: Checking Setup...');
  const setup = await checkBackgroundSetup();
  console.log('');
  
  if (!setup || !setup.canScheduleExact || !setup.notificationPermission) {
    console.log('❌ Cannot proceed - permissions not granted');
    console.log('Please grant all permissions first!');
    return;
  }
  
  // Step 2: Test background notification
  console.log('STEP 2: Scheduling Background Test (2 min)...');
  await testBackgroundNotification();
  console.log('');
  
  // Wait 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Step 3: Test killed state
  console.log('STEP 3: Scheduling Killed State Test (1 min)...');
  await testKilledStateNotification();
  console.log('');
  
  console.log('='.repeat(50));
  console.log('✅ All tests scheduled successfully!');
  console.log('📱 Now test by closing/killing the app');
  console.log('');
}

// ============================================
// USAGE
// ============================================
/*
// In App.js or any screen:
import { runBackgroundTests, checkBackgroundSetup } from './test-background-notifications';

// Add test button:
<Button 
  title="Test Background Notifications" 
  onPress={runBackgroundTests} 
/>

// Or check setup only:
<Button 
  title="Check Setup" 
  onPress={checkBackgroundSetup} 
/>
*/

export default {
  testBackgroundNotification,
  testKilledStateNotification,
  checkBackgroundSetup,
  runBackgroundTests,
};
