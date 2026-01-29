# Backend Notification System - Verification Checklist

## 📋 Feature Overview

Employee ke reminders/alerts ki notification Admin ko bhi milni chahiye jab "Enable Popup Access" ON ho.

## ⚠️ IMPORTANT: Scheduled Notification Required!

**Current Issue:** Employee reminder set karte hi admin ko turant notification aa rahi hai.

**Expected Behavior:** Jo date/time employee ne reminder me set kiya hai, **usi time par** admin ko notification aaye.

---

## 🔄 Expected Flow

```
1. Admin login karta hai → FCM Token backend me save hota hai
2. Admin → Employee Management → Employee ka "Enable Popup Access" ON karta hai
3. Employee login karta hai → FCM Token backend me save hota hai
4. Employee Alert/Reminder create karta hai
5. Backend SAVE karta hai notification with scheduledDate
6. Backend JOB SCHEDULER use karta hai (node-cron/agenda.js/bull)
7. Scheduled time par → Admin ke FCM Token par push notification bhejta hai
8. Admin ke phone par notification aati hai 🔔 (at scheduled time!)
```

---

## 🚨 Backend Change Required: Scheduled Job

### Current Code (WRONG - sends immediately):
```javascript
// ❌ This sends notification immediately
await admin.messaging().send(fcmMessage);
res.json({ success: true });
```

### Required Code (CORRECT - sends at scheduled time):
```javascript
import schedule from 'node-schedule';
// OR use agenda.js, bull, node-cron

export const receiveEmployeeNotification = async (req, res) => {
  const { scheduledDate, scheduledTime, title, message, fcmPayload } = req.body;
  
  // 1. Save notification to database
  const notification = new Notification({
    title,
    message,
    scheduledDate,
    scheduledTime,
    status: 'pending', // pending, sent, failed
    ...otherFields
  });
  await notification.save();
  
  // 2. Schedule FCM notification for the scheduled time
  const scheduledDateTime = new Date(scheduledDate);
  if (scheduledTime) {
    const [hours, minutes] = scheduledTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // 3. Check if scheduled time is in future
  if (scheduledDateTime > new Date()) {
    // Schedule the job
    schedule.scheduleJob(scheduledDateTime, async () => {
      try {
        const adminUser = await Admin.findOne({});
        if (adminUser && adminUser.fcmToken) {
          const fcmMessage = {
            token: adminUser.fcmToken,
            notification: fcmPayload?.notification || { title, body: message },
            data: fcmPayload?.data || {},
            android: { priority: 'high' }
          };
          
          await admin.messaging().send(fcmMessage);
          console.log('✅ Scheduled notification sent to admin at:', scheduledDateTime);
          
          // Update notification status
          await Notification.findByIdAndUpdate(notification._id, { status: 'sent' });
        }
      } catch (error) {
        console.error('❌ Failed to send scheduled notification:', error);
        await Notification.findByIdAndUpdate(notification._id, { status: 'failed' });
      }
    });
    
    console.log('⏰ Notification scheduled for:', scheduledDateTime);
  } else {
    // If time is in past, send immediately
    // ... send FCM now
  }
  
  res.json({ success: true, message: 'Notification scheduled successfully' });
};
```

### Alternative: Using Agenda.js (Recommended for production)
```javascript
import Agenda from 'agenda';

const agenda = new Agenda({ db: { address: mongoConnectionString } });

// Define job
agenda.define('send-admin-notification', async (job) => {
  const { notificationId } = job.attrs.data;
  
  const notification = await Notification.findById(notificationId);
  if (!notification) return;
  
  const adminUser = await Admin.findOne({});
  if (adminUser && adminUser.fcmToken) {
    await admin.messaging().send({
      token: adminUser.fcmToken,
      notification: {
        title: notification.title,
        body: notification.message
      }
    });
    
    notification.status = 'sent';
    await notification.save();
  }
});

// Schedule job when employee creates reminder
await agenda.schedule(scheduledDateTime, 'send-admin-notification', { 
  notificationId: notification._id 
});
```

---

## 📦 Required npm Packages (Backend)

Install one of these job schedulers:

```bash
# Option 1: node-schedule (Simple)
npm install node-schedule

# Option 2: Agenda.js (Recommended for production - MongoDB based)
npm install agenda

# Option 3: Bull (Redis based - best for scalability)
npm install bull

# Option 4: node-cron (Simple cron-like scheduling)
npm install node-cron
```

---

## 📊 Database Schema Update

Add these fields to Notification schema:

```javascript
const NotificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  scheduledDate: Date,        // ⭐ Important - schedule time
  scheduledTime: String,      // Optional: "10:00", "14:30"
  status: {                   // ⭐ Track notification status
    type: String,
    enum: ['pending', 'scheduled', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: Date,               // When actually sent
  employeeId: ObjectId,       // Who created
  notificationType: String,   // employee_reminder_to_admin, etc.
  fcmPayload: Object,         // FCM data
  createdAt: { type: Date, default: Date.now }
});
```

---

## ⏰ Cron Job for Pending Notifications (Alternative approach)

If scheduling individual jobs is complex, use a cron job that checks every minute:

```javascript
import cron from 'node-cron';

// Run every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  
  // Find notifications that should be sent now
  const pendingNotifications = await Notification.find({
    status: 'pending',
    scheduledDate: { $lte: now }
  });
  
  for (const notification of pendingNotifications) {
    try {
      const adminUser = await Admin.findOne({});
      if (adminUser && adminUser.fcmToken) {
        await admin.messaging().send({
          token: adminUser.fcmToken,
          notification: {
            title: notification.title,
            body: notification.message
          },
          data: notification.fcmPayload?.data || {}
        });
        
        notification.status = 'sent';
        notification.sentAt = new Date();
        await notification.save();
        
        console.log('✅ Sent scheduled notification:', notification.title);
      }
    } catch (error) {
      notification.status = 'failed';
      await notification.save();
      console.error('❌ Failed:', error);
    }
  }
});
```

---

## ✅ Backend Verification Checklist

### 1. Admin Login API (`POST /admin/login`)

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "fcmToken": "firebase_token_here"
}
```

**Check:**
- [ ] API `fcmToken` accept karta hai?
- [ ] FCM Token database me admin ke record me save hota hai?
- [ ] Konse field me save hota hai? (e.g., `fcmToken`, `deviceToken`, etc.)

---

### 2. Employee Login API (`POST /api/employees/login`)

**Request Body:**
```json
{
  "email": "employee@example.com",
  "password": "password123",
  "fcmToken": "firebase_token_here"
}
```

**Check:**
- [ ] API `fcmToken` accept karta hai?
- [ ] FCM Token database me employee ke record me save hota hai?

---

### 3. Employee Update API (`PUT /admin/employees/{employeeId}`)

**Request Body (when toggling popup access):**
```json
{
  "name": "Employee Name",
  "email": "employee@example.com",
  "phone": "1234567890",
  "department": "Sales",
  "role": "roleId",
  "giveAdminAccess": false,
  "adminReminderPopupEnabled": true,
  "isActive": true
}
```

**Check:**
- [ ] API `adminReminderPopupEnabled` field accept karta hai?
- [ ] Ye field database me persist hota hai?
- [ ] Employee GET API me ye field return hota hai?

---

### 4. Employee Profile API (`GET /employee/profile` or `GET /employee/me`)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "employeeId",
    "name": "Employee Name",
    "email": "employee@example.com",
    "adminReminderPopupEnabled": true,
    // ... other fields
  }
}
```

**Check:**
- [ ] Response me `adminReminderPopupEnabled` field aata hai?
- [ ] Correct value return hoti hai (true/false)?

---

### 5. Admin Notifications API (`POST /admin/notifications`) ⭐ CRITICAL

**Request Body (from mobile app):**
```json
{
  "title": "📋 Employee Reminder: Client Name",
  "message": "Employee set reminder: Follow up",
  "scheduledDate": "2026-01-28T10:00:00.000Z",
  "clientName": "Client Name",
  "phone": "9876543210",
  "email": "client@example.com",
  "enquiryId": "enquiryId123",
  "reminderTitle": "Follow up call",
  "reminderNote": "Call regarding property",
  "notificationType": "employee_reminder_to_admin",
  "repeatType": "none",
  "fcmPayload": {
    "notification": {
      "title": "📋 Employee Reminder: Client Name",
      "body": "Employee set reminder: Follow up"
    },
    "data": {
      "type": "employee_reminder_to_admin",
      "enquiryId": "enquiryId123",
      "clientName": "Client Name",
      "reminderTitle": "Follow up call",
      "reminderNote": "Call regarding property"
    }
  }
}
```

**Check:**
- [ ] API ye request accept karta hai?
- [ ] Backend Admin ke FCM Token database se fetch karta hai?
- [ ] Firebase Admin SDK use karke push notification bhejta hai?
- [ ] Notification Admin ke device par aati hai?

---

### 6. Alert Notification to Admin (`POST /admin/notifications`)

**Request Body (for alerts):**
```json
{
  "title": "🔔 Employee Alert: Meeting Reminder",
  "message": "Employee created alert: Important meeting at 3 PM",
  "scheduledDate": "2026-01-28",
  "scheduledTime": "15:00",
  "alertTitle": "Meeting Reminder",
  "alertReason": "Important meeting at 3 PM",
  "notificationType": "employee_alert_to_admin",
  "repeatFrequency": "none",
  "fcmPayload": {
    "notification": {
      "title": "🔔 Employee Alert: Meeting Reminder",
      "body": "Employee created alert: Important meeting at 3 PM"
    },
    "data": {
      "type": "employee_alert_to_admin",
      "alertTitle": "Meeting Reminder",
      "alertReason": "Important meeting at 3 PM",
      "scheduledDate": "2026-01-28",
      "scheduledTime": "15:00"
    }
  }
}
```

**Check:**
- [ ] Alert notifications bhi same `/admin/notifications` endpoint par jaati hain?
- [ ] Backend properly handle karta hai?

---

## 🔥 Firebase Admin SDK Code (Backend Reference)

Backend me ye code hona chahiye FCM notification bhejne ke liye:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin (one time)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey)
});

// Function to send notification to admin
async function sendNotificationToAdmin(notificationData) {
  // 1. Get admin's FCM token from database
  const adminUser = await Admin.findOne({ /* your query */ });
  const adminFcmToken = adminUser.fcmToken;
  
  if (!adminFcmToken) {
    console.log('Admin FCM token not found');
    return;
  }
  
  // 2. Prepare FCM message
  const message = {
    token: adminFcmToken,
    notification: {
      title: notificationData.title,
      body: notificationData.message,
    },
    data: notificationData.fcmPayload?.data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
        sound: 'default',
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        }
      }
    }
  };
  
  // 3. Send notification
  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 🧪 Testing cURL Commands

### Test 1: Admin Login with FCM Token
```bash
curl -X POST https://abc.bhoomitechzone.us/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "fcmToken": "test_fcm_token_12345"
  }'
```

### Test 2: Employee Login with FCM Token
```bash
curl -X POST https://abc.bhoomitechzone.us/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@example.com",
    "password": "password123",
    "fcmToken": "test_fcm_token_67890"
  }'
```

### Test 3: Update Employee Popup Access
```bash
curl -X PUT https://abc.bhoomitechzone.us/admin/employees/{employeeId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "adminReminderPopupEnabled": true
  }'
```

### Test 4: Send Admin Notification (Manual Test)
```bash
curl -X POST https://abc.bhoomitechzone.us/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test from employee",
    "notificationType": "employee_reminder_to_admin"
  }'
```

---

## ❓ Questions for Backend Developer

1. **FCM Token Storage**: Admin aur Employee dono ke FCM tokens kahan store ho rahe hain?

2. **Admin Notification Endpoint**: `/admin/notifications` endpoint FCM push notification bhejta hai ya sirf database me save karta hai?

3. **Firebase Setup**: Firebase Admin SDK backend me configured hai? Service account key setup hai?

4. **Multiple Admin Devices**: Agar admin multiple devices se login kare, toh sabhi devices par notification jayegi?

5. **Notification Types**: Backend `notificationType` field handle karta hai differentiate karne ke liye?

---

## 📱 Mobile App Side (Already Done)

- ✅ Admin Login - FCM token bhejta hai
- ✅ Employee Login - FCM token bhejta hai  
- ✅ Employee creates Reminder - Admin ko notification bhejta hai (if popup enabled)
- ✅ Employee creates Alert - Admin ko notification bhejta hai (if popup enabled)
- ✅ Checks `adminReminderPopupEnabled` field properly

---

## 🎯 Summary

**Mobile App → Backend ko request bhejta hai → Backend ko Admin ke FCM token par push notification bhejna hai**

Agar backend properly FCM notification bhej raha hai, toh Admin ke phone par Employee ke popups/notifications aayenge.

---

## 🚀 Quick API Reference (Copy-Paste Ready)

### Employee Reminder/Alert create karne par ye API call hoti hai:

```http
POST https://abc.bhoomitechzone.us/admin/notifications
Content-Type: application/json
Authorization: Bearer {employee_token}

{
  "title": "📋 Employee Reminder: Client Name",
  "message": "Employee set reminder: Follow up",
  "notificationType": "employee_reminder_to_admin",
  "scheduledDate": "2026-01-28T10:00:00.000Z",
  "clientName": "Client Name",
  "phone": "9876543210",
  "email": "client@example.com",
  "enquiryId": "enquiryId123",
  "reminderTitle": "Follow up call",
  "reminderNote": "Call regarding property",
  "fcmPayload": {
    "notification": {
      "title": "📋 Employee Reminder: Client Name",
      "body": "Employee set reminder: Follow up"
    },
    "data": {
      "type": "employee_reminder_to_admin",
      "enquiryId": "enquiryId123"
    }
  }
}
```

### Backend ko kya karna hai:

1. **Request receive karo** `/admin/notifications` par
2. **Admin ka FCM Token database se fetch karo**
3. **Firebase Admin SDK se push notification bhejo** Admin ke device par
4. **Response bhejo** `{ "success": true }`

### Expected Backend Code:

```javascript
// POST /admin/notifications handler
app.post('/admin/notifications', async (req, res) => {
  const { title, message, fcmPayload } = req.body;
  
  // 1. Get Admin's FCM token from database
  const admin = await Admin.findOne({ role: 'admin' });
  const adminFcmToken = admin.fcmToken;
  
  if (!adminFcmToken) {
    return res.json({ success: false, message: 'Admin FCM token not found' });
  }
  
  // 2. Send FCM notification
  const fcmMessage = {
    token: adminFcmToken,
    notification: fcmPayload?.notification || { title, body: message },
    data: fcmPayload?.data || {},
    android: { priority: 'high' }
  };
  
  await admin.messaging().send(fcmMessage);
  
  res.json({ success: true, message: 'Notification sent to admin' });
});
```
