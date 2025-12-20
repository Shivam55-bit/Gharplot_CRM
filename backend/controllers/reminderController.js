import Reminder from "../models/reminderSchema.js";
import LeadAssignment from "../models/leadAssignmentSchema.js";
import UserLeadAssignment from "../models/userLeadAssignmentSchema.js";

// Create a new reminder
export const createReminder = async (req, res) => {
  try {
    const { 
      assignmentId, 
      assignmentType, 
      title, 
      comment, 
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

    console.log('Creating reminder:', { assignmentId, assignmentType, title, reminderDateTime, employeeId, clientName });

    // Validate assignment exists and belongs to employee
    let assignment;
    if (assignmentType === 'LeadAssignment') {
      assignment = await LeadAssignment.findById(assignmentId);
    } else if (assignmentType === 'UserLeadAssignment') {
      assignment = await UserLeadAssignment.findById(assignmentId);
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

    // Create reminder
    const reminder = new Reminder({
      assignmentId,
      assignmentType,
      employeeId,
      title: title.trim(),
      comment: comment, // Don't trim HTML content
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
    const { status, assignmentType, page = 1, limit = 20 } = req.query;

    const filter = { employeeId };
    
    if (status) filter.status = status;
    if (assignmentType) filter.assignmentType = assignmentType;

    const skip = (page - 1) * limit;

    const reminders = await Reminder.find(filter)
      .populate({
        path: 'employeeId',
        select: 'name email'
      })
      .sort({ reminderDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually populate assignmentId only for reminders that have valid assignmentType (not 'Lead')
    for (const reminder of reminders) {
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

    // Update fields
    if (title !== undefined) reminder.title = title.trim();
    if (comment !== undefined) reminder.comment = comment.trim();
    if (reminderDateTime !== undefined) reminder.reminderDateTime = new Date(reminderDateTime);
    if (isRepeating !== undefined) reminder.isRepeating = isRepeating;
    if (repeatType !== undefined) reminder.repeatType = repeatType;
    if (isActive !== undefined) reminder.isActive = isActive;

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
      note
    } = req.body;
    const employeeId = req.user.id || req.user._id;

    console.log('Creating reminder from lead:', { name, email, phone, reminderTime, employeeId });

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

    // Create reminder without assignment (standalone reminder)
    const reminder = new Reminder({
      employeeId,
      title: `Follow up with ${name}`,
      comment: note || `Reminder to follow up with ${name}`,
      reminderDateTime: new Date(reminderTime),
      isRepeating: false,
      // Store client information for display
      clientName: name?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      location: location?.trim(),
      // No assignment required for lead-based reminders
      assignmentId: null,
      assignmentType: 'Lead'
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
