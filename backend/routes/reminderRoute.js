import express from "express";
import {
  createReminder,
  createReminderFromLead,
  getEmployeeReminders,
  getDueReminders,
  completeReminder,
  snoozeReminder,
  dismissReminder,
  updateReminder,
  deleteReminder,
  getReminderStats,
  getReminders
} from "../controllers/reminderController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Employee reminder routes (all require authentication)
router.use(verifyToken);

// Create a new reminder
router.post("/create", createReminder);

// Create reminder from lead data (simplified)
router.post("/create-from-lead", createReminderFromLead);

// Get employee's reminders (with pagination and filtering)
router.get("/list", getEmployeeReminders);

// Legacy route for backward compatibility
router.get("/reminders", getReminders);

// Get due reminders for popup notifications
router.get("/due", getDueReminders);

// Complete a reminder
router.put("/complete/:reminderId", completeReminder);

// Snooze a reminder
router.put("/snooze/:reminderId", snoozeReminder);

// Dismiss a reminder
router.put("/dismiss/:reminderId", dismissReminder);

// Update reminder settings
router.put("/update/:reminderId", updateReminder);

// Delete a reminder
router.delete("/delete/:reminderId", deleteReminder);

// Get reminder statistics
router.get("/stats", getReminderStats);

export default router;
