# 🔄 Backend Repeat Daily Logic Update - Critical

## 🎯 New Requirement

**Repeat Daily alerts ab date ko ignore karenge aur sirf time se daily trigger honge**

### Previous Behavior ❌
- User selects date: 20 Jan 2026
- User selects time: 15:30
- With repeat daily: 20 Jan se daily 15:30 pe notification

### New Behavior ✅
- User selects time: 15:30
- With repeat daily: **Aaj se (ya kal se agar time pass ho gaya)** daily 15:30 pe notification
- Date field ignore hota hai repeat daily ke case me

## 🔧 Backend Changes Required

### 1. Update Alert Model/Schema

```javascript
const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  reason: String,
  date: String, // For one-time alerts only
  time: String, // ⚠️ CRITICAL: Used by cron for matching (HH:MM format)
  scheduledDateTime: Date, // For one-time alerts
  repeatDaily: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
```

### 2. Update Cron Job Logic

```javascript
const cron = require('node-cron');

// Run every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;
  
  console.log(`⏰ [CRON] Checking alerts at ${currentTime}`);
  
  try {
    // Find all active repeat daily alerts for current time
    const dailyAlerts = await Alert.find({
      repeatDaily: true,
      time: currentTime, // ⚠️ Only match time, not date
      isActive: true
    }).populate('userId');
    
    console.log(`📅 [CRON] Found ${dailyAlerts.length} repeat daily alerts`);
    
    // Send FCM for each alert
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
              time: alert.time,
              repeatDaily: 'true'
            },
            android: {
              priority: 'high',
            },
            apns: {
              payload: {
                aps: {
                  contentAvailable: true,
                },
              },
            },
          });
          
          console.log(`✅ [CRON] Sent daily alert: ${alert._id} to ${user.phone}`);
        } else {
          console.warn(`⚠️ [CRON] No FCM token for user: ${alert.userId}`);
        }
      } catch (sendError) {
        console.error(`❌ [CRON] Failed to send alert ${alert._id}:`, sendError);
      }
    }
  } catch (error) {
    console.error('❌ [CRON] Job error:', error);
  }
});

console.log('✅ Daily alert cron job started - running every minute');
```

### 3. Update Alert Creation Endpoint

```javascript
router.post('/api/alert/create', async (req, res) => {
  try {
    const { title, reason, date, time, repeatDaily } = req.body;
    const userId = req.user._id; // From auth middleware
    
    // For repeat daily alerts, use current date
    let finalDate = date;
    let scheduledDateTime;
    
    if (repeatDaily) {
      // Ignore provided date, use current date
      finalDate = new Date().toISOString().split('T')[0];
      console.log('🔄 Repeat daily alert - ignoring date, using current date:', finalDate);
      
      // Calculate if time has passed today
      const [hours, minutes] = time.split(':').map(Number);
      const todayAtTime = new Date();
      todayAtTime.setHours(hours, minutes, 0, 0);
      
      if (todayAtTime <= new Date()) {
        // Time already passed today, will trigger tomorrow
        scheduledDateTime = new Date();
        scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
      } else {
        // Will trigger today
        scheduledDateTime = todayAtTime;
      }
    } else {
      // One-time alert, use provided date
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
    
    const alert = new Alert({
      userId,
      title,
      reason,
      date: finalDate,
      time, // ⚠️ CRITICAL: Store time in HH:MM format for cron matching
      scheduledDateTime,
      repeatDaily: repeatDaily || false,
      isActive: true
    });
    
    await alert.save();
    
    console.log('✅ Alert created:', {
      alertId: alert._id,
      time,
      repeatDaily,
      scheduledDateTime: scheduledDateTime.toISOString()
    });
    
    res.json({
      success: true,
      message: 'Alert created successfully',
      alert: alert
    });
  } catch (error) {
    console.error('❌ Alert creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

### 4. Update Alert Update Endpoint

```javascript
router.put('/api/alert/update/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { title, reason, time, repeatDaily, isActive } = req.body;
    
    const updateData = {
      title,
      reason,
      time,
      repeatDaily,
      isActive
    };
    
    // If repeat daily changed to false, keep the scheduled date
    // If repeat daily changed to true, update to current date
    if (repeatDaily) {
      updateData.date = new Date().toISOString().split('T')[0];
      console.log('🔄 Alert updated to repeat daily - date set to current');
    }
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      updateData,
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    console.log('✅ Alert updated:', alertId);
    
    res.json({
      success: true,
      message: 'Alert updated successfully',
      alert: alert
    });
  } catch (error) {
    console.error('❌ Alert update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

## 📊 Database Considerations

### Query Optimization

Add index on time field for faster cron queries:

```javascript
alertSchema.index({ time: 1, repeatDaily: 1, isActive: 1 });
```

### Sample Data

```javascript
// One-time alert
{
  _id: "alert_001",
  userId: "user_123",
  title: "Meeting",
  reason: "Important client meeting",
  date: "2026-01-15",
  time: "14:30",
  scheduledDateTime: "2026-01-15T14:30:00.000Z",
  repeatDaily: false,
  isActive: true
}

// Repeat daily alert
{
  _id: "alert_002",
  userId: "user_123",
  title: "Daily Standup",
  reason: "Team standup meeting",
  date: "2026-01-13", // Current date when created (ignored for scheduling)
  time: "10:00", // ⚠️ USED BY CRON for matching
  scheduledDateTime: "2026-01-13T10:00:00.000Z",
  repeatDaily: true,
  isActive: true
}
```

## 🧪 Testing

### Test Case 1: Create Repeat Daily - Time Not Passed Yet
```bash
# Current time: 14:00
# Create alert for: 15:30 with repeat daily
# Expected: 
#   - First notification today at 15:30
#   - Then daily at 15:30
```

### Test Case 2: Create Repeat Daily - Time Already Passed
```bash
# Current time: 16:00
# Create alert for: 15:30 with repeat daily
# Expected:
#   - First notification tomorrow at 15:30
#   - Then daily at 15:30
```

### Test Case 3: Edit Alert - Turn ON Repeat Daily
```bash
# Existing one-time alert for Jan 20 at 15:30
# Edit: turn ON repeat daily
# Expected:
#   - Date changes to current date
#   - Starts triggering daily at 15:30 from today/tomorrow
```

### Test Case 4: Edit Alert - Turn OFF Repeat Daily
```bash
# Existing repeat daily alert at 15:30
# Edit: turn OFF repeat daily
# Expected:
#   - Stops daily notifications
#   - Becomes one-time alert
```

## 🔍 Debug Logs

Add these logs in cron job:

```javascript
console.log('========================================');
console.log(`⏰ Cron running at: ${new Date().toLocaleString()}`);
console.log(`🔍 Checking for alerts at time: ${currentTime}`);
console.log(`📋 Total active repeat daily alerts: ${await Alert.countDocuments({ repeatDaily: true, isActive: true })}`);
console.log(`✅ Matching alerts for this time: ${dailyAlerts.length}`);
console.log('========================================');
```

## ✅ Summary

1. **Frontend**: Date ignore karta hai agar repeatDaily true hai
2. **Backend Cron**: Har minute check karta hai `time` field se match karke
3. **No Date Check**: Repeat daily alerts ke liye date check nahi hota
4. **Active Until Disabled**: Jab tak user edit karke `isActive: false` na kare, daily trigger hota rahega

---

**⚠️ CRITICAL**: Bina cron job ke repeat daily kaam nahi karega!
