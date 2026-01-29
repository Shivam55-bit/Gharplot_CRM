# Admin Reminder Notifications - Complete Implementation

## ✅ DONE (Frontend)

### 1. FCM Token Registration on Admin Login
- **File**: `src/crm/crmscreens/CRM/AdminLogin.js`
- **What**: When admin logs in, the app:
  1. Gets FCM token from device
  2. Sends it to backend endpoint: `POST /api/admin/register-fcm-token`
  3. Backend stores admin's FCM token in database
  
- **Code**: 
  ```javascript
  const fcmToken = await getFCMToken();
  // Send to backend to store
  await fetch('https://abc.bhoomitechzone.us/api/admin/register-fcm-token', {
    method: 'POST',
    body: JSON.stringify({ adminId, fcmToken, platform }),
  });
  ```

### 2. FCM Notification Listener in Admin App
- **File**: `src/crm/crmscreens/Admin/EmployeeManagementScreen.js`
- **What**: When notification arrives (app open or backgrounded):
  1. Foreground: Shows Alert popup
  2. Background: System notification (handled by Firebase)
  3. Tapped: App opens and data is available
  
- **Code**:
  ```javascript
  messaging().onMessage(async (remoteMessage) => {
    // Show notification when app is open
    Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
  });
  ```

### 3. Polling System for Modal View
- **File**: `src/crm/crmscreens/Admin/EmployeeManagementScreen.js`
- **What**: When admin opens employee reminders modal:
  1. Polls every 2 seconds for new reminders
  2. Shows immediate notification when count increases
  3. Stops polling when modal closes
  
---

## ⏳ TODO (Backend)

### Required Backend Endpoints

#### 1. Register Admin FCM Token
```
POST /api/admin/register-fcm-token
Headers: Authorization: Bearer {token}
Body: {
  adminId: "admin_id",
  fcmToken: "device_token_from_firebase",
  platform: "android" or "ios"
}

Response: { success: true }
Database: Save to Admin.fcmToken field
```

#### 2. Send FCM on Reminder Creation
```
When: Employee creates reminder via POST /api/reminder/create
Then: Send FCM notification to admin

Logic:
1. Get reminder details (title, client, time)
2. Find admin's FCM token from database
3. Call Firebase Admin SDK to send notification
4. Include reminder data in notification payload

Notification:
{
  title: "🔔 New Reminder - Employee Name",
  body: "Reminder: [title]\nClient: [client]\n⏰ [datetime]",
  data: {
    type: "reminder",
    reminderId: "...",
    employeeId: "...",
    reminderTitle: "...",
    clientName: "..."
  }
}
```

#### 3. FCM Helper Function
```javascript
async function sendFCMNotification({ token, title, body, data }) {
  // Use Firebase Admin SDK
  // admin.messaging().send(message)
  // Returns messageId on success
}
```

---

## 🎯 Notification Flow

```
IMMEDIATE (When Reminder Created)
─────────────────────────────────
Employee: Creates reminder
          ↓
Backend:  Saves reminder + sends FCM to admin
          ↓
Admin App: Receives notification
           ├─ If open: Shows Alert popup via FCM listener
           └─ If closed: Shows system notification (Firebase handles)


SCHEDULED (At Reminder Time) - Optional
────────────────────────────────────────
Reminder DateTime Reaches
          ↓
Backend:  (Optional) Send another FCM notification
          ↓
Admin App: Receives scheduled notification
```

---

## 📱 What Admin Sees

### When Reminder Created (Immediate)
```
Device shows:
┌─────────────────────────────┐
│ 🔔 New Reminder - John      │
│ Reminder: Follow up call    │
│ Client: Mr. Sharma          │
│ ⏰ 24/01/2026, 18:03:00     │
│                             │
│       [OK]  [Cancel]        │
└─────────────────────────────┘
```

### When App is in Background
```
System notification appears in notification tray
Admin taps → App opens with reminder data
```

---

## 🔧 Implementation Checklist for Backend

- [ ] Create `/api/admin/register-fcm-token` endpoint
  - Save `fcmToken` to Admin document in database
  - Log success in console

- [ ] Modify reminder creation endpoint
  - After saving reminder: Get admin's FCM token
  - Call FCM send function
  - Log "✅ Notification sent to admin"

- [ ] Create FCM helper function
  - Use Firebase Admin SDK
  - Handle errors gracefully
  - Return success/failure

- [ ] Test Flow:
  1. Admin logs in (check console for "FCM token registered...")
  2. Employee creates reminder
  3. Admin device receives notification
  4. Check console for "✅ Notification sent to admin"

---

## 📋 Testing Script for Backend

```javascript
// Test endpoint in Postman or API client

// 1. Register FCM token
POST /api/admin/register-fcm-token
Authorization: Bearer {admin_token}
{
  "adminId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "fcmToken": "device_token_from_app",
  "platform": "android"
}

Expected: { success: true, message: "FCM token registered" }

// 2. Create reminder
POST /api/reminder/create
Authorization: Bearer {employee_token}
{
  "title": "Test Reminder",
  "clientName": "Test Client",
  "reminderDateTime": "2026-01-24T18:00:00Z",
  "notes": "Test"
}

Expected: 
- Reminder created
- Admin receives FCM notification
- Console shows "✅ Notification sent to admin"
```

---

## 🐛 Debugging

### Check if FCM token is saved:
```bash
# In MongoDB:
db.admins.findOne({ _id: ObjectId("...") })
# Should show: { fcmToken: "device_token_..." }
```

### Check Firebase credentials:
```bash
# Backend should have:
# - GOOGLE_APPLICATION_CREDENTIALS environment variable
# - Valid Firebase service account JSON
# - firebase-admin imported and initialized
```

### Check notification sending:
```bash
# Backend console should show:
# ✅ FCM notification sent: message_id_123
# If error: Check token validity and Firebase quota
```

---

## 🎉 Expected End Result

1. ✅ Admin logs in → FCM token saved to backend
2. ✅ Employee creates reminder → Backend sends FCM instantly
3. ✅ Admin sees notification (app open or closed)
4. ✅ Admin taps notification → Relevant data available
5. ✅ No more setTimeout, no need for polling when app closed
6. ✅ Works even if app is backgrounded or closed

**Status**: Frontend 100% ready, Backend implementation pending ⏳
