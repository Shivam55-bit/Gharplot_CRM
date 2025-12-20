import Notification from '../models/notificationModel.js';
import Employee from '../models/employeeSchema.js';

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
