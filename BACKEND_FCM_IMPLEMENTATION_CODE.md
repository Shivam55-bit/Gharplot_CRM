# Backend Implementation - Ready-to-Use Code

## Copy-Paste Ready Code for Backend

### 1. Initialize Firebase Admin SDK (app.js or server setup)

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project.firebaseio.com"
});

console.log('✅ Firebase Admin SDK initialized');

// Export for use in other files
module.exports = admin;
```

### 2. Register Admin FCM Token - Endpoint

```javascript
// routes/adminRoutes.js or controller/adminController.js

const admin = require('firebase-admin');
const Admin = require('../models/Admin'); // Your Mongoose model

/**
 * Register/Update admin's FCM token for push notifications
 * POST /api/admin/register-fcm-token
 */
exports.registerFCMToken = async (req, res) => {
  try {
    const { adminId, fcmToken, platform, deviceName } = req.body;

    // Validate input
    if (!adminId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'adminId and fcmToken are required'
      });
    }

    console.log('📱 Registering FCM token:', {
      adminId,
      platform,
      deviceName,
      token: fcmToken.substring(0, 20) + '...'
    });

    // Update admin with FCM token
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        $set: {
          fcmToken: fcmToken,
          fcmTokens: {
            ...admin?.fcmTokens,
            [platform]: fcmToken
          },
          fcmTokenUpdatedAt: new Date(),
          deviceName: deviceName,
          lastActiveAt: new Date()
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    console.log('✅ FCM token registered successfully for admin:', adminId);

    res.json({
      success: true,
      message: 'FCM token registered successfully',
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        fcmTokenRegistered: true
      }
    });
  } catch (error) {
    console.error('❌ Error registering FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register FCM token',
      error: error.message
    });
  }
};

// Add this route to your Express app:
// app.post('/api/admin/register-fcm-token', authenticateAdmin, registerFCMToken);
```

### 3. FCM Notification Service

```javascript
// services/fcmService.js

const admin = require('firebase-admin');

/**
 * Send FCM notification to admin
 * @param {string} adminId - Admin MongoDB ID
 * @param {Object} notificationData - Notification details
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendNotificationToAdmin(adminId, notificationData) {
  try {
    const Admin = require('../models/Admin');
    const { title, body, data = {} } = notificationData;

    // Get admin's FCM token
    const admin = await Admin.findById(adminId);
    
    if (!admin || !admin.fcmToken) {
      console.warn(`⚠️ Admin ${adminId} has no FCM token registered`);
      return {
        success: false,
        error: 'No FCM token found for admin'
      };
    }

    console.log(`📤 Sending FCM notification to admin ${adminId}...`);

    // Build FCM message
    const message = {
      notification: {
        title,
        body,
        imageUrl: 'https://example.com/notification-icon.png' // Optional
      },
      data: {
        ...data,
        sentAt: new Date().toISOString(),
        adminId: adminId.toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        },
        ttl: 86400 // 24 hours
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            sound: 'default',
            badge: 1,
            mutableContent: true,
            contentAvailable: true,
            priority: 'high'
          }
        },
        headers: {
          'apns-priority': '10'
        }
      },
      webpush: {
        headers: {
          urgency: 'high'
        },
        notification: {
          title,
          body,
          icon: 'https://example.com/icon.png'
        }
      }
    };

    // Send notification
    const response = await admin.messaging().send(message, admin.fcmToken);
    
    console.log(`✅ FCM notification sent successfully:`, response);

    // Optional: Log notification in database
    const Notification = require('../models/Notification');
    await Notification.create({
      adminId,
      title,
      body,
      data,
      messageId: response,
      sentAt: new Date(),
      status: 'sent'
    });

    return {
      success: true,
      messageId: response
    };
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);

    // Handle specific error cases
    if (error.code === 'messaging/invalid-registration-token') {
      console.error('Invalid FCM token - should be refreshed');
      const Admin = require('../models/Admin');
      await Admin.findByIdAndUpdate(adminId, { fcmToken: null });
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send FCM notification to multiple admins
 */
async function sendNotificationToMultiple(adminIds, notificationData) {
  try {
    const results = await Promise.all(
      adminIds.map(adminId => sendNotificationToAdmin(adminId, notificationData))
    );
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Sent notification to ${successful}/${adminIds.length} admins`);
    
    return { success: true, successful, total: adminIds.length };
  } catch (error) {
    console.error('❌ Error sending bulk notifications:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotificationToAdmin,
  sendNotificationToMultiple
};
```

### 4. Modify Reminder Creation Endpoint

```javascript
// In your reminder creation route (e.g., POST /api/reminder/create)

const { sendNotificationToAdmin } = require('../services/fcmService');

exports.createReminder = async (req, res) => {
  try {
    const { title, clientName, reminderDateTime, notes } = req.body;
    const employeeId = req.user.id; // From auth middleware

    // Create reminder
    const reminder = await Reminder.create({
      title,
      clientName,
      reminderDateTime,
      notes,
      employeeId,
      status: 'pending',
      createdAt: new Date()
    });

    console.log('✅ Reminder created:', reminder._id);

    // 🆕 Send FCM notification to admin
    try {
      const admin = await Admin.findOne({ role: 'admin' });
      
      if (admin) {
        const employee = await Employee.findById(employeeId);
        
        const notificationResult = await sendNotificationToAdmin(
          admin._id,
          {
            title: `🔔 New Reminder - ${employee?.name || 'Employee'}`,
            body: `Reminder: ${title}\nClient: ${clientName}\n⏰ ${new Date(reminderDateTime).toLocaleString('en-IN')}`,
            data: {
              type: 'reminder',
              reminderId: reminder._id.toString(),
              employeeId: employeeId.toString(),
              employeeName: employee?.name || 'Employee',
              reminderTitle: title,
              clientName: clientName,
              scheduledTime: reminderDateTime,
              action: 'view_reminder'
            }
          }
        );

        if (!notificationResult.success) {
          console.warn('⚠️ Failed to send notification but reminder was created');
          // Don't fail the reminder creation if notification fails
        }
      }
    } catch (notificationError) {
      console.error('⚠️ Error sending notification:', notificationError);
      // Don't fail the request - notification is non-critical
    }

    // Return reminder to client
    res.json({
      success: true,
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    console.error('❌ Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reminder',
      error: error.message
    });
  }
};
```

### 5. Add Route to Express App

```javascript
// In your Express app setup (e.g., app.js or server.js)

const adminController = require('./controllers/adminController');
const authenticate = require('./middleware/authenticate');

// Register FCM token endpoint
app.post('/api/admin/register-fcm-token', authenticate, adminController.registerFCMToken);

// Existing reminder creation endpoint (modify to send FCM)
// app.post('/api/reminder/create', authenticate, reminderController.createReminder);
```

### 6. Optional: Test FCM Notification Endpoint

```javascript
// Add this for manual testing

exports.sendTestNotification = async (req, res) => {
  try {
    const { adminId } = req.body;
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'adminId is required'
      });
    }

    const { sendNotificationToAdmin } = require('../services/fcmService');
    
    const result = await sendNotificationToAdmin(adminId, {
      title: '🧪 Test Notification',
      body: 'This is a test FCM notification',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Route:
// app.post('/api/admin/test-notification', sendTestNotification);
```

---

## 📦 Required Packages

```bash
npm install firebase-admin
npm install mongoose # For database
```

## 🔧 Environment Variables

```env
# .env file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email@firebase.com

# Or just set path to service account:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## ✅ Checklist

- [ ] Copy fcmService.js to your services folder
- [ ] Add registerFCMToken endpoint to admin routes
- [ ] Modify reminder creation to call sendNotificationToAdmin()
- [ ] Add route to Express app
- [ ] Test with Postman (register token, then create reminder)
- [ ] Check admin device receives notification
- [ ] Check backend console logs

## 🧪 Testing

```bash
# Test registering FCM token
curl -X POST http://localhost:3000/api/admin/register-fcm-token \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "fcmToken": "device_token_from_firebase",
    "platform": "android"
  }'

# Test sending notification (if you added test endpoint)
curl -X POST http://localhost:3000/api/admin/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "64a1b2c3d4e5f6g7h8i9j0k1"
  }'
```

That's it! Just integrate these code snippets into your backend and notifications will work. 🎉
