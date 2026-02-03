import Reminder from "../models/reminderSchema.js";
import LeadAssignment from "../models/leadAssignmentSchema.js";
import UserLeadAssignment from "../models/userLeadAssignmentSchema.js";
import ManualInquiry from "../models/manualInquirySchema.js";
import Employee from "../models/employeeSchema.js";
import Notification from "../models/notificationModel.js";
import { sendAdminReminderNotification } from "../utils/fcmNotificationService.js";

// Create a new reminder
export const createReminder = async (req, res) => {
  try {
    const { 
      assignmentId, 
      assignmentType, 
      enquiryId,
      manualInquiryId, // New field for manual inquiry
      title, 
      comment,
      note, // Support both 'comment' and 'note' fields
      reminderDateTime, 
      isRepeating, 
      repeatType,
      // Client information fields
      clientName,
      phone,
      email,
      location
    } = req.body;
    const employeeId = req.user.id || req.user._id;

    console.log('Creating reminder:', { assignmentId, assignmentType, enquiryId, manualInquiryId, title, reminderDateTime, employeeId, clientName });

    let finalAssignmentId = assignmentId;
    let finalAssignmentType = assignmentType;
    let finalManualInquiryId = manualInquiryId;

    // If manualInquiryId is provided, validate it exists
    if (manualInquiryId) {
      const manualInquiry = await ManualInquiry.findById(manualInquiryId);
      if (!manualInquiry) {
        return res.status(404).json({
          success: false,
          message: "Manual inquiry not found"
        });
      }
      finalManualInquiryId = manualInquiryId;
      finalAssignmentType = 'ManualInquiry';
      console.log('Manual inquiry found:', { manualInquiryId, clientName: manualInquiry.clientName });
    }

    // If enquiryId is provided instead of assignmentId, find the assignment for this employee
    if (enquiryId && !assignmentId && !manualInquiryId) {
      const assignment = await LeadAssignment.findOne({
        enquiryId: enquiryId,
        employeeId: employeeId
      });

      if (assignment) {
        finalAssignmentId = assignment._id;
        finalAssignmentType = 'LeadAssignment';
        console.log('Found assignment:', { assignmentId: finalAssignmentId, enquiryId });
      } else {
        // If no assignment found, create a reminder without assignment reference
        console.log('No assignment found for enquiryId, creating standalone reminder');
        finalAssignmentId = null;
        finalAssignmentType = null;
      }
    }

    // Validate assignment exists and belongs to employee (if assignment is required)
    if (finalAssignmentId) {
      let assignment;
      if (finalAssignmentType === 'LeadAssignment') {
        assignment = await LeadAssignment.findById(finalAssignmentId);
      } else if (finalAssignmentType === 'UserLeadAssignment') {
        assignment = await UserLeadAssignment.findById(finalAssignmentId);
      }

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found"
        });
      }

      if (assignment.employeeId.toString() !== employeeId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to create reminder for this assignment"
        });
      }
    }

    // Use note if comment is not provided
    const finalComment = comment || note || '';
    const finalTitle = title || 'Reminder';

    // Create reminder
    const reminder = new Reminder({
      assignmentId: finalAssignmentId,
      assignmentType: finalAssignmentType,
      manualInquiryId: finalManualInquiryId, // Add manual inquiry reference
      employeeId,
      title: finalTitle.trim ? finalTitle.trim() : finalTitle,
      comment: finalComment, // Don't trim HTML content
      reminderDateTime: new Date(reminderDateTime),
      isRepeating: isRepeating || false,
      repeatType: repeatType || 'daily',
      // Store client information for display in popup
      clientName: clientName?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      location: location?.trim()
    });

    // Calculate next trigger for repeating reminders
    if (reminder.isRepeating) {
      reminder.calculateNextTrigger();
    }

    await reminder.save();

    // ✅ Check if admin notification is enabled for this employee
    const employee = await Employee.findById(employeeId).select('name email adminReminderPopupEnabled');
    if (employee && employee.adminReminderPopupEnabled === true) {
      console.log(`📢 Admin notification enabled for employee: ${employee.name}`);
      
      // Create admin notification immediately
      const adminNotification = new Notification({
        title: `🔔 New Reminder Set - ${employee.name}`,
        message: `${employee.name} has set a reminder: ${reminder.title || "Untitled reminder"}`,
        type: 'admin_reminder',
        priority: 'high',
        metadata: {
          reminderId: reminder._id,
          employeeId: employee._id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          reminderTitle: reminder.title,
          clientName: reminder.clientName,
          reminderTime: reminder.reminderDateTime,
          createdNow: true // Flag to indicate this is a creation notification
        },
        reminderData: {
          name: reminder.clientName,
          email: reminder.email,
          phone: reminder.phone,
          location: reminder.location,
          note: reminder.comment,
          reminderTime: reminder.reminderDateTime,
        },
        read: false,
      });

      await adminNotification.save();
      console.log(`✅ Admin notification created for new reminder ${reminder._id}`);

      // 🚀 Send FCM push notification to all admins
      const fcmResult = await sendAdminReminderNotification(
        {
          title: reminder.title,
          clientName: reminder.clientName,
          phone: reminder.phone,
          location: reminder.location,
          note: reminder.comment,
          reminderTime: reminder.reminderDateTime
        },
        {
          employeeName: employee.name,
          employeeEmail: employee.email
        }
      );

      if (fcmResult.success) {
        console.log(`✅ FCM notification sent to ${fcmResult.successCount} admin(s)`);
      } else {
        console.log(`⚠️ FCM notification failed: ${fcmResult.message}`);
      }

      // Send Socket.io notification to admin if io is available
      if (req.io) {
        req.io.emit("adminReminderNotification", {
          _id: adminNotification._id,
          title: adminNotification.title,
          message: adminNotification.message,
          type: adminNotification.type,
          priority: adminNotification.priority,
          metadata: adminNotification.metadata,
          reminderData: adminNotification.reminderData,
          createdAt: adminNotification.createdAt,
        });
        console.log(`✅ Socket.io admin notification emitted for new reminder ${reminder._id}`);
      }
    }

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder
    });

  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create reminder",
      error: error.message
    });
  }
};

// Get reminders for an employee's assignments
export const getEmployeeReminders = async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { status, assignmentType, enquiryId, manualInquiryId, page = 1, limit = 20 } = req.query;

    const filter = { employeeId };
    
    if (status) filter.status = status;
    if (assignmentType) filter.assignmentType = assignmentType;
    
    // Filter by manualInquiryId if provided
    if (manualInquiryId) {
      filter.manualInquiryId = manualInquiryId;
    }
    
    // Filter by enquiryId if provided
    if (enquiryId) {
      // Find assignments with this enquiryId
      const leadAssignments = await LeadAssignment.find({ inquiryId: enquiryId }).select('_id');
      const userLeadAssignments = await UserLeadAssignment.find({ inquiryId: enquiryId }).select('_id');
      
      const assignmentIds = [
        ...leadAssignments.map(a => a._id),
        ...userLeadAssignments.map(a => a._id)
      ];
      
      if (assignmentIds.length > 0) {
        filter.assignmentId = { $in: assignmentIds };
      } else {
        // No assignments found for this enquiryId, return empty result
        return res.status(200).json({
          success: true,
          data: {
            reminders: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              total: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        });
      }
    }

    const skip = (page - 1) * limit;

    const reminders = await Reminder.find(filter)
      .populate({
        path: 'employeeId',
        select: 'name email'
      })
      .populate({
        path: 'editHistory.editedBy',
        select: 'name email'
      })
      .sort({ reminderDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually populate assignmentId only for reminders that have valid assignmentType (not 'Lead')
    for (const reminder of reminders) {
      // Populate manual inquiry if present
      if (reminder.manualInquiryId) {
        try {
          await reminder.populate({
            path: 'manualInquiryId',
            select: 'clientName contactNumber location s_No ClientCode ProjectCode productType caseStatus address source majorComments'
          });
        } catch (error) {
          console.warn(`Failed to populate manual inquiry for reminder ${reminder._id}:`, error.message);
        }
      }
      
      if (reminder.assignmentId && reminder.assignmentType && reminder.assignmentType !== 'Lead') {
        try {
          await reminder.populate({
            path: 'assignmentId',
            select: 'userId inquiryId createdAt status'
          });
        } catch (error) {
          console.warn(`Failed to populate assignment for reminder ${reminder._id}:`, error.message);
          // Continue without population
        }
      }
    }

    const total = await Reminder.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        reminders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error getting employee reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reminders",
      error: error.message
    });
  }
};

// Get reminders by employee ID (Admin or internal use)
export const getRemindersByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    const reminders = await Reminder.find({ employeeId })
      .populate({
        path: "employeeId",
        select: "name email"
      })
      .populate({
        path: "manualInquiryId",
        select: "clientName contactNumber location caseStatus"
      })
      .sort({ reminderDateTime: 1 });

    return res.status(200).json({
      success: true,
      message: "Reminders fetched successfully",
      count: reminders.length,
      data: reminders
    });

  } catch (error) {
    console.error("Error fetching reminders by employeeId:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reminders",
      error: error.message
    });
  }
};


// Get due reminders for popup notifications
export const getDueReminders = async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    
    const dueReminders = await Reminder.getDueReminders(employeeId);
    
    console.log(`📋 Found ${dueReminders.length} due reminders for employee ${employeeId}`);
    dueReminders.forEach(reminder => {
      console.log(`  - Reminder ${reminder._id}: Status=${reminder.status}, Title="${reminder.title}", Comment="${reminder.comment ? reminder.comment.substring(0, 100) : 'No comment'}"`);
      console.log(`    Available fields:`, Object.keys(reminder.toObject()));
    });
    
    res.status(200).json({
      success: true,
      data: dueReminders,
      count: dueReminders.length
    });

  } catch (error) {
    console.error("Error getting due reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get due reminders",
      error: error.message
    });
  }
};

// Complete a reminder
export const completeReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { response } = req.body;
    const employeeId = req.user.id || req.user._id;

    const reminder = await Reminder.findById(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    if (reminder.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this reminder"
      });
    }

    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Response is required to complete reminder"
      });
    }

    console.log(`🔄 Completing reminder ${reminderId} with current status: ${reminder.status}, isRepeating: ${reminder.isRepeating}`);

    // Complete the reminder
    await reminder.completeReminder(response.trim());

    console.log(`✅ Reminder completed. New status: ${reminder.status}, isRepeating: ${reminder.isRepeating}`);

    // Add notification record
    reminder.notifications.push({
      triggeredAt: new Date(),
      acknowledged: true,
      acknowledgedAt: new Date(),
      action: 'completed'
    });

    await reminder.save();

    res.status(200).json({
      success: true,
      message: "Reminder completed successfully",
      data: {
        reminder,
        responseColor: reminder.responseColor,
        wordCount: reminder.responseWordCount
      }
    });

  } catch (error) {
    console.error("Error completing reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete reminder",
      error: error.message
    });
  }
};

// Snooze a reminder
export const snoozeReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { snoozeMinutes = 15 } = req.body;
    const employeeId = req.user.id || req.user._id;

    const reminder = await Reminder.findById(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    if (reminder.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to snooze this reminder"
      });
    }

    await reminder.snoozeReminder(parseInt(snoozeMinutes));

    // Add notification record
    reminder.notifications.push({
      triggeredAt: new Date(),
      acknowledged: true,
      acknowledgedAt: new Date(),
      action: 'snoozed'
    });

    await reminder.save();

    res.status(200).json({
      success: true,
      message: `Reminder snoozed for ${snoozeMinutes} minutes`,
      data: reminder
    });

  } catch (error) {
    console.error("Error snoozing reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to snooze reminder",
      error: error.message
    });
  }
};

// Dismiss a reminder
export const dismissReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const employeeId = req.user.id || req.user._id;

    const reminder = await Reminder.findById(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    if (reminder.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to dismiss this reminder"
      });
    }

    await reminder.dismissReminder();

    // Add notification record
    reminder.notifications.push({
      triggeredAt: new Date(),
      acknowledged: true,
      acknowledgedAt: new Date(),
      action: 'dismissed'
    });

    await reminder.save();

    res.status(200).json({
      success: true,
      message: "Reminder dismissed successfully",
      data: reminder
    });

  } catch (error) {
    console.error("Error dismissing reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dismiss reminder",
      error: error.message
    });
  }
};

// Update reminder settings (toggle repeat, change time, etc.)
export const updateReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { title, comment, reminderDateTime, isRepeating, repeatType, isActive } = req.body;
    const employeeId = req.user.id || req.user._id;

    const reminder = await Reminder.findById(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    if (reminder.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this reminder"
      });
    }

    // Store old values for edit history
    const oldContent = {
      title: reminder.title,
      comment: reminder.comment,
      reminderDateTime: reminder.reminderDateTime
    };

    // Track if any content changed
    let contentChanged = false;

    // Update fields
    if (title !== undefined && title.trim() !== reminder.title) {
      reminder.title = title.trim();
      contentChanged = true;
    }
    if (comment !== undefined && comment !== reminder.comment) {
      reminder.comment = comment;
      contentChanged = true;
    }
    if (reminderDateTime !== undefined && new Date(reminderDateTime).getTime() !== reminder.reminderDateTime.getTime()) {
      reminder.reminderDateTime = new Date(reminderDateTime);
      contentChanged = true;
    }
    if (isRepeating !== undefined) reminder.isRepeating = isRepeating;
    if (repeatType !== undefined) reminder.repeatType = repeatType;
    if (isActive !== undefined) reminder.isActive = isActive;

    // Add to edit history if content changed
    if (contentChanged) {
      if (!reminder.editHistory) {
        reminder.editHistory = [];
      }
      reminder.editHistory.push({
        oldContent: oldContent,
        newContent: {
          title: reminder.title,
          comment: reminder.comment,
          reminderDateTime: reminder.reminderDateTime
        },
        editedAt: new Date(),
        editedBy: employeeId
      });
    }

    // Recalculate next trigger if needed
    if (reminder.isRepeating && reminder.isActive) {
      reminder.calculateNextTrigger();
    } else {
      reminder.nextTrigger = null;
    }

    await reminder.save();

    res.status(200).json({
      success: true,
      message: "Reminder updated successfully",
      data: reminder
    });

  } catch (error) {
    console.error("Error updating reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update reminder",
      error: error.message
    });
  }
};

// Delete a reminder
export const deleteReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const employeeId = req.user.id || req.user._id;

    const reminder = await Reminder.findById(reminderId);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found"
      });
    }

    if (reminder.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this reminder"
      });
    }

    await Reminder.findByIdAndDelete(reminderId);

    res.status(200).json({
      success: true,
      message: "Reminder deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete reminder",
      error: error.message
    });
  }
};

// Get reminder statistics for employee
export const getReminderStats = async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    
    const stats = await Reminder.aggregate([
      { $match: { employeeId: employeeId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const dueCount = await Reminder.countDocuments({
      employeeId,
      isActive: true,
      $or: [
        { status: 'pending', reminderDateTime: { $lte: new Date() } },
        { status: 'snoozed', snoozedUntil: { $lte: new Date() } }
      ]
    });

    const formattedStats = {
      total: 0,
      pending: 0,
      completed: 0,
      snoozed: 0,
      dismissed: 0,
      due: dueCount
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error("Error getting reminder stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reminder statistics",
      error: error.message
    });
  }
};

// Create reminder directly from lead data (simplified endpoint)
export const createReminderFromLead = async (req, res) => {
  try {
    const { 
      name,
      email,
      phone,
      location,
      reminderTime,
      note,
      manualInquiryId // Support manual inquiry ID
    } = req.body;
    const employeeId = req.user.id || req.user._id;

    console.log('Creating reminder from lead:', { name, email, phone, reminderTime, employeeId, manualInquiryId });

    // Validate required fields
    if (!reminderTime) {
      return res.status(400).json({
        success: false,
        message: "Reminder time is required"
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Client name is required"
      });
    }

    // Validate manual inquiry if provided
    let finalManualInquiryId = null;
    let assignmentType = 'Lead';
    
    if (manualInquiryId) {
      const manualInquiry = await ManualInquiry.findById(manualInquiryId);
      if (!manualInquiry) {
        return res.status(404).json({
          success: false,
          message: "Manual inquiry not found"
        });
      }
      finalManualInquiryId = manualInquiryId;
      assignmentType = 'ManualInquiry';
      console.log('Manual inquiry linked to reminder:', { manualInquiryId, clientName: manualInquiry.clientName });
    }

    // Create reminder without assignment (standalone reminder or with manual inquiry)
    const reminder = new Reminder({
      employeeId,
      title: `Follow up with ${name}`,
      comment: note || `Reminder to follow up with ${name}`,
      note: note || '',
      reminderDateTime: new Date(reminderTime),
      isRepeating: false,
      // Store client information for display
      clientName: name?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      location: location?.trim(),
      // Manual inquiry reference if provided
      manualInquiryId: finalManualInquiryId,
      assignmentId: null,
      assignmentType: assignmentType
    });

    await reminder.save();

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder
    });

  } catch (error) {
    console.error("Error creating reminder from lead:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create reminder",
      error: error.message
    });
  }
};

// Legacy function for backward compatibility
export const getReminders = async (req, res) => {
  return getEmployeeReminders(req, res);
};

// Get reminders by manual inquiry ID
export const getRemindersByManualInquiry = async (req, res) => {
  try {
    const { manualInquiryId } = req.params;
    const employeeId = req.user.id || req.user._id;

    console.log('Getting reminders for manual inquiry:', { manualInquiryId, employeeId });

    // Validate manual inquiry exists
    const manualInquiry = await ManualInquiry.findById(manualInquiryId);
    if (!manualInquiry) {
      return res.status(404).json({
        success: false,
        message: "Manual inquiry not found"
      });
    }

    // Get all reminders for this manual inquiry
    const reminders = await Reminder.find({
      manualInquiryId,
      employeeId
    })
      .populate({
        path: 'employeeId',
        select: 'name email'
      })
      .populate({
        path: 'manualInquiryId',
        select: 'clientName contactNumber location s_No ClientCode ProjectCode productType caseStatus address source majorComments'
      })
      .populate({
        path: 'editHistory.editedBy',
        select: 'name email'
      })
      .sort({ reminderDateTime: 1 });

    res.status(200).json({
      success: true,
      message: "Reminders retrieved successfully",
      data: {
        manualInquiry,
        reminders,
        count: reminders.length
      }
    });

  } catch (error) {
    console.error("Error getting reminders by manual inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reminders",
      error: error.message
    });
  }
};

/**
 * Schedule FCM notification for reminder
 * This sends push notification at scheduled time even when app is closed
 * POST /api/reminder/schedule-notification
 */
export const scheduleReminderNotification = async (req, res) => {
  try {
    const { reminderId, scheduledTime, title, message, fcmToken, data } = req.body;
    
    // Validate required fields
    if (!reminderId || !scheduledTime || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reminderId, scheduledTime, fcmToken'
      });
    }
    
    // Calculate delay in milliseconds
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    const delayMs = scheduledDate - now;
    
    // Validate scheduled time is in future
    if (delayMs <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }
    
    console.log('📅 Scheduling reminder notification:', {
      reminderId,
      scheduledTime,
      delayMinutes: Math.round(delayMs / 60000)
    });
    
    // Use node-cron for scheduling
    const cronDate = new Date(scheduledTime);
    const cronExpression = `${cronDate.getMinutes()} ${cronDate.getHours()} ${cronDate.getDate()} ${cronDate.getMonth() + 1} *`;
    
    const cron = await import('node-cron');
    cron.default.schedule(cronExpression, async () => {
      try {
        await sendFCMNotification(fcmToken, title, message, data);
        console.log('✅ Reminder notification sent via FCM');
      } catch (error) {
        console.error('❌ Failed to send reminder notification:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });
    
    res.json({
      success: true,
      message: 'Reminder notification scheduled successfully',
      scheduledTime: scheduledDate.toISOString(),
      delayMinutes: Math.round(delayMs / 60000)
    });
    
  } catch (error) {
    console.error('❌ Error scheduling reminder notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule reminder notification',
      error: error.message
    });
  }
};

/**
 * Helper function to send FCM notification
 */
const sendFCMNotification = async (fcmToken, title, message, data) => {
  const admin = (await import('../config/firebase.js')).default;
  
  const fcmMessage = {
    token: fcmToken,
    notification: {
      title: title || 'Reminder',
      body: message || 'You have a reminder'
    },
    data: {
      ...data,
      sentAt: new Date().toISOString(),
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    android: {
      priority: 'high',
      notification: {
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
        channelId: 'reminders'
      }
    },
    apns: {
      headers: {
        'apns-priority': '10'
      },
      payload: {
        aps: {
          sound: 'default',
          alert: {
            title: title || 'Reminder',
            body: message || 'You have a reminder'
          },
          'content-available': 1
        }
      }
    }
  };
  
  const response = await admin.messaging().send(fcmMessage);
  console.log('✅ FCM notification sent:', response);
  return response;
};
