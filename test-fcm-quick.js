/**
 * Quick FCM Notification Test
 * 
 * Use this in console to quickly check if FCM is working
 * Just type: testFCM()
 */

console.log('');
console.log('🚀 FCM Quick Test Loaded!');
console.log('');
console.log('📝 Available Commands:');
console.log('  • testFCM() - Complete FCM test');
console.log('  • getFCMToken() - Get your FCM token');
console.log('  • testNotification() - Send test local notification');
console.log('');

// Simple FCM test
global.testFCM = async () => {
  try {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🧪 TESTING FCM NOTIFICATIONS');
    console.log('═══════════════════════════════════════');
    console.log('');

    const messaging = require('@react-native-firebase/messaging').default;
    
    // Step 1: Check permission
    console.log('1️⃣ Requesting permission...');
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (enabled) {
      console.log('   ✅ Permission: GRANTED');
    } else {
      console.log('   ❌ Permission: DENIED');
      console.log('');
      console.log('⚠️ Cannot proceed without permission!');
      return { success: false, reason: 'Permission denied' };
    }

    // Step 2: Get token
    console.log('');
    console.log('2️⃣ Getting FCM token...');
    const token = await messaging().getToken();
    
    if (token) {
      console.log('   ✅ Token received!');
      console.log('   📋 Token:', token.substring(0, 40) + '...');
      console.log('');
      console.log('   💡 Copy full token with: global.copyFCMToken()');
      
      global.copyFCMToken = () => {
        console.log('');
        console.log('📋 FULL FCM TOKEN:');
        console.log(token);
        console.log('');
        return token;
      };
    } else {
      console.log('   ❌ No token received');
      console.log('');
      return { success: false, reason: 'No token' };
    }

    // Step 3: Setup listener
    console.log('');
    console.log('3️⃣ Setting up notification listener...');
    const unsubscribe = messaging().onMessage((remoteMessage) => {
      console.log('');
      console.log('📩 ✅ NOTIFICATION RECEIVED!');
      console.log('   Title:', remoteMessage.notification?.title);
      console.log('   Body:', remoteMessage.notification?.body);
      console.log('   Data:', remoteMessage.data);
      console.log('');
    });
    
    console.log('   ✅ Listener active!');

    // Step 4: Result
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ FCM IS WORKING!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📱 Your app can now receive FCM notifications!');
    console.log('');
    console.log('🧪 Test it:');
    console.log('   1. Go to Firebase Console');
    console.log('   2. Cloud Messaging → Send test message');
    console.log('   3. Use your FCM token');
    console.log('   4. Send notification');
    console.log('');
    console.log('💡 Or use: testNotification()');
    console.log('');

    return {
      success: true,
      token,
      permission: 'granted',
      listener: 'active'
    };

  } catch (error) {
    console.log('');
    console.log('❌ FCM TEST FAILED!');
    console.log('   Error:', error.message);
    console.log('');
    return { success: false, error: error.message };
  }
};

// Get FCM Token only
global.getFCMToken = async () => {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    const token = await messaging().getToken();
    
    console.log('');
    console.log('📋 FCM TOKEN:');
    console.log(token);
    console.log('');
    
    return token;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
};

// Test local notification using notifee
global.testNotification = async () => {
  try {
    console.log('');
    console.log('🔔 Sending test notification...');
    
    const notifee = require('@notifee/react-native').default;
    
    // Create channel
    const channelId = await notifee.createChannel({
      id: 'test',
      name: 'Test Notifications',
      importance: 4,
    });

    // Display notification
    await notifee.displayNotification({
      title: '🧪 Test Notification',
      body: 'FCM is working! Aapka notification aa gaya! 🎉',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });

    console.log('   ✅ Test notification sent!');
    console.log('   📱 Check your notification tray');
    console.log('');
    
    return { success: true };
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('');
    return { success: false, error: error.message };
  }
};

export default { testFCM };
