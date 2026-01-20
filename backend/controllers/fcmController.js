import User from "../models/user.js";
import Employee from "../models/employeeSchema.js";

//  Save Token Controller for Users
export const saveToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ success: false, message: "Missing userId or fcmToken" });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//  Save Token Controller for Employees
export const saveEmployeeToken = async (req, res) => {
  try {
    const { employeeId, fcmToken } = req.body;

    if (!employeeId || !fcmToken) {
      return res.status(400).json({ success: false, message: "Missing employeeId or fcmToken" });
    }

    await Employee.findByIdAndUpdate(employeeId, { fcmToken });

    console.log(`✅ FCM token saved for employee ${employeeId}`);

    res.json({ success: true, message: "Employee token saved successfully" });
  } catch (error) {
    console.error("Error saving employee FCM token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
