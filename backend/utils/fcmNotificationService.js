import admin from "../config/firebase.js";
import Employee from "../models/employeeSchema.js";
import Admin from "../models/adminAuthSchema.js";

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

/**
 * Send FCM notification to Admin when employee creates a reminder
 */
export const sendAdminReminderNotification = async (reminderData, employeeData) => {
  try {
    // Get all admins with FCM tokens
    const admins = await Admin.find({ fcmToken: { $exists: true, $ne: "" } });
    
    if (!admins || admins.length === 0) {
      console.log(`❌ No admins found with FCM tokens`);
      return { success: false, message: "No admin FCM tokens found" };
    }

    const { title, clientName, phone, location, note, reminderTime } = reminderData;
    const { employeeName, employeeEmail } = employeeData;

    const notificationTitle = `🔔 New Reminder - ${employeeName}`;
    const notificationBody = `${employeeName} set reminder: ${title || clientName || 'New reminder'}`;

    // Send to all admins
    const sendPromises = admins.map(async (admin) => {
      const message = {
        token: admin.fcmToken,
        
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        
        data: {
          type: "admin_reminder",
          employeeName: String(employeeName || ""),
          employeeEmail: String(employeeEmail || ""),
          reminderTitle: String(title || ""),
          clientName: String(clientName || ""),
          phone: String(phone || ""),
          location: String(location || ""),
          note: String(note || ""),
          reminderTime: String(reminderTime || ""),
          timestamp: String(Date.now())
        },
        
        android: {
          priority: "high",
          notification: {
            channelId: "admin_reminder_channel",
            sound: "default",
            priority: "high",
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        
        apns: {
          payload: {
            aps: {
              alert: {
                title: notificationTitle,
                body: notificationBody
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

      try {
        const response = await admin.messaging().send(message);
        console.log(`✅ FCM notification sent to admin ${admin.email}: ${response}`);
        return { success: true, adminEmail: admin.email, messageId: response };
      } catch (error) {
        console.error(`❌ FCM error for admin ${admin.email}:`, error.code);
        return { success: false, adminEmail: admin.email, error: error.code };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    console.log(`📊 Admin FCM notifications: ${successCount}/${admins.length} sent successfully`);
    
    return { 
      success: successCount > 0, 
      totalAdmins: admins.length, 
      successCount,
      results 
    };

  } catch (error) {
    console.error("❌ Admin FCM notification error:", error);
    return { success: false, message: error.message };
  }
};

export default { sendReminderNotification, sendAdminReminderNotification };
