# Backend Notification API - cURL Commands

⚠️ **CRITICAL:** For kill mode notifications, backend MUST send **data-only** payload with **high priority**!

## Issues with Kill Mode (App Fully Closed)?

### Root Cause:
- Backend is sending `notification` + `data` payload
- This prevents `setBackgroundMessageHandler` from working
- Kill mode requires **data-only** format

### ✅ Solution:
1. Remove `notification` object from FCM payload
2. Put title/body inside `data` object
3. Set `priority: "high"` for Android
4. Set `apns-priority: "10"` for iOS

---

## 1. Schedule Reminder Notification

```bash
curl -X POST "https://abc.bhoomitechzone.us/api/reminder/schedule-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "reminderId": "12345",
    "clientName": "John Doe",
    "message": "Follow up on property inquiry",
    "scheduledDateTime": "2026-01-10T10:00:00.000Z",
    "enquiryId": "enq_67890",
    "notificationType": "reminder"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder scheduled successfully",
  "reminderId": "12345"
}
```

---

## 2. Schedule Alert Notification

```bash
curl -X POST "https://abc.bhoomitechzone.us/api/alert/schedule-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "alertId": "alert_123",
    "reason": "Important meeting",
    "date": "2026-01-10",
    "time": "10:00",
    "scheduledDateTime": "2026-01-10T10:00:00.000Z",
    "repeatDaily": false,
    "notificationType": "alert",
    "fcmToken": "USER_FCM_TOKEN_HERE"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Alert scheduled successfully",
  "alertId": "alert_123"
}
```

⚠️ **NOTE:** App now sends FCM token with every schedule request. Backend should store this token for the user and use it to send notifications.

---

## 3. Update Reminder (Reschedule)

```bash
curl -X PUT "https://abc.bhoomitechzone.us/api/reminder/update/12345" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "title": "New title",
    "comment": "Updated comment",
    "reminderDateTime": "2026-01-10T10:00:00.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder updated successfully"
}
```

**⚠️ IMPORTANT:** Backend must automatically reschedule FCM notification when this endpoint is called!

---

## 4. Update Alert (Reschedule)

```bash
curl -X PUT "https://abc.bhoomitechzone.us/api/alerts/update/alert_123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "reason": "Updated reason",
    "date": "2026-01-10",
    "time": "10:00",
    "repeatDaily": false
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Alert updated successfully"
}
```

**⚠️ IMPORTANT:** Backend must automatically reschedule FCM notification when this endpoint is called!

---

## 5. Cancel Reminder Notification

```bash
curl -X DELETE "https://abc.bhoomitechzone.us/api/reminder/cancel/12345" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder cancelled successfully"
}
```

---

## 6. Cancel Alert Notification

```bash
curl -X DELETE "https://abc.bhoomitechzone.us/api/alert/cancel/alert_123" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Alert cancelled successfully"
}
```

---

## Testing with Postman

### Import these as collection:

**Base URL:** `https://abc.bhoomitechzone.us`

**Headers (for all requests):**
```
Content-Type: application/json
Authorization: Bearer YOUR_AUTH_TOKEN
```

**Replace `YOUR_AUTH_TOKEN` with actual token from login response.**

---

## Backend Implementation Notes

### 1. Schedule Notification Flow:
```
Client calls POST /api/reminder/schedule-notification
↓
Backend saves schedule in database
↓
Backend sets up cron job / scheduled task
↓
At scheduledDateTime, backend sends FCM notification
↓
FCM notification data must include: { type: 'reminder', reminderId, clientName, message, enquiryId }
```

### 2. Update Notification Flow:
```
Client calls PUT /api/reminder/update/{id}
↓
Backend updates reminder in database
↓
Backend cancels old scheduled FCM notification
↓
Backend schedules new FCM notification with updated time
↓
Return success response
```

### 3. Cancel Notification Flow:
```
Client calls DELETE /api/reminder/cancel/{id}
↓
Backend cancels scheduled FCM notification
↓
Backend marks reminder as cancelled in database
↓
Return success response
```

---

## FCM Notification Payload (Backend must send this)

⚠️ **CRITICAL FOR KILL MODE:** Use **data-only** payload with **high priority**!

### For Reminders (CORRECT FORMAT):
```json
{
  "data": {
    "type": "reminder",
    "reminderId": "12345",
    "clientName": "John Doe",
    "message": "Follow up on property inquiry",
    "enquiryId": "enq_67890",
    "date": "2026-01-10",
    "time": "10:00",
    "title": "📌 John Doe",
    "body": "Follow up on property inquiry",
    "notificationType": "reminder"
  },
  "android": {
    "priority": "high",
    "ttl": "86400s"
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "contentAvailable": true,
        "sound": "default"
      }
    }
  }
}
```

### For Alerts (CORRECT FORMAT):
```json
{
  "data": {
    "type": "alert",
    "alertId": "alert_123",
    "reason": "Important meeting",
    "date": "2026-01-10",
    "time": "10:00",
    "repeatDaily": "false",
    "title": "🔔 Alert Notification",
    "body": "Important meeting",
    "notificationType": "alert"
  },
  "android": {
    "priority": "high",
    "ttl": "86400s"
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "contentAvailable": true,
        "sound": "default"
      }
    }
  }
}
```

### ❌ WRONG Format (Will NOT work in kill mode):
```json
{
  "notification": {
    "title": "Title",
    "body": "Body"
  },
  "data": { ... }
}
```

### ✅ WHY Data-Only Format?
1. **Kill Mode Support:** Background handler (`setBackgroundMessageHandler`) only works with data-only
2. **Custom Handling:** App creates notification display, not FCM
3. **Navigation:** App can handle tap navigation properly
4. **Android Battery Optimization:** High priority ensures delivery

---

## Backend Implementation Code (Node.js + Firebase Admin)

### 1. Send FCM Notification Function:
```javascript
const admin = require('firebase-admin');

async function sendFCMNotification(fcmToken, notificationData) {
  try {
    const message = {
      token: fcmToken,
      data: {
        type: notificationData.type,
        reminderId: notificationData.reminderId || '',
        alertId: notificationData.alertId || '',
        clientName: notificationData.clientName || '',
        message: notificationData.message || '',
        reason: notificationData.reason || '',
        enquiryId: notificationData.enquiryId || '',
        date: notificationData.date || '',
        time: notificationData.time || '',
        title: notificationData.title || '',
        body: notificationData.body || '',
        repeatDaily: notificationData.repeatDaily?.toString() || 'false',
        notificationType: notificationData.type
      },
      android: {
        priority: 'high',
        ttl: 86400 * 1000, // 24 hours
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default'
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ FCM sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send error:', error);
    throw error;
  }
}
```

### 2. Schedule Reminder Endpoint:
```javascript
router.post('/api/reminder/schedule-notification', async (req, res) => {
  try {
    const { reminderId, clientName, message, scheduledDateTime, enquiryId } = req.body;
    
    // Get user's FCM token from database
    const fcmToken = await getUserFCMToken(req.user.id);
    
    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'FCM token not found' 
      });
    }
    
    // Save to database
    await saveScheduledReminder({
      reminderId,
      userId: req.user.id,
      clientName,
      message,
      scheduledDateTime,
      enquiryId,
      fcmToken
    });
    
    // Schedule FCM notification (use cron job or scheduler)
    await scheduleNotificationJob(scheduledDateTime, async () => {
      await sendFCMNotification(fcmToken, {
        type: 'reminder',
        reminderId,
        clientName,
        message,
        enquiryId,
        date: new Date(scheduledDateTime).toISOString().split('T')[0],
        time: new Date(scheduledDateTime).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        title: `📌 ${clientName}`,
        body: message
      });
    });
    
    res.json({ 
      success: true, 
      message: 'Reminder scheduled successfully',
      reminderId 
    });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

### 3. Test Immediate Send (for testing):
```javascript
router.post('/api/test/send-fcm', async (req, res) => {
  try {
    const fcmToken = await getUserFCMToken(req.user.id);
    
    await sendFCMNotification(fcmToken, {
      type: 'reminder',
      reminderId: 'test_123',
      clientName: 'Test Client',
      message: 'This is a test notification',
      enquiryId: 'test_enq',
      date: '2026-01-10',
      time: '10:00 AM',
      title: '📌 Test Client',
      body: 'This is a test notification'
    });
    
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## Quick Test Commands (Copy-Paste Ready)

### Test Reminder Schedule:
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/reminder/schedule-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"reminderId":"test_001","clientName":"Test Client","message":"Test reminder","scheduledDateTime":"2026-01-10T15:00:00.000Z","enquiryId":"enq_001","notificationType":"reminder"}'
```

### Test Alert Schedule:
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/alert/schedule-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"alertId":"test_alert_001","reason":"Test alert","date":"2026-01-10","time":"15:00","scheduledDateTime":"2026-01-10T15:00:00.000Z","repeatDaily":false,"notificationType":"alert"}'
```

### Test Reminder Cancel:
```bash
curl -X DELETE "https://abc.bhoomitechzone.us/api/reminder/cancel/test_001" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Alert Cancel:
```bash
curl -X DELETE "https://abc.bhoomitechzone.us/api/alert/cancel/test_alert_001" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Generated:** January 9, 2026
**Base URL:** https://abc.bhoomitechzone.us
**Status:** ⚠️ Endpoints need to be implemented by backend team
