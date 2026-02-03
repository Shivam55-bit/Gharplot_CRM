import Reminder from "../models/reminderSchema.js";
import Employee from "../models/employeeSchema.js";

// Get all reminders for a specific employee (Admin view)
export const getEmployeeReminders = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, assignmentType, page = 1, limit = 20 } = req.query;

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const filter = { employeeId };
    
    if (status) filter.status = status;
    if (assignmentType) filter.assignmentType = assignmentType;

    const skip = (page - 1) * limit;

    const reminders = await Reminder.find(filter)
      .sort({ reminderDateTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reminder.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reminders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error fetching employee reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee reminders",
      error: error.message
    });
  }
};

// Get due reminders for a specific employee (Admin view)
export const getEmployeeDueReminders = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const dueReminders = await Reminder.getDueReminders(employeeId);

    res.status(200).json({
      success: true,
      count: dueReminders.length,
      data: dueReminders
    });

  } catch (error) {
    console.error("Error fetching due reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch due reminders",
      error: error.message
    });
  }
};

// Get due reminders for all employees with popup enabled (Admin popup)
export const getAllDueRemindersForAdmin = async (req, res) => {
  try {
    const adminId = req.user.id || req.user._id;

    // Get all employees with adminReminderPopupEnabled = true
    const employeesWithPopup = await Employee.find({
      adminReminderPopupEnabled: true,
      isActive: true
    }).select('_id name email department');

    if (employeesWithPopup.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No employees have admin reminder popup enabled",
        data: [],
        count: 0
      });
    }

    const employeeIds = employeesWithPopup.map(emp => emp._id);

    // Get due reminders for all these employees
    const now = new Date();
    
    const dueReminders = await Reminder.find({
      employeeId: { $in: employeeIds },
      isActive: true,
      status: { $nin: ['completed', 'dismissed'] },
      $or: [
        {
          status: 'pending',
          reminderDateTime: { $lte: now }
        },
        {
          status: 'snoozed',
          snoozedUntil: { $lte: now }
        },
        {
          isRepeating: true,
          nextTrigger: { $lte: now }
        }
      ]
    })
    .populate('employeeId', 'name email phone department')
    .sort({ reminderDateTime: 1 });

    // Group reminders by employee
    const remindersByEmployee = {};
    dueReminders.forEach(reminder => {
      const empId = reminder.employeeId._id.toString();
      if (!remindersByEmployee[empId]) {
        remindersByEmployee[empId] = {
          employee: reminder.employeeId,
          reminders: []
        };
      }
      remindersByEmployee[empId].reminders.push(reminder);
    });

    res.status(200).json({
      success: true,
      count: dueReminders.length,
      totalEmployees: Object.keys(remindersByEmployee).length,
      data: Object.values(remindersByEmployee)
    });

  } catch (error) {
    console.error("Error fetching admin due reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin due reminders",
      error: error.message
    });
  }
};

// Toggle admin reminder popup for an employee
export const toggleEmployeeReminderPopup = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "enabled field must be a boolean value"
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    employee.adminReminderPopupEnabled = enabled;
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Admin reminder popup ${enabled ? 'enabled' : 'disabled'} for employee`,
      data: {
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,
        adminReminderPopupEnabled: employee.adminReminderPopupEnabled
      }
    });

  } catch (error) {
    console.error("Error toggling reminder popup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle reminder popup",
      error: error.message
    });
  }
};

// Get all employees with their reminder popup status
export const getAllEmployeesReminderStatus = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const employees = await Employee.find(query)
      .select('name email phone department adminReminderPopupEnabled isActive')
      .populate('role', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Employee.countDocuments(query);

    // Get reminder counts for each employee
    const employeesWithCounts = await Promise.all(
      employees.map(async (employee) => {
        const reminderCount = await Reminder.countDocuments({
          employeeId: employee._id,
          status: 'pending',
          isActive: true
        });

        const dueReminderCount = await Reminder.countDocuments({
          employeeId: employee._id,
          status: 'pending',
          isActive: true,
          reminderDateTime: { $lte: new Date() }
        });

        return {
          ...employee.toObject(),
          reminderStats: {
            totalPending: reminderCount,
            currentlyDue: dueReminderCount
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: employeesWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error fetching employees reminder status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees reminder status",
      error: error.message
    });
  }
};

// Get reminder statistics for admin dashboard
export const getAdminReminderStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const employeesWithPopupEnabled = await Employee.countDocuments({
      isActive: true,
      adminReminderPopupEnabled: true
    });

    const totalReminders = await Reminder.countDocuments({ isActive: true });
    const pendingReminders = await Reminder.countDocuments({
      isActive: true,
      status: 'pending'
    });
    const completedReminders = await Reminder.countDocuments({
      status: 'completed'
    });

    const now = new Date();
    const dueReminders = await Reminder.countDocuments({
      isActive: true,
      status: 'pending',
      reminderDateTime: { $lte: now }
    });

    // Get reminders by status
    const remindersByStatus = await Reminder.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Get top 5 employees with most reminders
    const topEmployees = await Reminder.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$employeeId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $project: {
          employeeId: "$_id",
          name: "$employee.name",
          email: "$employee.email",
          reminderCount: "$count"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          withPopupEnabled: employeesWithPopupEnabled
        },
        reminders: {
          total: totalReminders,
          pending: pendingReminders,
          completed: completedReminders,
          currentlyDue: dueReminders,
          byStatus: remindersByStatus
        },
        topEmployees
      }
    });

  } catch (error) {
    console.error("Error fetching admin reminder stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin reminder statistics",
      error: error.message
    });
  }
};
