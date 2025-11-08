# Firebase Cloud Messaging (FCM) Setup Guide - Gharplot App

## ✅ Setup Completed

### 1. Dependencies Installed
- ✅ `@react-native-firebase/app` - Firebase core
- ✅ `@react-native-firebase/messaging` - FCM messaging

### 2. Android Configuration
- ✅ Added Google Services plugin in `android/build.gradle`
- ✅ Applied Google Services plugin in `android/app/build.gradle`
- ✅ Added Firebase BOM and messaging dependencies
- ✅ Updated `AndroidManifest.xml` with:
  - `POST_NOTIFICATIONS` permission (Android 13+)
  - `WAKE_LOCK` permission
  - Firebase metadata for default notification channel
  - Firebase auto-init enabled

### 3. Code Implementation
- ✅ Created `src/utils/fcmService.js` - Complete FCM utility service
- ✅ Updated `App.js` - Initialize FCM on app startup
- ✅ Updated `LoginScreen.js` - Send FCM token after email/password login
- ✅ Updated `OtpScreen.js` - Send FCM token after OTP verification
- ✅ Added `sendFCMTokenToBackend()` in `src/services/api.js`

---

## 📱 Building the App

### Clean Build (Recommended)
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Quick Build
```bash
npx react-native run-android
```

---

## 🧪 Testing FCM Notifications

### Step 1: Check FCM Token in Console
After app starts, check the Metro/React Native logs:
```
✅ FCM Token retrieved: eF7x...
💾 FCM Token saved to AsyncStorage
🚀 FCM Service initialized successfully
```

**Important**: Copy this FCM token - you'll need it to send test notifications!

### Step 2: Test Login/Signup Flow
1. **Signup Flow**:
   - Register a new user
   - After successful signup, login with credentials
   - Check logs for: `📤 Sending FCM token after login...`
   - Backend should receive: `userId`, `fcmToken`, `platform`

2. **Login Flow**:
   - Login with existing credentials
   - Check logs for: `📤 Sending FCM token to backend...`
   - Verify token sent successfully: `✅ FCM token sent to backend successfully`

3. **OTP Flow** (if using phone login):
   - Enter phone number and request OTP
   - Verify OTP
   - Check logs for: `📤 Sending FCM token after OTP verification...`

### Step 3: Send Test Notification from Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. Navigate to your project → **Cloud Messaging**
3. Click **"Send your first message"**

#### Option A: Test with Single Device Token
1. Choose **"Test message"**
2. Paste your FCM token (from console logs)
3. Write a notification:
   - **Title**: "Test from Firebase"
   - **Body**: "This is a test notification!"
4. Click **"Test"**

#### Option B: Test with Topic/Segment
1. Click **"Send notification"**
2. Fill in notification details:
   - **Title**: "Welcome to Gharplot"
   - **Body**: "Find your dream home today!"
3. Click **"Next"**
4. **Target**: Select "User segment" → "Android devices"
5. Click **"Next"** → **"Review"** → **"Publish"**

### Step 4: Test Different App States

#### A. Foreground Notification
1. Keep app open on screen
2. Send notification from Firebase Console
3. **Expected**: Alert popup appears with notification content
4. **Console Log**: `📩 Foreground notification received: {...}`

#### B. Background Notification
1. Press Home button (app in background)
2. Send notification from Firebase Console
3. **Expected**: System notification appears in status bar
4. Tap notification → app opens
5. **Console Log**: `🔔 Notification opened (background): {...}`

#### C. Quit State Notification
1. Swipe app away from recent apps (force close)
2. Send notification from Firebase Console
3. **Expected**: System notification appears
4. Tap notification → app launches
5. **Console Log**: `🔔 Notification opened (quit state): {...}`

---

## 🔧 Troubleshooting

### Issue: No FCM Token Generated
**Symptoms**: Console shows `⚠️ Cannot get FCM token: Permission not granted`

**Solutions**:
1. Check if `google-services.json` is in `android/app/` directory
2. Verify Firebase project configuration
3. Request notification permission manually:
   ```javascript
   import messaging from '@react-native-firebase/messaging';
   const authStatus = await messaging().requestPermission();
   console.log('Permission status:', authStatus);
   ```

### Issue: Gradle Build Fails
**Symptoms**: Build errors related to Google Services

**Solutions**:
1. Clean build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```
2. Verify `google-services.json` is valid JSON
3. Check Gradle plugin versions in `android/build.gradle`
4. Try rebuilding:
   ```bash
   npx react-native run-android
   ```

### Issue: Notifications Not Appearing
**Symptoms**: Token generated but no notifications shown

**Solutions**:
1. **Android 13+**: Check notification permission in Settings → Apps → Gharplot → Notifications
2. Verify notification channel exists
3. Check device Do Not Disturb settings
4. Test with different notification priority:
   ```javascript
   // In Firebase Console, set Priority to "High"
   ```

### Issue: Token Not Sent to Backend
**Symptoms**: Login successful but no backend request

**Solutions**:
1. Check backend endpoint: `/user/fcm-token`
2. Verify backend expects: `{ userId, fcmToken, platform }`
3. Check console for errors: `❌ Error sending FCM token to backend:`
4. Test backend manually:
   ```bash
   curl -X POST https://abc.ridealmobility.com/user/fcm-token \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "userId": "123",
       "fcmToken": "YOUR_FCM_TOKEN",
       "platform": "android"
     }'
   ```

---

## 📊 Backend Integration

### Expected API Endpoint
```
POST /user/fcm-token
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer USER_JWT_TOKEN"
}
```

### Request Body
```json
{
  "userId": "user123",
  "fcmToken": "eF7xK3...longToken...9zY2",
  "platform": "android"
}
```

### Expected Response
```json
{
  "success": true,
  "message": "FCM token saved successfully"
}
```

### Backend Implementation Example (Node.js/Express)
```javascript
// Backend endpoint to save FCM token
router.post('/user/fcm-token', authenticate, async (req, res) => {
  try {
    const { userId, fcmToken, platform } = req.body;
    
    // Save to database
    await db.users.update(
      { fcmToken, platform, lastUpdated: new Date() },
      { where: { id: userId } }
    );
    
    res.json({ success: true, message: 'FCM token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to save token' });
  }
});

// Example: Send notification to user
async function sendNotificationToUser(userId, title, body, data = {}) {
  const admin = require('firebase-admin');
  
  // Get user's FCM token from database
  const user = await db.users.findOne({ where: { id: userId } });
  
  if (!user.fcmToken) {
    throw new Error('User has no FCM token');
  }
  
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token: user.fcmToken,
  };
  
  const response = await admin.messaging().send(message);
  console.log('Notification sent:', response);
  return response;
}
```

---

## 🚀 Next Steps

### 1. Test Notification Types
- Property updates
- New messages
- Appointment reminders
- Booking confirmations

### 2. Add Custom Notification Handlers
Edit `src/utils/fcmService.js` to handle specific notification types:
```javascript
export const setupForegroundNotificationHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    const { title, body } = remoteMessage.notification || {};
    const { type, propertyId, chatId } = remoteMessage.data || {};
    
    // Custom handling based on notification type
    switch (type) {
      case 'property_update':
        // Navigate to property details
        break;
      case 'new_message':
        // Navigate to chat
        break;
      case 'appointment':
        // Navigate to appointments
        break;
      default:
        // Show generic alert
        Alert.alert(title, body);
    }
  });
};
```

### 3. Add Notification Icons
- Add custom notification icons in `android/app/src/main/res/drawable/`
- Update notification metadata in AndroidManifest.xml

### 4. Implement Topic Subscriptions
```javascript
import messaging from '@react-native-firebase/messaging';

// Subscribe to topics
await messaging().subscribeToTopic('all_users');
await messaging().subscribeToTopic('property_updates');

// Unsubscribe
await messaging().unsubscribeFromTopic('property_updates');
```

---

## 📝 Testing Checklist

- [ ] App builds successfully with Firebase dependencies
- [ ] FCM token generated and logged in console
- [ ] Token saved to AsyncStorage
- [ ] Token sent to backend after login
- [ ] Token sent to backend after signup → login
- [ ] Token sent to backend after OTP verification
- [ ] Foreground notification shows Alert
- [ ] Background notification appears in status bar
- [ ] Quit state notification appears and opens app
- [ ] Notification tap navigates correctly (if implemented)
- [ ] Token refresh handled properly

---

## 📚 Additional Resources

- [React Native Firebase Docs](https://rnfirebase.io/)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com)
- [Android Notification Channels](https://developer.android.com/training/notify-user/channels)

---

## 🎉 Success Indicators

You'll know FCM is working correctly when you see:

1. ✅ Console logs:
   ```
   🚀 Initializing FCM Service...
   ✅ Notification permission granted
   ✅ FCM Token retrieved: eF7x...
   💾 FCM Token saved to AsyncStorage
   ✅ FCM Service initialized successfully
   ```

2. ✅ After login:
   ```
   📤 Sending FCM token after login...
   ✅ FCM token sent to backend successfully
   ```

3. ✅ Test notification received:
   ```
   📩 Foreground notification received: {
     notification: { title: "Test", body: "Message" }
   }
   ```

---

**Happy Testing! 🚀**
