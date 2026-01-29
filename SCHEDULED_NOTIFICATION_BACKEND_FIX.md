# Scheduled Notification Fix - Backend Implementation Required

## Problem
The app was using `setTimeout` to schedule notifications for reminder times, but this doesn't work when:
- App is closed
- App is backgrounded
- Device goes to sleep
- User force-kills the app

## Solution
**The backend must handle scheduling FCM notifications, not the client.**

## What Changed in Frontend
The app now calls this endpoint when a new reminder is detected:

```javascript
POST /api/reminder/schedule-notification
Headers: Authorization: Bearer {token}
Body: {
  reminderId: "reminder_id",
  scheduledTime: "2026-01-24T18:03:00Z",
  title: "⏰ Reminder Time - {employeeName}",
  message: "Time to follow up!\n\n{reminderTitle}\nClient: {clientName}"
}
```

## What Backend Must Do

### Create this endpoint in your backend:

```javascript
POST /api/reminder/schedule-notification

Purpose: Schedule a FCM notification to be sent at a specific time

Logic:
1. Get reminderId and scheduledTime from request
2. Calculate delay: scheduledTime - currentTime
3. Create a scheduled job/queue to send FCM notification after this delay
4. Store in database: reminderId, fcmToken (admin's), scheduledTime, message
5. Use a job scheduler like:
   - Bull Queue (Redis)
   - node-cron
   - Agenda
   - Firebase Cloud Scheduler
   - or custom cron job

Example (Node.js with Bull Queue):
```

```javascript
const queue = require('bull')('reminders');

app.post('/api/reminder/schedule-notification', async (req, res) => {
  try {
    const { reminderId, scheduledTime, title, message } = req.body;
    const delayMs = new Date(scheduledTime) - new Date();
    
    if (delayMs <= 0) {
      return res.status(400).json({ error: 'Scheduled time is in the past' });
    }
    
    // Add to queue with delay
    await queue.add(
      { reminderId, title, message },
      { delay: delayMs }
    );
    
    // Save to database for persistence
    await ScheduledNotification.create({
      reminderId,
      scheduledTime,
      title,
      message,
      status: 'pending'
    });
    
    res.json({ success: true, message: 'Notification scheduled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process scheduled jobs
queue.process(async (job) => {
  const { reminderId, title, message } = job.data;
  const admin = await User.findOne({ role: 'admin' });
  
  // Send FCM notification
  await sendFCMNotification({
    fcmToken: admin.fcmToken,
    title,
    message
  });
  
  // Update database
  await ScheduledNotification.updateOne(
    { reminderId },
    { status: 'sent' }
  );
});
```

## Testing

1. Open Employee Management in admin app
2. Click "Reminders" on any employee card
3. Have another user create a reminder scheduled for ~2 minutes from now
4. Admin should get:
   - ✅ Immediate alert: "🔔 New Reminder Set - {employeeName}"
   - ✅ Backend notification scheduled at the reminder time
5. At the scheduled time (even if app is closed):
   - ✅ FCM notification should arrive to admin's device

## Frontend Console Logs

When working correctly, you should see:
```
✅ Scheduled notification on backend for: 24/01/2026, 18:03:00
```

## If Backend Not Ready Yet

As a temporary workaround, the frontend still keeps the polling active while modal is open to detect when a reminder's time arrives. But this only works if admin keeps the app open.

The proper fix requires the backend endpoint implementation above.
