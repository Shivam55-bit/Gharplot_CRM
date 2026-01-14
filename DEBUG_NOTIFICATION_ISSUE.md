# 🔍 Debug Guide - Notification Navigation Not Working

## Problem
Notification tap karne par Dashboard screen par ja raha hai instead of EditAlertScreen.

## Root Cause Check

### 1️⃣ Check Console Logs
App reload karne ke baad, notification tap karo aur console mein ye logs dhundo:

```
════════════════════════════════════════════════════════════
🔔🔔🔔 BACKGROUND TAP DETECTED! 🔔🔔🔔
════════════════════════════════════════════════════════════
```

**Agar ye log NAHI dikha**, matlab handler trigger nahi ho raha - problem backend notification format mein hai.

**Agar ye log dikha**, to aage ke logs check karo:

```
🔍 Checking notification type: alert
🔍 Full notification data: {...}
✅ ALERT TYPE CONFIRMED - Will navigate to EditAlertScreen
```

### 2️⃣ Notification Data Format Check

Backend se notification **iss exact format** mein aani chahiye:

```json
{
  "to": "FCM_TOKEN",
  "data": {
    "type": "alert",              ← YE MUST HAI!
    "notificationType": "alert",  ← Backup field
    "alertId": "6961e48e699454acd18097f4",
    "reason": "Client ko call karna hai",
    "date": "2024-01-15",
    "time": "14:30",
    "repeatDaily": "false"
  },
  "notification": {
    "title": "🔔 अलर्ट सूचना",
    "body": "Client ko call karna hai"
  }
}
```

### 3️⃣ Backend Notification Send Code Check

Agar tum CreateAlertScreen se alert create kar rahe ho, to check karo ki backend properly notification bhej raha hai:

**Node.js Backend:**
```javascript
const admin = require('firebase-admin');

// ✅ CORRECT WAY
await admin.messaging().send({
  token: userFCMToken,
  data: {
    type: 'alert',           // ← CRITICAL!
    alertId: alertId,
    reason: alertReason,
    date: alertDate,
    time: alertTime,
    repeatDaily: 'false'
  },
  notification: {
    title: '🔔 अलर्ट सूचना',
    body: alertReason
  }
});
```

### 4️⃣ Quick Test Commands

App reload karne ke baad, console mein run karo:

```javascript
// Test navigation directly
NavigationService.navigate('EditAlert', {
  alertId: '123',
  originalReason: 'Test',
  originalDate: '2024-01-15',
  originalTime: '14:30',
  repeatDaily: false
})
```

Agar ye command se EditAlert screen khulta hai, matlab navigation working hai - problem notification handler mein hai.

## Solutions

### Solution 1: Check Notification Type Field
Console log mein dekho ki `type` field aa raha hai ya nahi:

```
🔍 Checking notification type: undefined  ← ❌ PROBLEM!
```

Agar `undefined` hai, to backend se `type: "alert"` field add karna padega.

### Solution 2: Debug Notification Data
App mein ye code temporarily add karo (App.js ki top pe):

```javascript
if (__DEV__) {
  const messaging = require('@react-native-firebase/messaging').default;
  
  messaging().onNotificationOpenedApp((msg) => {
    console.log('🔥 RAW NOTIFICATION DATA:');
    console.log(JSON.stringify(msg, null, 2));
  });
}
```

Phir notification tap karo aur **complete notification data** console mein copy karo.

### Solution 3: Force Test Navigation
Console mein ye run karo to test karo ki handler work kar raha hai:

```javascript
// Simulate notification tap
const testNotification = {
  data: {
    type: 'alert',
    alertId: '123',
    reason: 'Test Alert',
    date: '2024-01-15',
    time: '14:30',
    repeatDaily: 'false'
  }
};

// Check if navigation works
const { navigationRef } = require('./src/services/NavigationService');
navigationRef.current?.navigate('EditAlert', {
  alertId: '123',
  originalReason: 'Test',
  originalDate: '2024-01-15',
  originalTime: '14:30',
  repeatDaily: false
});
```

## Most Common Issues

### Issue 1: Backend Not Sending `type` Field ❌
```json
{
  "data": {
    "alertId": "123",
    "reason": "Test"
    // ❌ Missing: "type": "alert"
  }
}
```

**Fix:** Backend mein `type: 'alert'` add karo.

### Issue 2: Local Notification Creating Issue ❌
Agar tum local notification bana rahe ho (AlertNotificationService), to check karo ki usme bhi `type` field hai:

```javascript
const notification = {
  data: {
    type: 'alert',  // ← YE ADD KARO
    alertId: alertId,
    // ... rest
  }
};
```

### Issue 3: Multiple Notification Handlers ❌
Agar multiple jagah notification handlers setup hain, to wo conflict kar rahe honge. Check karo:
- App.js - ✅ Main handler yahan hai
- fcmService.js - Check karo ki yahan se duplicate handler to nahi
- NotificationHandler.js - Check karo ki ye override to nahi kar raha

## Testing Steps

1. **App restart karo** (completely close aur reopen)
2. **Login karo**
3. **Dashboard ya koi bhi screen par jao**
4. **Home button press karo** (app background mein jayegi)
5. **Backend se alert notification bhejo** (ya CreateAlert screen se create karo)
6. **Console logs dekho** - `🔔🔔🔔 BACKGROUND TAP DETECTED!` dikhna chahiye
7. **Notification tap karo**
8. **Console check karo:**
   - `✅ ALERT TYPE CONFIRMED` dikhna chahiye
   - `🚀 RESETTING NAVIGATION STACK TO EditAlert` dikhna chahiye
   - `✅ Verified: Successfully on EditAlert screen` dikhna chahiye

## If Still Not Working

Agar sab kuch sahi hai but phir bhi nahi ho raha, to:

1. **Metro bundler restart karo:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **App completely reinstall karo:**
   ```bash
   adb uninstall com.bhoomitechzone.gharplot.app
   npx react-native run-android
   ```

3. **Complete notification raw data bhejo** console se copy karke

## Backend Integration Checklist

- [ ] Backend me `type: 'alert'` field add kiya
- [ ] FCM notification properly format mein bhej raha hai
- [ ] Notification mein `alertId` field hai
- [ ] Test notification se verify kiya ki data aa raha hai
- [ ] Console logs mein notification data proper dikha raha hai

---

**Most Important:** Console logs carefully dekho! Saari information wahan hai ki problem kahan hai.
