import Notification from '../models/notificationModel.js';
import Employee from '../models/employeeSchema.js';
import Admin from '../models/adminAuthSchema.js';
import admin from '../config/firebase.js';

// Receive bad attendant notification
export const receiveBadAttendantNotification = async (req, res) => {
  try {
    const {
      reminderId,
      employeeId,
      reminderTitle,
      clientName,
      response,
      wordCount,
      timestamp,
      severity,
      zone,
      message
    } = req.body;

    console.log('🔴 BAD ATTENDANT NOTIFICATION RECEIVED:', {
      reminderId,
      employeeId,
      reminderTitle,
      clientName,
      wordCount,
      zone
    });

    // Get employee details
    let employeeName = 'Unknown Employee';
    if (employeeId) {
      const employee = await Employee.findById(employeeId).select('name email');
      if (employee) {
        employeeName = employee.name || employee.email;
      }
    }

    // Create notification for admin
    const notification = new Notification({
      title: `🔴 BAD ATTENDANT ALERT - ${employeeName}`,
      message: message || `Employee ${employeeName} provided insufficient response (${wordCount} words) for reminder: ${reminderTitle}`,
      type: 'bad_attendant',
      priority: 'high',
      metadata: {
        reminderId,
        employeeId,
        employeeName,
        reminderTitle,
        clientName,
        response,
        wordCount,
        zone: 'RED',
        severity: 'high',
        timestamp: timestamp || new Date().toISOString()
      },
      read: false,
      createdAt: new Date()
    });

    await notification.save();

    console.log('✅ Bad attendant notification saved:', notification._id);

    res.status(201).json({
      success: true,
      message: 'Bad attendant notification recorded',
      data: notification
    });

  } catch (error) {
    console.error('❌ Error saving bad attendant notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save notification',
      error: error.message
    });
  }
};

// Get all bad attendant notifications (for admin)
export const getBadAttendantNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      unreadOnly = false 
    } = req.query;

    const query = { type: 'bad_attendant' };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Enrich notifications with full employee details
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const notificationObj = notification.toObject();
        
        // Fetch employee details if employeeId exists in metadata
        if (notificationObj.metadata?.employeeId) {
          try {
            const employee = await Employee.findById(notificationObj.metadata.employeeId)
              .select('name email phone role designation department');
            
            if (employee) {
              notificationObj.metadata.employeeDetails = {
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                role: employee.role,
                designation: employee.designation,
                department: employee.department
              };
            }
          } catch (err) {
            console.error('Error fetching employee details:', err);
          }
        }
        
        return notificationObj;
      })
    );

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications: enrichedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: parseInt(page) * parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching bad attendant notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// Get bad attendant statistics
export const getBadAttendantStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await Notification.aggregate([
      {
        $match: {
          type: 'bad_attendant',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$metadata.employeeId',
          employeeName: { $first: '$metadata.employeeName' },
          count: { $sum: 1 },
          totalWordCount: { $sum: '$metadata.wordCount' },
          avgWordCount: { $avg: '$metadata.wordCount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = await Notification.countDocuments({
      type: 'bad_attendant',
      createdAt: { $gte: startDate }
    });

    res.json({
      success: true,
      data: {
        total,
        byEmployee: stats,
        period: `Last ${days} days`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching bad attendant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get admin reminder notifications
export const getAdminReminderNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      unreadOnly = false 
    } = req.query;

    const query = { type: 'admin_reminder' };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ type: 'admin_reminder', read: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: parseInt(page) * parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin reminder notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin reminder notifications',
      error: error.message
    });
  }
};

// Mark admin reminder notification as read
export const markAdminReminderAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, type: 'admin_reminder' },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Admin reminder notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin reminder notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('❌ Error marking admin reminder notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// Mark all admin reminder notifications as read
export const markAllAdminRemindersAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { type: 'admin_reminder', read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} admin reminder notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ Error marking all admin reminder notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      error: error.message
    });
  }
};

// Receive employee reminder/alert notifications and send FCM to admin
export const receiveEmployeeNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      notificationType,
      fcmPayload,
      scheduledDate,
      scheduledTime,
      clientName,
      phone,
      email,
      enquiryId,
      reminderTitle,
      reminderNote,
      alertTitle,
      alertReason,
      repeatType,
      repeatFrequency,
      employeeId,
      employeeName
    } = req.body;

    console.log('🔔 Employee notification received:', {
      notificationType,
      title,
      employeeId,
      employeeName
    });

    // 1. Save notification to database
    const notification = new Notification({
      title,
      message,
      type: notificationType || 'employee_notification',
      priority: 'high',
      metadata: {
        scheduledDate,
        scheduledTime,
        clientName,
        phone,
        email,
        enquiryId,
        reminderTitle,
        reminderNote,
        alertTitle,
        alertReason,
        repeatType,
        repeatFrequency,
        employeeId,
        employeeName
      },
      read: false,
      createdAt: new Date()
    });

    await notification.save();
    console.log('✅ Notification saved to database:', notification._id);

    // 2. 🔥 Send FCM Push Notification to Admin
    const adminUser = await Admin.findOne({}).sort({ createdAt: 1 });
    
    if (adminUser && adminUser.fcmToken) {
      const fcmMessage = {
        token: adminUser.fcmToken,
        notification: fcmPayload?.notification || {
          title: title,
          body: message,
        },
        data: {
          type: notificationType || 'employee_notification',
          notificationId: notification._id.toString(),
          ...(fcmPayload?.data || {}),
          enquiryId: enquiryId || '',
          clientName: clientName || '',
          reminderTitle: reminderTitle || '',
          reminderNote: reminderNote || '',
          alertTitle: alertTitle || '',
          alertReason: alertReason || '',
          scheduledDate: scheduledDate || '',
          scheduledTime: scheduledTime || '',
          employeeId: employeeId || '',
          employeeName: employeeName || ''
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true
            }
          }
        }
      };

      try {
        const response = await admin.messaging().send(fcmMessage);
        console.log('✅ FCM notification sent to admin:', response);
        console.log(`📱 Admin FCM Token: ${adminUser.fcmToken.substring(0, 20)}...`);
      } catch (fcmError) {
        console.error('❌ FCM send error:', fcmError.message);
        if (fcmError.code === 'messaging/invalid-registration-token' ||
            fcmError.code === 'messaging/registration-token-not-registered') {
          console.log('⚠️ Invalid FCM token, clearing from database');
          adminUser.fcmToken = '';
          await adminUser.save();
        }
      }
    } else {
      console.log('⚠️ Admin FCM token not found in database');
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent to admin successfully',
      data: notification
    });

  } catch (error) {
    console.error('❌ Error processing employee notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};
