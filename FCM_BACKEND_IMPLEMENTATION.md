# Backend Implementation for FCM Notifications

## Node.js + Firebase Admin SDK

### 1. Setup Firebase Admin

```javascript
// firebase-admin-config.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
```

### 2. FCM Token Registration Endpoint

```javascript
// routes/fcm.js
const express = require('express');
const router = express.Router();
const db = require('../database'); // Your DB connection

// Register FCM token
router.post('/api/fcm/register', async (req, res) => {
  try {
    const { userId, fcmToken, deviceType } = req.body;
    
    // Save token to database
    await db.query(
      `INSERT INTO fcm_tokens (user_id, token, device_type, created_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, updated_at = NOW()`,
      [userId, fcmToken, deviceType]
    );
    
    res.json({ success: true, message: 'Token registered' });
  } catch (error) {
    console.error('FCM registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### 3. Schedule Reminder Endpoint

```javascript
// routes/reminders.js
const express = require('express');
const router = express.Router();
const admin = require('../firebase-admin-config');
const db = require('../database');
const schedule = require('node-schedule'); // For scheduling

// Schedule FCM reminder
router.post('/api/reminders/schedule-fcm', async (req, res) => {
  try {
    const {
      reminderId,
      userId,
      clientName,
      message,
      scheduledDate,
      enquiryId,
      notification,
      data,
    } = req.body;
    
    // Save reminder to database
    const result = await db.query(
      `INSERT INTO scheduled_reminders 
       (id, user_id, client_name, message, scheduled_date, enquiry_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [reminderId, userId, clientName, message, scheduledDate, enquiryId]
    );
    
    // Schedule the notification
    const scheduledTime = new Date(scheduledDate);
    const job = schedule.scheduleJob(scheduledTime, async () => {
      await sendFCMNotification(userId, notification, data);
      
      // Update status to sent
      await db.query(
        'UPDATE scheduled_reminders SET status = $1 WHERE id = $2',
        ['sent', reminderId]
      );
    });
    
    console.log(`✅ Reminder scheduled for ${scheduledTime.toISOString()}`);
    
    res.json({
      success: true,
      message: 'Reminder scheduled successfully',
      reminder: result.rows[0],
      scheduledFor: scheduledDate,
    });
  } catch (error) {
    console.error('Schedule reminder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to send FCM
async function sendFCMNotification(userId, notification, data) {
  try {
    // Get user's FCM token from database
    const result = await db.query(
      'SELECT token FROM fcm_tokens WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.warn(`No FCM token found for user ${userId}`);
      return;
    }
    
    const token = result.rows[0].token;
    
    // Send FCM notification
    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'enquiry_reminders',
          sound: 'default',
          priority: 'max',
        },
      },
    };
    
    const response = await admin.messaging().send(message);
    console.log('✅ FCM notification sent:', response);
    
  } catch (error) {
    console.error('❌ FCM send error:', error);
  }
}

// Cancel reminder
router.delete('/api/reminders/cancel-fcm/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;
    
    await db.query(
      'UPDATE scheduled_reminders SET status = $1 WHERE id = $2',
      ['cancelled', reminderId]
    );
    
    // Cancel node-schedule job (you'll need to track jobs)
    
    res.json({ success: true, message: 'Reminder cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get scheduled reminders
router.get('/api/reminders/scheduled/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await db.query(
      `SELECT * FROM scheduled_reminders 
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY scheduled_date ASC`,
      [userId]
    );
    
    res.json({ success: true, reminders: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### 4. Database Schema

```sql
-- FCM Tokens table
CREATE TABLE fcm_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  token TEXT NOT NULL,
  device_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled Reminders table
CREATE TABLE scheduled_reminders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  message TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  enquiry_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_scheduled_reminders_user ON scheduled_reminders(user_id);
CREATE INDEX idx_scheduled_reminders_date ON scheduled_reminders(scheduled_date);
```

### 5. Alert Scheduling (Similar)

```javascript
// routes/alerts.js
router.post('/api/alerts/schedule-fcm', async (req, res) => {
  try {
    const {
      alertId,
      userId,
      date,
      time,
      reason,
      repeatDaily,
      scheduledTimestamp,
      notification,
      data,
    } = req.body;
    
    // Save alert
    await db.query(
      `INSERT INTO scheduled_alerts 
       (id, user_id, date, time, reason, repeat_daily, scheduled_timestamp, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [alertId, userId, date, time, reason, repeatDaily, new Date(scheduledTimestamp)]
    );
    
    // Schedule job
    const scheduledTime = new Date(scheduledTimestamp);
    
    if (repeatDaily) {
      // Daily repeat
      schedule.scheduleJob({ hour: scheduledTime.getHours(), minute: scheduledTime.getMinutes() }, 
        async () => {
          await sendFCMNotification(userId, notification, data);
        }
      );
    } else {
      // One-time
      schedule.scheduleJob(scheduledTime, async () => {
        await sendFCMNotification(userId, notification, data);
        await db.query(
          'UPDATE scheduled_alerts SET status = $1 WHERE id = $2',
          ['sent', alertId]
        );
      });
    }
    
    res.json({ success: true, scheduledFor: scheduledTime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

## Python + Flask Alternative

```python
# app.py
from flask import Flask, request, jsonify
from firebase_admin import credentials, messaging, initialize_app
import psycopg2
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
initialize_app(cred)

app = Flask(__name__)
scheduler = BackgroundScheduler()
scheduler.start()

# Schedule reminder
@app.route('/api/reminders/schedule-fcm', methods=['POST'])
def schedule_reminder():
    data = request.json
    
    # Save to database
    # ... database code ...
    
    # Schedule FCM
    scheduled_time = datetime.fromisoformat(data['scheduledDate'])
    scheduler.add_job(
        send_fcm_notification,
        'date',
        run_date=scheduled_time,
        args=[data['userId'], data['notification'], data['data']]
    )
    
    return jsonify({'success': True})

def send_fcm_notification(user_id, notification, data):
    # Get FCM token from database
    token = get_user_fcm_token(user_id)
    
    message = messaging.Message(
        notification=messaging.Notification(
            title=notification['title'],
            body=notification['body']
        ),
        data=data,
        token=token,
        android=messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                channel_id='enquiry_reminders',
                sound='default'
            )
        )
    )
    
    messaging.send(message)
```

## Environment Variables

```env
# .env file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Testing

```bash
# Test FCM token registration
curl -X POST http://localhost:3000/api/fcm/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "fcmToken": "fcm-token-here",
    "deviceType": "android"
  }'

# Test reminder scheduling
curl -X POST http://localhost:3000/api/reminders/schedule-fcm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "reminderId": "reminder_123",
    "userId": "user123",
    "clientName": "John Doe",
    "message": "Follow up call",
    "scheduledDate": "2026-01-08T15:30:00.000Z",
    "enquiryId": "enq_123",
    "notification": {
      "title": "Reminder: John Doe",
      "body": "Follow up call"
    },
    "data": {
      "type": "reminder",
      "enquiryId": "enq_123"
    }
  }'
```
