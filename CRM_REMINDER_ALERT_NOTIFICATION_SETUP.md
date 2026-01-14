# CRM Reminder & Alert Notification Complete Setup Guide

## ❗ Problem
- CRM Admin se reminder set kar rahe hain → Kuch devices me notification aa rahi hai, kuch me nahi
- Alert create kar rahe hain → Kuch phones me notification aa rahi hai, kuch me nahi
- Inconsistent notification delivery across devices

## 🎯 Solution: Proper FCM Token Registration & Backend Notification API

---

## 📋 Part 1: How Notifications Currently Work

### Current Flow (Incomplete):
```
1. Admin/Employee creates reminder → Backend saves reminder
2. Alert created → Backend saves alert
3. ❌ Backend MAY OR MAY NOT send FCM notification
4. ❌ Some devices receive, some don't
```

### What's Missing:
1. **FCM Token not properly saved** for all users/employees
2. **Backend notification endpoint** may not be triggered correctly
3. **No device token verification** when creating reminders/alerts

---

## 🔧 Part 2: Proper Implementation Steps

### Step 1: Ensure FCM Token is Saved for ALL Users

**When to save FCM Token:**
- ✅ During OTP login (already implemented in OtpScreen.js)
- ✅ During employee/admin login
- ✅ On app startup (for already logged-in users)

**Current Implementation Check:**

```javascript
// File: src/screens/OtpScreen.js (Line ~135)
// Already saves FCM token during login:

const fcmToken = await getStoredFCMToken();
if (fcmToken && response.user.id) {
  await sendFCMTokenToBackend(response.user.id, fcmToken);
}
```

**What Needs to be Added:**

```javascript
// In CRM Admin/Employee Login Screens
// After successful login:

import { getStoredFCMToken } from '../utils/fcmService';
import { sendFCMTokenToBackend } from '../services/api';

// After admin/employee login success:
try {
  const fcmToken = await getStoredFCMToken();
  const userId = await AsyncStorage.getItem('userId');
  const employeeId = await AsyncStorage.getItem('employeeId');
  const adminId = await AsyncStorage.getItem('adminId');
  
  if (fcmToken && (userId || employeeId || adminId)) {
    await sendFCMTokenToBackend(
      userId || employeeId || adminId, 
      fcmToken
    );
    console.log('✅ FCM Token saved for employee/admin');
  }
} catch (error) {
  console.log('⚠️ FCM token save error (non-critical):', error.message);
}
```

---

### Step 2: Backend API Endpoints for Notification

**Required Backend Endpoints:**

#### 1. Save FCM Token
```bash
POST https://abc.bhoomitechzone.us/api/users/fcm-token
```

**Request:**
```json
{
  "userId": "employee_id_or_user_id",
  "fcmToken": "device_fcm_token_here",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token saved successfully"
}
```

---

#### 2. Send Reminder Notification (Backend Should Call This)
```bash
POST https://abc.bhoomitechzone.us/api/notifications/send-reminder
```

**Request:**
```json
{
  "employeeId": "67890",
  "reminderId": "reminder_123",
  "title": "Follow up with client",
  "body": "Client name: John Doe, Property: 2BHK Apartment",
  "data": {
    "type": "reminder",
    "reminderId": "reminder_123",
    "enquiryId": "enquiry_456"
  }
}
```

**Backend Logic:**
```javascript
// Backend should:
// 1. Get employee's FCM token from database
// 2. Send FCM notification using Firebase Admin SDK
// 3. Store notification in database for history
```

---

#### 3. Send Alert Notification (Backend Should Call This)
```bash
POST https://abc.bhoomitechzone.us/api/notifications/send-alert
```

**Request:**
```json
{
  "recipientType": "all|employees|specific",
  "recipientIds": ["emp1", "emp2"],
  "alertId": "alert_123",
  "title": "Important Alert",
  "body": "All employees must attend meeting at 3 PM",
  "priority": "high",
  "data": {
    "type": "alert",
    "alertId": "alert_123",
    "category": "meeting"
  }
}
```

---

### Step 3: Modified Reminder Creation Flow

**Current Reminder API** (from REMINDER_NOTIFICATION_API_ENDPOINTS.md):
```bash
curl -X POST "https://abc.bhoomitechzone.us/employee/reminders/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up with client",
    "description": "Call client regarding property",
    "reminderDate": "2026-01-10T10:30:00.000Z",
    "enquiryId": "enquiry_123",
    "clientInfo": {
      "name": "John Doe",
      "phone": "9876543210"
    }
  }'
```

**Backend Should:**
1. ✅ Save reminder to database
2. ✅ **Get assigned employee's FCM token**
3. ✅ **Send immediate FCM notification** to employee
4. ✅ **Schedule notification** for reminderDate time
5. ✅ Return success response

---

### Step 4: Modified Alert Creation Flow

**Current Alert API:**
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/alerts" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting Alert",
    "message": "All employees attend meeting at 3 PM",
    "priority": "high",
    "targetAudience": "all_employees"
  }'
```

**Backend Should:**
1. ✅ Save alert to database
2. ✅ **Get all employees' FCM tokens** (if targetAudience = "all_employees")
3. ✅ **Send FCM notification to ALL tokens** using multicast
4. ✅ Store delivery status for each device
5. ✅ Return success with delivery count

---

## 🔍 Part 3: Debugging Guide

### Check if FCM Token is Saved

**Test Command (Check on device):**
```bash
# In app, go to Profile Screen → Test FCM button
# OR run in console:
```

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if token exists
const token = await AsyncStorage.getItem('fcmToken');
console.log('FCM Token:', token);

// Test if backend has the token
const userId = await AsyncStorage.getItem('userId');
console.log('User ID:', userId);
```

---

### Verify Backend Has FCM Token

**Check Backend API:**
```bash
curl -X GET "https://abc.bhoomitechzone.us/api/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response should include:**
```json
{
  "userId": "12345",
  "name": "Employee Name",
  "fcmToken": "device_fcm_token_here",  // ← This should be present
  "fcmTokenUpdatedAt": "2026-01-07T10:30:00Z"
}
```

---

### Test Notification Manually

**Send Test Notification (Admin Panel):**
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/notifications/test" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "employee_id",
    "title": "Test Notification",
    "body": "Testing FCM notification delivery"
  }'
```

---

## 📱 Part 4: Frontend Implementation Checklist

### ✅ Things Already Implemented:

1. FCM Service setup (`src/utils/fcmService.js`)
2. Token storage in AsyncStorage
3. Token sending during OTP login
4. Notification permission request
5. Foreground/Background handlers

### ❌ Things That Need Implementation:

1. **FCM Token saving for Admin/Employee login** (see Step 1 above)
2. **Token refresh on app startup** for already logged-in users
3. **Re-send token if expired** (check token age, refresh if > 30 days)
4. **Device token verification** before creating reminders

---

## 🛠️ Part 5: Required Code Changes

### Change 1: Add FCM Token Save to Employee/Admin Login

**File to modify:** `src/crm/crmscreens/Employee/LoginEmployee.js` (or similar)

```javascript
// After successful employee login:

import { getStoredFCMToken } from '../../../utils/fcmService';
import { sendFCMTokenToBackend } from '../../../services/api';

// Inside login success handler:
try {
  const fcmToken = await getStoredFCMToken();
  const employeeId = loginResponse.data.employee.id;
  
  if (fcmToken && employeeId) {
    await sendFCMTokenToBackend(employeeId, fcmToken);
    console.log('✅ FCM Token registered for employee');
  }
} catch (error) {
  console.log('⚠️ FCM token registration failed (non-critical)');
}
```

---

### Change 2: Add Token Refresh on App Startup

**File to modify:** `src/App.js` or main navigation file

```javascript
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredFCMToken } from './utils/fcmService';
import { sendFCMTokenToBackend } from './services/api';

// Add this useEffect in main App component:
useEffect(() => {
  const refreshFCMToken = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const employeeId = await AsyncStorage.getItem('employeeId');
      const adminId = await AsyncStorage.getItem('adminId');
      
      const id = userId || employeeId || adminId;
      
      if (id) {
        const fcmToken = await getStoredFCMToken();
        if (fcmToken) {
          await sendFCMTokenToBackend(id, fcmToken);
          console.log('✅ FCM Token refreshed on app startup');
        }
      }
    } catch (error) {
      console.log('⚠️ Token refresh failed (non-critical)');
    }
  };
  
  refreshFCMToken();
}, []);
```

---

## 📊 Part 6: Backend Requirements Summary

### Backend MUST Implement:

1. **FCM Token Storage**
   - Store token per user/employee with deviceId
   - Support multiple devices per user
   - Update token on re-registration

2. **Notification Sending on Reminder Creation**
   - Get assignee's FCM token
   - Send FCM push notification
   - Schedule future notification for reminderDate

3. **Notification Sending on Alert Creation**
   - Get all target users' FCM tokens
   - Use Firebase multicast for bulk sending
   - Track delivery status

4. **Error Handling**
   - Handle invalid tokens (remove from DB)
   - Retry failed notifications
   - Log all notification attempts

---

## 🎯 Part 7: Testing Procedure

### Test 1: Verify FCM Token Registration

1. Clear app data: `adb shell pm clear com.gharplot`
2. Open app and login
3. Check console logs: Should see "✅ FCM Token saved"
4. Verify backend has token (check user endpoint)

---

### Test 2: Test Reminder Notification

1. Create reminder for specific employee
2. Check if employee receives notification immediately
3. Check if notification appears at scheduled time
4. Test on multiple devices (2-3 phones)

---

### Test 3: Test Alert Notification

1. Create alert targeting "All Employees"
2. All logged-in employees should receive notification
3. Check delivery count in backend response
4. Verify on at least 3 different devices

---

## 📞 Support & Troubleshooting

### Common Issues:

**Issue 1: "Token not found in backend"**
- Solution: Re-login or call `sendFCMTokenToBackend` manually

**Issue 2: "Notification received on some devices only"**
- Solution: Check if all devices have valid FCM tokens in backend
- Verify backend is calling Firebase multicast correctly

**Issue 3: "Notifications not appearing"**
- Check notification permission: Settings → Apps → GharPlot → Notifications
- Verify Firebase Cloud Messaging is enabled
- Check Google Play Services is updated

---

## 🔗 Related Documentation

1. [REMINDER_NOTIFICATION_API_ENDPOINTS.md](REMINDER_NOTIFICATION_API_ENDPOINTS.md) - All reminder API endpoints
2. [FCM_REMINDER_SETUP_COMPLETE.md](FCM_REMINDER_SETUP_COMPLETE.md) - FCM setup guide
3. [ALERT_TESTING_GUIDE.md](ALERT_TESTING_GUIDE.md) - Alert notification testing

---

**Last Updated:** January 7, 2026  
**Status:** Action Required on Backend + Frontend Token Registration  
**Priority:** HIGH - Affects core notification functionality
