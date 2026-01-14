# 🔄 Repeat Daily Alert Fix - Complete Guide

## 🔴 Problem
- Alert without "Repeat Daily" ✅ Works - notification aata hai
- Alert with "Repeat Daily" ✅ checked ❌ Notification nahi aa raha

## 🎯 Root Cause
Backend me `repeatDaily: true` alerts ko handle karne ki logic missing hai. Backend ko:
1. First notification bhejne ke baad
2. Next day same time pe again notification bhejna hai
3. Har din repeat karna hai jab tak alert active hai

## 📋 Backend Requirements

### Option 1: Cron Job Based (RECOMMENDED) ⭐

Backend me cron job add karna padega jo har minute check kare:

```javascript
const cron = require('node-cron');

// Har minute check karo
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;
  
  console.log(`⏰ Checking daily alerts for time: ${currentTime}`);
  
  try {
    // Find all active repeat daily alerts for current time
    const dailyAlerts = await Alert.find({
      repeatDaily: true,
      time: currentTime,
      isActive: true
    });
    
    console.log(`📅 Found ${dailyAlerts.length} repeat daily alerts`);
    
    // Send FCM notification for each alert
    for (const alert of dailyAlerts) {
      try {
        // Get user's FCM token
        const user = await User.findById(alert.userId);
        
        if (user && user.fcmToken) {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title: '🔔 Daily Alert Reminder',
              body: alert.reason
            },
            data: {
              notificationType: 'alert',
              alertId: alert._id.toString(),
              reason: alert.reason,
              date: alert.date,
              time: alert.time,
              repeatDaily: 'true'
            }
          });
          
          console.log(`✅ Sent daily alert notification: ${alert._id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send alert ${alert._id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
});
```

### Option 2: Reschedule After Send

Jab notification send ho, toh turant next day ke liye reschedule karo:

```javascript
// After sending notification
if (alert.repeatDaily) {
  // Calculate next day same time
  const nextSchedule = new Date(alert.scheduledDateTime);
  nextSchedule.setDate(nextSchedule.getDate() + 1);
  
  // Update alert with new schedule
  await Alert.findByIdAndUpdate(alert._id, {
    scheduledDateTime: nextSchedule
  });
  
  // Schedule FCM for tomorrow
  await scheduleFirebaseNotification(alert._id, nextSchedule);
}
```

## 🔧 Backend Files To Update

### 1. Install Dependencies
```bash
npm install node-cron
```

### 2. Update `/api/alert/schedule-notification` endpoint

```javascript
router.post('/api/alert/schedule-notification', async (req, res) => {
  try {
    const { alertId, reason, date, time, scheduledDateTime, repeatDaily, fcmToken } = req.body;
    
    // Save alert with repeat daily flag
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        scheduledDateTime,
        repeatDaily: repeatDaily === 'true' || repeatDaily === true,
        fcmToken,
        time: time, // ⚠️ IMPORTANT: Store time separately for cron matching
        isActive: true
      },
      { new: true }
    );
    
    // For repeat daily, notification will be sent by cron job
    if (repeatDaily === 'true' || repeatDaily === true) {
      console.log(`🔄 Repeat daily alert scheduled: ${alertId} at ${time}`);
      return res.json({
        success: true,
        message: 'Daily repeat alert scheduled',
        alert
      });
    }
    
    // For one-time alerts, schedule FCM immediately
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: '🔔 Alert Reminder',
        body: reason
      },
      data: {
        notificationType: 'alert',
        alertId: alertId,
        reason: reason,
        date: date,
        time: time,
        repeatDaily: String(repeatDaily || false)
      }
    });
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Schedule notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 3. Create new file `cronJobs.js`

```javascript
const cron = require('node-cron');
const Alert = require('./models/Alert');
const User = require('./models/User');
const admin = require('firebase-admin');

// Initialize cron job for repeat daily alerts
function initializeCronJobs() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    console.log(`⏰ [CRON] Checking repeat daily alerts at ${currentTime}`);
    
    try {
      const dailyAlerts = await Alert.find({
        repeatDaily: true,
        time: currentTime,
        isActive: true
      }).populate('userId');
      
      console.log(`📅 [CRON] Found ${dailyAlerts.length} alerts to send`);
      
      for (const alert of dailyAlerts) {
        try {
          const user = alert.userId;
          
          if (user && user.fcmToken) {
            await admin.messaging().send({
              token: user.fcmToken,
              notification: {
                title: '🔔 Daily Reminder',
                body: alert.reason
              },
              data: {
                notificationType: 'alert',
                alertId: alert._id.toString(),
                reason: alert.reason,
                date: alert.date,
                time: alert.time,
                repeatDaily: 'true'
              }
            });
            
            console.log(`✅ [CRON] Sent daily alert: ${alert._id}`);
          }
        } catch (sendError) {
          console.error(`❌ [CRON] Failed to send alert ${alert._id}:`, sendError);
        }
      }
    } catch (error) {
      console.error('❌ [CRON] Job error:', error);
    }
  });
  
  console.log('✅ Cron job initialized for repeat daily alerts');
}

module.exports = { initializeCronJobs };
```

### 4. Update `server.js` or `app.js`

```javascript
const { initializeCronJobs } = require('./cronJobs');

// After all other initializations
initializeCronJobs();

console.log('🚀 Server started with cron jobs');
```

## 📊 Database Schema Update

Alert model me ensure karo ye fields hain:

```javascript
const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  reason: String,
  date: String,
  time: String, // ⚠️ Must be in HH:MM format
  scheduledDateTime: Date,
  repeatDaily: { type: Boolean, default: false }, // ⚠️ Important
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
```

## 🧪 Testing Steps

### Test 1: One-Time Alert (No Repeat)
1. Create alert WITHOUT repeat daily
2. Set time for 2 minutes from now
3. ✅ Should receive notification after 2 minutes

### Test 2: Repeat Daily Alert
1. Create alert WITH repeat daily ✅ checked
2. Set time for 2 minutes from now
3. ✅ Should receive first notification after 2 minutes
4. ✅ Should receive again tomorrow same time
5. ✅ Should repeat every day until you delete it

### Test 3: Multiple Daily Alerts
1. Create 2-3 alerts with repeat daily at different times
2. ✅ All should trigger at their respective times
3. ✅ Should repeat daily

## 🐛 Debug Checklist

### Backend Logs Ko Check Karo:
```bash
# Look for these logs:
⏰ [CRON] Checking repeat daily alerts at HH:MM
📅 [CRON] Found X alerts to send
✅ [CRON] Sent daily alert: <alertId>
```

### If Notifications Not Coming:

1. **Check Cron Job Running**
   ```javascript
   // Add this log in cron
   console.log('⏰ Cron running at:', new Date().toLocaleString());
   ```

2. **Check Time Format**
   - Alert time: "15:30" ✅
   - Alert time: "3:30" ❌ (should be "03:30")
   - Must be HH:MM format with leading zeros

3. **Check Database**
   ```javascript
   // Check if alerts saved correctly
   db.alerts.find({ repeatDaily: true })
   ```

4. **Check FCM Token**
   ```javascript
   // Ensure user has valid FCM token
   const user = await User.findById(userId);
   console.log('FCM Token:', user.fcmToken);
   ```

## 🔥 Quick Backend Curl Test

### Create Repeat Daily Alert:
```bash
curl -X POST "https://abc.bhoomitechzone.us/api/alert/schedule-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "alertId": "test_daily_001",
    "reason": "Test daily alert",
    "date": "2026-01-13",
    "time": "14:30",
    "scheduledDateTime": "2026-01-13T14:30:00.000Z",
    "repeatDaily": true,
    "fcmToken": "YOUR_FCM_TOKEN"
  }'
```

### Check Backend Cron Logs:
```bash
# Watch logs in real-time
tail -f server.log | grep CRON
```

## ✅ Expected Behavior After Fix

1. **Without Repeat Daily**:
   - Single notification at scheduled time ✅
   - No more notifications after that ✅

2. **With Repeat Daily**:
   - First notification at scheduled time ✅
   - Next day same time - notification again ✅
   - Every day - notification repeats ✅
   - Stops only when:
     - User deletes alert ✅
     - User marks alert as inactive ✅
     - User unchecks repeat daily ✅

## 🎯 Summary

**Problem**: Backend me cron job ya rescheduling logic missing hai

**Solution**: Backend me cron job add karo jo har minute check kare aur `repeatDaily: true` wale alerts ke liye notification bheje

**Files to Update**:
1. `cronJobs.js` (new file)
2. `server.js` (add cron initialization)
3. `routes/alert.js` (update schedule-notification endpoint)
4. `package.json` (add node-cron dependency)

**Test Kaise Karein**: 
- Set alert 2 minutes future me with repeat daily
- Check logs har minute
- Verify notification aaya time pe
- Next day same time check karo

---

**Note**: Ye fix BACKEND me karna hai. React Native app me koi change nahi chahiye! 📱
