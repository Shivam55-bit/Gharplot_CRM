import express from 'express';
import {
  receiveBadAttendantNotification,
  getBadAttendantNotifications,
  markNotificationAsRead,
  getBadAttendantStats
} from '../controllers/adminNotificationController.js';
import { verifyAdminToken } from '../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// Receive bad attendant notification (can be called by employees)
router.post('/bad-attendant', receiveBadAttendantNotification);

// Get all bad attendant notifications (admin only)
router.get('/bad-attendant/list', verifyAdminToken, getBadAttendantNotifications);

// Get bad attendant statistics (admin only)
router.get('/bad-attendant/stats', verifyAdminToken, getBadAttendantStats);

// Mark notification as read (admin only)
router.put('/read/:notificationId', verifyAdminToken, markNotificationAsRead);

export default router;
