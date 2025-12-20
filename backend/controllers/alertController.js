import Alert from "../models/alertSchema.js";

// Create a new alert
export const createAlert = async (req, res) => {
  try {
    const { date, time, reason, repeatDaily } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    // Validate required fields
    if (!date || !time || !reason) {
      return res.status(400).json({
        success: false,
        message: "Date, time, and reason are required fields",
      });
    }

    // Create new alert
    const newAlert = new Alert({
      userId,
      date: new Date(date),
      time,
      reason,
      repeatDaily: repeatDaily || false,
    });

    await newAlert.save();

    res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: newAlert,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create alert",
      error: error.message,
    });
  }
};

// Get all alerts for a user
export const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isActive, repeatDaily, startDate, endDate } = req.query;

    // Build filter query
    const filter = { userId };

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (repeatDaily !== undefined) {
      filter.repeatDaily = repeatDaily === "true";
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const alerts = await Alert.find(filter).sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
};

// Get a single alert by ID
export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert",
      error: error.message,
    });
  }
};

// Edit/Update an alert
export const editAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, time, reason, repeatDaily, isActive } = req.body;

    // Find the alert
    const alert = await Alert.findOne({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found or unauthorized",
      });
    }

    // Update fields if provided
    if (date !== undefined) alert.date = new Date(date);
    if (time !== undefined) alert.time = time;
    if (reason !== undefined) alert.reason = reason;
    if (repeatDaily !== undefined) alert.repeatDaily = repeatDaily;
    if (isActive !== undefined) alert.isActive = isActive;

    await alert.save();

    res.status(200).json({
      success: true,
      message: "Alert updated successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Error updating alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update alert",
      error: error.message,
    });
  }
};

// Delete an alert
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const alert = await Alert.findOneAndDelete({ _id: id, userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
      error: error.message,
    });
  }
};

// Get alerts by specific date and time
export const getAlertsByDateTime = async (req, res) => {
  try {
    const { date, time } = req.query;
    const userId = req.user.id;

    // Validate required parameters
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Date and time are required parameters",
      });
    }

    // Parse the date to get start and end of day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Find alerts matching the specific date and time
    const alerts = await Alert.find({
      userId,
      isActive: true,
      $or: [
        {
          // One-time alerts for the specific date and time
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          time: time,
          repeatDaily: false,
        },
        {
          // Daily repeating alerts with matching time
          time: time,
          repeatDaily: true,
        },
      ],
    }).sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts by date and time:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts by date and time",
      error: error.message,
    });
  }
};

// Get alerts that need to be triggered (for cron job or notification service)
export const getTriggeredAlerts = async (req, res) => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

    // Find alerts for today or repeating alerts
    const alerts = await Alert.find({
      isActive: true,
      $or: [
        {
          // One-time alerts for today
          date: {
            $gte: new Date(currentDate),
            $lt: new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000),
          },
          repeatDaily: false,
        },
        {
          // Repeating alerts
          repeatDaily: true,
        },
      ],
    }).populate("userId", "name email phone");

    // Filter by time (should be triggered around current time)
    const triggeredAlerts = alerts.filter((alert) => {
      return alert.time <= currentTime;
    });

    res.status(200).json({
      success: true,
      count: triggeredAlerts.length,
      data: triggeredAlerts,
    });
  } catch (error) {
    console.error("Error fetching triggered alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch triggered alerts",
      error: error.message,
    });
  }
};
