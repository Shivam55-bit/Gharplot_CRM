# Backend Requirements for FCM Notifications

**Date:** January 9, 2026  
**Priority:** HIGH - Critical for app functionality  
**Status:** ⚠️ MUST IMPLEMENT

---

## Overview

Mobile app ab FCM (Firebase Cloud Messaging) use kar raha hai notifications ke liye. Backend ko scheduled notifications bhejne ki zarurat hai.

### Key Points:
- ✅ App FCM token bhejta hai har request ke saath
- ✅ App data-only notification format expect karta hai
- ✅ Kill mode support ke liye high priority required hai
- ✅ Backend ko cron job/scheduler setup karna hai

---

## 1. FCM Token Registration

### Endpoint (Already Exists - Verify Working)
```
POST /api/fcm/register
```

### Request:
```json
{
  "userId": "user123",
  "fcmToken": "fX8...",
  "deviceType": "android"
}
```

### Response:
```json
{
  "success": true,
  "message": "Token registered"
}
```

### Backend Action:
- FCM token ko database me store karo user ke liye
- Old token replace karo if exists
- Multiple devices support karo (optional)

---

## 2. Alert Schedule Notification ⚠️ MUST IMPLEMENT

### Endpoint:
```
POST /api/alert/schedule-notification
```

### Headers:
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

### Request Body:
```json
{
  "alertId": "alert_123",
  "reason": "Important meeting",
  "date": "2026-01-10",
  "time": "15:00",
  "scheduledDateTime": "2026-01-10T15:00:00.000Z",
  "repeatDaily": false,
  "notificationType": "alert",
  "fcmToken": "fX8yZ..."
}
```

### Response:
```json
{
  "success": true,
  "message": "Alert scheduled successfully",
  "alertId": "alert_123",
  "scheduledFor": "2026-01-10T15:00:00.000Z"
}
```

### Backend Implementation Required:

#### 1. Store Alert Schedule:
```javascript
{
  alertId: "alert_123",
  userId: "user123",
  fcmToken: "fX8yZ...",
  scheduledDateTime: "2026-01-10T15:00:00.000Z",
  reason: "Important meeting",
  date: "2026-01-10",
  time: "15:00",
  repeatDaily: false,
  status: "scheduled" // scheduled, sent, cancelled
}
```

#### 2. Setup Cron Job/Scheduler:
- Use: `node-schedule`, `bull` queue, or similar
- At scheduled time, send FCM notification
- Mark as "sent" in database

#### 3. Send FCM Notification (Data-Only Format):
```javascript
const message = {
  token: fcmToken, // User's FCM token
  data: {
    type: "alert",
    alertId: "alert_123",
    reason: "Important meeting",
    date: "2026-01-10",
    time: "15:00",
    repeatDaily: "false",
    title: "🔔 Alert Notification",
    body: "Important meeting",
    notificationType: "alert"
  },
  android: {
    priority: "high",
    ttl: "86400s" // 24 hours
  },
  apns: {
    headers: {
      "apns-priority": "10"
    },
    payload: {
      aps: {
        contentAvailable: true,
        sound: "default"
      }
    }
  }
};

await admin.messaging().send(message);
```

⚠️ **CRITICAL:** 
- NO `notification` object (only `data` object)
- `priority: "high"` required for kill mode
- All values in `data` must be strings

---

## 3. Reminder Schedule Notification ⚠️ MUST IMPLEMENT

### Endpoint:
```
POST /api/reminder/schedule-notification
```

### Request Body:
```json
{
  "reminderId": "12345",
  "clientName": "John Doe",
  "message": "Follow up call",
  "scheduledDateTime": "2026-01-10T10:00:00.000Z",
  "enquiryId": "enq_123",
  "notificationType": "reminder",
  "fcmToken": "fX8yZ..."
}
```

### Response:
```json
{
  "success": true,
  "message": "Reminder scheduled successfully",
  "reminderId": "12345"
}
```

### FCM Payload for Reminder:
```javascript
{
  token: fcmToken,
  data: {
    type: "reminder",
    reminderId: "12345",
    clientName: "John Doe",
    message: "Follow up call",
    enquiryId: "enq_123",
    date: "2026-01-10",
    time: "10:00",
    title: "📌 John Doe",
    body: "Follow up call",
    notificationType: "reminder"
  },
  android: {
    priority: "high",
    ttl: "86400s"
  },
  apns: {
    headers: { "apns-priority": "10" },
    payload: { aps: { contentAvailable: true, sound: "default" } }
  }
}
```

---

## 4. Update Alert (Auto-Reschedule) ⚠️ CRITICAL

### Existing Endpoint:
```
PUT /api/alerts/update/:alertId
```

### Request Body:
```json
{
  "reason": "Updated meeting time",
  "date": "2026-01-11",
  "time": "16:00",
  "repeatDaily": false
}
```

### Backend Action Required:
1. ✅ Update alert in database
2. ✅ **Cancel old scheduled FCM job**
3. ✅ **Schedule new FCM job** with updated time
4. ✅ Return success response

```javascript
// Pseudo code
async function updateAlert(alertId, data) {
  // 1. Update in DB
  await db.alerts.update(alertId, data);
  
  // 2. Cancel old scheduled job
  if (scheduledJobs[alertId]) {
    scheduledJobs[alertId].cancel();
  }
  
  // 3. Get user's FCM token
  const alert = await db.alerts.findById(alertId);
  const fcmToken = await db.users.getFCMToken(alert.userId);
  
  // 4. Schedule new FCM job
  const scheduledDate = new Date(`${data.date}T${data.time}:00.000Z`);
  scheduledJobs[alertId] = schedule.scheduleJob(scheduledDate, async () => {
    await sendFCMNotification(fcmToken, {
      type: 'alert',
      alertId,
      ...data
    });
  });
  
  return { success: true };
}
```

---

## 5. Update Reminder (Auto-Reschedule) ⚠️ CRITICAL

### Existing Endpoint:
```
PUT /api/reminder/update/:reminderId
```

### Request Body:
```json
{
  "title": "New title",
  "comment": "Updated comment",
  "reminderDateTime": "2026-01-10T10:00:00.000Z"
}
```

### Backend Action Required:
Same as alert update - cancel old job, schedule new job

---

## 6. Cancel Notifications (Optional but Recommended)

### Cancel Alert:
```
DELETE /api/alert/cancel/:alertId
```

### Cancel Reminder:
```
DELETE /api/reminder/cancel/:reminderId
```

### Backend Action:
1. Cancel scheduled FCM job
2. Update status in database to "cancelled"
3. Return success

---

## 7. Repeat Daily Alerts

For `repeatDaily: true` alerts:

### Option A: Cron Job (Recommended)
```javascript
// Run every minute, check if any daily alerts need to be sent
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentTime = `${now.getHours()}:${now.getMinutes()}`;
  
  // Find all daily alerts for this time
  const alerts = await db.alerts.find({
    repeatDaily: true,
    time: currentTime,
    status: 'active'
  });
  
  // Send FCM for each
  for (const alert of alerts) {
    await sendFCMNotification(alert.fcmToken, alertData);
  }
});
```

### Option B: Reschedule After Send
After sending notification, automatically schedule for next day

---

## 8. Required Dependencies

### Node.js:
```bash
npm install firebase-admin
npm install node-schedule  # or bull, agenda
```

### Firebase Admin Setup:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

---

## 9. Database Schema Suggestions

### alerts_schedule table:
```sql
CREATE TABLE alerts_schedule (
  id VARCHAR PRIMARY KEY,
  alert_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  fcm_token VARCHAR NOT NULL,
  scheduled_datetime TIMESTAMP NOT NULL,
  reason TEXT,
  date DATE,
  time TIME,
  repeat_daily BOOLEAN DEFAULT FALSE,
  status VARCHAR DEFAULT 'scheduled', -- scheduled, sent, cancelled, failed
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP NULL
);

CREATE INDEX idx_scheduled_datetime ON alerts_schedule(scheduled_datetime);
CREATE INDEX idx_status ON alerts_schedule(status);
```

### reminders_schedule table:
```sql
CREATE TABLE reminders_schedule (
  id VARCHAR PRIMARY KEY,
  reminder_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  fcm_token VARCHAR NOT NULL,
  scheduled_datetime TIMESTAMP NOT NULL,
  client_name VARCHAR,
  message TEXT,
  enquiry_id VARCHAR,
  status VARCHAR DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP NULL
);
```

---

## 10. Testing Endpoints

### Test Alert Schedule (1 minute from now):
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/alert/schedule-notification" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": "test_alert_001",
    "reason": "Test alert - 1 minute",
    "date": "2026-01-09",
    "time": "15:30",
    "scheduledDateTime": "2026-01-09T15:30:00.000Z",
    "repeatDaily": false,
    "notificationType": "alert",
    "fcmToken": "USER_FCM_TOKEN_HERE"
  }'
```

### Test Direct FCM Send (Immediate):
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/test/send-fcm-now" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "USER_FCM_TOKEN_HERE",
    "alertId": "test_immediate",
    "reason": "Immediate test notification"
  }'
```

---

## 11. Error Handling

### Common Errors:

1. **Invalid FCM Token:**
```javascript
// Handle invalid token
try {
  await admin.messaging().send(message);
} catch (error) {
  if (error.code === 'messaging/invalid-registration-token') {
    // Remove token from database
    await db.users.removeFCMToken(userId);
  }
}
```

2. **Notification Not Delivered:**
- Check token validity
- Verify data-only format
- Confirm priority is "high"
- Check user has notifications enabled

---

## 12. Monitoring & Logs

### Required Logs:
```javascript
console.log(`✅ Alert scheduled: ${alertId} for ${scheduledDateTime}`);
console.log(`📤 FCM sent: ${alertId} to token ${fcmToken.substr(0,10)}...`);
console.log(`❌ FCM failed: ${alertId} - ${error.message}`);
```

### Metrics to Track:
- Total alerts scheduled
- Total FCM sent
- Failed notifications
- Average delivery time
- Token refresh rate

---

## 13. Priority Implementation Order

1. ⚠️ **HIGH Priority:**
   - [ ] `POST /api/alert/schedule-notification`
   - [ ] `POST /api/reminder/schedule-notification`
   - [ ] Data-only FCM format
   - [ ] High priority setting

2. ⚠️ **MEDIUM Priority:**
   - [ ] Auto-reschedule in update endpoints
   - [ ] Repeat daily alerts
   - [ ] Error handling

3. ⚠️ **LOW Priority:**
   - [ ] Cancel endpoints
   - [ ] Monitoring dashboard
   - [ ] Multiple device support

---

## 14. Common Issues & Solutions

### Issue 1: Notification not arriving in kill mode
**Solution:** Use data-only format (NO `notification` object)

### Issue 2: Low priority notifications delayed
**Solution:** Set `android.priority: "high"` and `apns-priority: "10"`

### Issue 3: Notification arrives but app doesn't navigate
**Solution:** Ensure all required fields in `data` object

### Issue 4: Token expired
**Solution:** Implement token refresh handling

---

## 15. Security Considerations

1. ✅ Validate user owns the alert/reminder
2. ✅ Rate limit scheduling endpoints
3. ✅ Store FCM tokens encrypted
4. ✅ Expire old tokens (30+ days unused)
5. ✅ Validate scheduledDateTime is in future

---

## 16. Support & Documentation

### Mobile App Files:
- `src/crm/crmscreens/Employee/CreateAlertScreen.js` - Alert creation
- `src/screens/EditAlertScreen.js` - Alert editing
- `index.js` - Background handler
- `src/utils/fcmService.js` - FCM service

### Backend Documentation:
- This file: `BACKEND_REQUIREMENTS_FOR_NOTIFICATIONS.md`
- API Reference: `BACKEND_NOTIFICATION_CURL_COMMANDS.md`
- Testing Guide: `TEST_KILL_MODE_NOTIFICATIONS.md`

---

## 17. Quick Start Checklist

Backend team ke liye quick checklist:

- [ ] Firebase Admin SDK setup kiya
- [ ] `POST /api/alert/schedule-notification` endpoint banaya
- [ ] `POST /api/reminder/schedule-notification` endpoint banaya
- [ ] Cron job/scheduler setup kiya
- [ ] Data-only FCM format implement kiya
- [ ] High priority set kiya
- [ ] Update endpoints me auto-reschedule add kiya
- [ ] Database schema create kiya
- [ ] Error handling add kiya
- [ ] Test endpoints create kiye
- [ ] Logs implement kiye

---

## 18. Example Implementation (Node.js + Express)

```javascript
const express = require('express');
const admin = require('firebase-admin');
const schedule = require('node-schedule');
const router = express.Router();

// Store active jobs
const scheduledJobs = {};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

// Helper: Send FCM
async function sendFCMNotification(fcmToken, data) {
  try {
    const message = {
      token: fcmToken,
      data: {
        ...data,
        // Ensure all values are strings
        repeatDaily: String(data.repeatDaily || false)
      },
      android: {
        priority: 'high',
        ttl: '86400s'
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { contentAvailable: true, sound: 'default' } }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log('✅ FCM sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send failed:', error);
    return { success: false, error: error.message };
  }
}

// Endpoint: Schedule Alert
router.post('/api/alert/schedule-notification', async (req, res) => {
  try {
    const { alertId, fcmToken, scheduledDateTime, reason, date, time, repeatDaily } = req.body;
    
    // Validate
    if (!alertId || !fcmToken || !scheduledDateTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Cancel old job if exists
    if (scheduledJobs[alertId]) {
      scheduledJobs[alertId].cancel();
    }
    
    // Schedule new job
    const scheduledDate = new Date(scheduledDateTime);
    
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Scheduled time must be in future' });
    }
    
    const job = schedule.scheduleJob(scheduledDate, async () => {
      console.log(`📤 Sending FCM for alert ${alertId}`);
      
      await sendFCMNotification(fcmToken, {
        type: 'alert',
        alertId,
        reason,
        date,
        time,
        repeatDaily: String(repeatDaily),
        title: '🔔 Alert Notification',
        body: reason,
        notificationType: 'alert'
      });
      
      // Cleanup
      delete scheduledJobs[alertId];
      
      // TODO: Update database status to 'sent'
    });
    
    scheduledJobs[alertId] = job;
    
    console.log(`✅ Alert ${alertId} scheduled for ${scheduledDate}`);
    
    // TODO: Save to database
    
    res.json({ 
      success: true, 
      message: 'Alert scheduled successfully',
      alertId,
      scheduledFor: scheduledDate.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint: Schedule Reminder
router.post('/api/reminder/schedule-notification', async (req, res) => {
  try {
    const { reminderId, fcmToken, scheduledDateTime, clientName, message, enquiryId } = req.body;
    
    // Similar implementation as alert
    // ... (same pattern)
    
    res.json({ success: true, message: 'Reminder scheduled successfully', reminderId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test Endpoint: Send Immediate FCM
router.post('/api/test/send-fcm-now', async (req, res) => {
  try {
    const { fcmToken, alertId, reason } = req.body;
    
    const result = await sendFCMNotification(fcmToken, {
      type: 'alert',
      alertId: alertId || 'test_' + Date.now(),
      reason: reason || 'Test notification',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      repeatDaily: 'false',
      title: '🔔 Test Alert',
      body: reason || 'Test notification',
      notificationType: 'alert'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

---

## Contact & Support

**Mobile App Team:**
- All FCM integration complete
- Ready for testing
- Logs available for debugging

**Questions?**
- Check: `BACKEND_NOTIFICATION_CURL_COMMANDS.md`
- Test Guide: `TEST_KILL_MODE_NOTIFICATIONS.md`

---

**Last Updated:** January 9, 2026  
**Status:** ⚠️ Waiting for backend implementation  
**Urgency:** HIGH - Required for core app functionality
