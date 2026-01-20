import admin from "../config/firebase.js";
import Employee from "../models/employeeSchema.js";

/**
 * Send FCM notification for reminders - Works in all 3 modes
 * 1. FOREGROUND (App Open)
 * 2. BACKGROUND (App Minimized)
 * 3. KILL (App Terminated/Force Closed)
 */

export const sendReminderNotification = async (employeeId, reminderData) => {
  try {
    const employee = await Employee.findById(employeeId);
    
    if (!employee || !employee.fcmToken) {
      console.log(`❌ Employee ${employeeId} - FCM token not found`);
      return { success: false, message: "FCM token not found" };
    }

    const { name, email, phone, location, note, reminderTime } = reminderData;

    // Message configuration for all 3 modes
    const message = {
      token: employee.fcmToken,
      
      // For FOREGROUND & BACKGROUND modes
      notification: {
        title: "🔔 Reminder Alert",
        body: `Reminder: ${name || 'Client reminder'}`,
      },
      
      // For KILL mode - data payload works when app is terminated
      data: {
        type: "reminder",
        name: String(name || ""),
        email: String(email || ""),
        phone: String(phone || ""),
        location: String(location || ""),
        note: String(note || ""),
        reminderTime: String(reminderTime || ""),
        timestamp: String(Date.now())
      },
      
      // Android specific - high priority for kill mode
      android: {
        priority: "high",
        notification: {
          channelId: "reminder_channel",
          sound: "default",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      
      // iOS specific - for kill mode delivery
      apns: {
        payload: {
          aps: {
            alert: {
              title: "🔔 Reminder Alert",
              body: `Reminder: ${name || 'Client reminder'}`
            },
            sound: "default",
            contentAvailable: true,
            badge: 1
          }
        },
        headers: {
          "apns-priority": "10"
        }
      }
    };

    console.log(`📤 Sending FCM notification to employee ${employee.name}`);
    
    const response = await admin.messaging().send(message);
    
    console.log(`✅ FCM notification sent successfully: ${response}`);
    
    return { success: true, messageId: response };

  } catch (error) {
    console.error("❌ FCM notification error:", error);
    
    // Handle invalid token
    if (error.code === 'messaging/registration-token-not-registered' || 
        error.code === 'messaging/invalid-registration-token') {
      // Token is invalid, should be removed
      return { success: false, message: "Invalid token", shouldRemoveToken: true };
    }
    
    return { success: false, message: error.message };
  }
};

export default { sendReminderNotification };
