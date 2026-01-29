# Complete FCM Notification System for Admin Reminders

## Problem
Admin notifications for employee reminders were not arriving because:
1. Frontend was using `setTimeout` (doesn't work when app is backgrounded)
2. Backend was not sending FCM push notifications to admin
3. FCM token was not being registered with backend

## Solution Overview
Now implementing **proper backend push notification system**:
1. ✅ **Frontend**: Admin's FCM token saved to backend on login
2. ⏳ **Backend**: Listen for new reminders and send FCM to admin
3. ✅ **Frontend**: Listen for FCM messages and show notifications even when app is backgrounded

---

## Frontend Changes (COMPLETED ✅)

### 1. AdminLogin.js - Save FCM Token on Login
```javascript
// After successful login:
const fcmToken = await getFCMToken();
if (fcmToken && (user?.id || user?._id)) {
  await fetch('https://abc.bhoomitechzone.us/api/admin/register-fcm-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      adminId: user.id || user._id,
      fcmToken: fcmToken,
      platform: Platform.OS,
      deviceName: 'AdminApp',
    }),
  });
}
```

### 2. EmployeeManagementScreen.js - Listen for FCM Notifications
```javascript
useEffect(() => {
  // Listen for foreground notifications (when app is open)
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title || 'सूचना';
    const body = remoteMessage.notification?.body || '';
    
    // Show alert when notification arrives
    Alert.alert(title, body);
  });
  
  return () => unsubscribeForeground();
}, []);
```

---

## Backend Implementation Required ⏳

### Step 1: Create Admin FCM Token Registration Endpoint

```javascript
// POST /api/admin/register-fcm-token
async (req, res) => {
  try {
    const { adminId, fcmToken, platform, deviceName } = req.body;
    
    // Find admin and update/create FCM token record
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { 
        fcmToken: fcmToken,
        fcmTokens: {
          [platform]: fcmToken
        },
        fcmTokenUpdatedAt: new Date()
      },
      { new: true }
    );
    
    console.log('✅ Admin FCM token registered:', { adminId, platform, token: fcmToken.substring(0, 20) + '...' });
    
    res.json({ 
      success: true, 
      message: 'FCM token registered successfully',
      admin 
    });
  } catch (error) {
    console.error('❌ Error registering FCM token:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### Step 2: Modify Reminder Creation to Send FCM to Admin

When employee creates a reminder, send FCM notification to admin:

```javascript
// In your reminder creation endpoint (e.g., POST /api/reminder/create)

async (req, res) => {
  try {
    // ... existing reminder creation code ...
    const reminder = await Reminder.create({
      title: req.body.title,
      employeeId: req.user.id,
      clientName: req.body.clientName,
      reminderDateTime: req.body.reminderDateTime,
      // ... other fields ...
    });
    
    // 🆕 Send FCM notification to admin
    const admin = await Admin.findOne(); // or get admin from your auth
    
    if (admin && admin.fcmToken) {
      console.log('📤 Sending FCM notification to admin...');
      
      await sendFCMNotification({
        token: admin.fcmToken,
        title: `🔔 New Reminder - ${req.user.name}`,
        body: `Reminder: ${reminder.title}\nClient: ${reminder.clientName}\n⏰ ${new Date(reminder.reminderDateTime).toLocaleString()}`,
        data: {
          type: 'reminder',
          reminderId: reminder._id,
          employeeId: reminder.employeeId,
          reminderTitle: reminder.title,
          clientName: reminder.clientName,
          scheduledTime: reminder.reminderDateTime,
        }
      });
      
      console.log('✅ FCM notification sent to admin');
    }
    
    res.json({ success: true, reminder });
  } catch (error) {
    console.error('❌ Error creating reminder:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### Step 3: Create FCM Notification Helper Function

```javascript
// utils/fcmNotification.js

const admin = require('firebase-admin');

/**
 * Send FCM notification to a single device
 */
export async function sendFCMNotification({ token, title, body, data = {} }) {
  try {
    if (!token) {
      console.warn('⚠️ No FCM token provided');
      return { success: false, error: 'No token' };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        sentAt: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
      webpush: {
        headers: {
          urgency: 'high',
        },
      },
    };

    const response = await admin.messaging().send(message, token);
    console.log('✅ FCM notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send FCM notification to multiple devices
 */
export async function sendFCMNotificationToMultiple({ tokens, title, body, data = {} }) {
  if (!tokens || tokens.length === 0) {
    console.warn('⚠️ No tokens provided');
    return { success: false, error: 'No tokens' };
  }

  try {
    const messages = tokens.map(token => ({
      notification: { title, body },
      data,
      token,
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    }));

    const response = await admin.messaging().sendAll(messages);
    console.log('✅ FCM notifications sent to', response.successCount, 'devices');
    return { success: true, successCount: response.successCount };
  } catch (error) {
    console.error('❌ Error sending FCM notifications:', error);
    return { success: false, error: error.message };
  }
}
```

### Step 4: Optional - Schedule Reminder Time Notifications

For notifications at reminder's scheduled time:

```javascript
// Using Bull Queue (recommended)
const queue = require('bull')('reminders');

// In reminder creation:
await queue.add(
  {
    reminderId: reminder._id,
    adminId: admin._id,
    title: reminder.title,
    clientName: reminder.clientName,
  },
  {
    delay: new Date(reminder.reminderDateTime) - new Date(),
  }
);

// Process scheduled reminders:
queue.process(async (job) => {
  const { reminderId, adminId, title, clientName } = job.data;
  const admin = await Admin.findById(adminId);
  
  if (admin?.fcmToken) {
    await sendFCMNotification({
      token: admin.fcmToken,
      title: `⏰ Reminder Time!`,
      body: `${title}\nClient: ${clientName}`,
      data: {
        type: 'reminder',
        reminderId,
        action: 'reminder_time',
      }
    });
  }
});
```

---

## Admin Notification Flow (Complete)

```
1. Employee creates reminder
   ↓
2. Backend receives reminder creation request
   ↓
3. Backend saves reminder to database
   ↓
4. Backend sends FCM notification to admin (NEW!)
   ├─ Get admin's FCM token from database
   ├─ Call Firebase Admin SDK to send notification
   └─ Notification is sent via Firebase Cloud Messaging
   ↓
5. Admin's device receives notification
   ├─ If app is open (foreground)
   │  └─ FCM listener in EmployeeManagementScreen.js handles it
   │     └─ Shows Alert.alert() popup
   │
   └─ If app is closed (background)
      └─ Firebase automatically shows notification in system tray
         └─ User taps notification → app opens
            └─ Notification event is handled by navigation config
```

---

## Testing Checklist

- [ ] Admin logs in → FCM token is sent to backend
- [ ] Check database → Admin has fcmToken field populated
- [ ] Employee creates reminder
- [ ] Admin receives notification (app open) → Alert popup shows
- [ ] Admin receives notification (app closed) → System notification appears
- [ ] Admin taps notification → App opens
- [ ] Console logs show: "✅ FCM notification sent to admin"

---

## Debugging

### Check if FCM token is registered:
```javascript
const token = await AsyncStorage.getItem('@fcm_token');
console.log('Admin FCM token:', token);
```

### Check if backend received token:
```
Query Admin in database:
db.admins.findOne({ _id: adminId })
Check if 'fcmToken' field is populated
```

### Check if Firebase credentials are valid:
```
In backend: firebase-admin logs should show successful initialization
If error: Check GOOGLE_APPLICATION_CREDENTIALS and service account JSON
```

### Manual FCM Test:
```javascript
// In backend admin controller
POST /api/test-send-notification
Body: {
  adminId: "admin_id",
  title: "Test",
  body: "Test message"
}

Response: Should show success and admin device should get notification
```

---

## Files to Update

1. ✅ `src/crm/crmscreens/CRM/AdminLogin.js` - FCM token registration
2. ✅ `src/crm/crmscreens/Admin/EmployeeManagementScreen.js` - FCM listener
3. ⏳ Backend: Reminder creation endpoint - Add FCM sending
4. ⏳ Backend: Create `/api/admin/register-fcm-token` endpoint
5. ⏳ Backend: Create FCM notification helper functions

---

## Key Points

✅ **Frontend is ready** - Will receive and display notifications
⏳ **Backend needs** - To send FCM notifications when reminders are created
⏳ **Firebase needs** - Credentials in backend environment

Once backend endpoints are created, notifications will work automatically! 🎉
