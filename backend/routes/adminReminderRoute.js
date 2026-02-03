import express from "express";
import {
  getEmployeeReminders,
  getEmployeeDueReminders,
  getAllDueRemindersForAdmin,
  toggleEmployeeReminderPopup,
  getAllEmployeesReminderStatus,
  getAdminReminderStats
} from "../controllers/adminReminderController.js";
import { verifyAdminToken } from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminToken);

// Get reminder statistics for admin dashboard
router.get("/stats", getAdminReminderStats);

// Get all employees with their reminder popup status
router.get("/employees-status", getAllEmployeesReminderStatus);

// Get all due reminders for admin (only for employees with popup enabled)
router.get("/due-all", getAllDueRemindersForAdmin);

// Get all reminders for a specific employee
router.get("/employee/:employeeId", getEmployeeReminders);

// Get due reminders for a specific employee
router.get("/employee/:employeeId/due", getEmployeeDueReminders);

// Toggle admin reminder popup for an employee
router.put("/employee/:employeeId/toggle-popup", toggleEmployeeReminderPopup);

export default router;
