// import cron from "node-cron";
// import Reminder from "../models/reminderSchema.js";
// import Notification from "../models/notificationModel.js";
// import { io } from "../server.js";
// import { sendReminderNotification } from "../utils/fcmNotificationService.js";

// // Check reminders every minute for accurate FCM delivery
// cron.schedule("* * * * *", async () => {
//   try {
//     console.log("🔍 Checking reminders...");

//     const now = new Date();

//     // Find due reminders (using new reminder schema fields)
//     const reminders = await Reminder.find({
//       isActive: true,
//       status: { $nin: ['completed', 'dismissed'] },
//       $or: [
//         {
//           status: 'pending',
//           reminderDateTime: { $lte: now }
//         },
//         {
//           status: 'snoozed',
//           snoozedUntil: { $lte: now }
//         },
//         {
//           isRepeating: true,
//           nextTrigger: { $lte: now }
//         }
//       ]
//     }).populate('employeeId', 'name email fcmToken');

//     console.log(`📋 Found ${reminders.length} due reminders`);

//     for (const r of reminders) {
//       try {
//         // Skip if triggered recently (prevent duplicates)
//         if (r.lastTriggered) {
//           const timeSinceLastTrigger = now - new Date(r.lastTriggered);
//           if (timeSinceLastTrigger < 5 * 60 * 1000) { // 5 min cooldown
//             continue;
//           }
//         }

//         console.log(`📬 Processing reminder: ${r.title}`);

//         // 1️⃣ Create in-app notification
//         const notification = new Notification({
//           title: "🔔 Reminder Alert",
//           message: r.title || "You have a reminder",
//           reminderData: {
//             name: r.clientName,
//             email: r.email,
//             phone: r.phone,
//             location: r.location,
//             note: r.comment,
//             reminderTime: r.reminderDateTime,
//           },
//         });

//         await notification.save();

//         // 2️⃣ Send Socket.io notification (web/foreground)
//         io.emit("newNotification", {
//           _id: notification._id,
//           title: notification.title,
//           message: notification.message,
//           reminderData: notification.reminderData,
//           createdAt: notification.createdAt,
//         });

//         // 3️⃣ Send FCM Push Notification (ALL 3 MODES: Foreground, Background, Kill)
//         if (r.employeeId && r.employeeId._id) {
//           const fcmResult = await sendReminderNotification(r.employeeId._id, {
//             name: r.clientName,
//             email: r.email,
//             phone: r.phone,
//             location: r.location,
//             note: r.comment,
//             reminderTime: r.reminderDateTime
//           });

//           if (fcmResult.success) {
//             console.log(`✅ FCM notification sent for reminder ${r._id}`);
//           } else {
//             console.log(`⚠️ FCM failed: ${fcmResult.message}`);
//           }
//         }

//         // 4️⃣ Update reminder tracking
//         r.lastTriggered = now;
//         r.triggerCount = (r.triggerCount || 0) + 1;
        
//         if (r.isRepeating && r.isActive) {
//           if (r.status === 'snoozed') {
//             r.status = 'pending';
//             r.snoozedUntil = null;
//           }
//           r.calculateNextTrigger();
//         } else if (r.status === 'snoozed') {
//           r.status = 'pending';
//           r.snoozedUntil = null;
//         }

//         await r.save();
//         console.log(`✅ Reminder processed: ${r.title}`);

//       } catch (error) {
//         console.error(`❌ Error processing reminder ${r._id}:`, error);
//       }
//     }

//   } catch (error) {
//     console.error("❌ Cron job error:", error);
//   }
// });

// console.log("⏰ Reminder cron started - FCM notifications enabled for all 3 modes");


import cron from "node-cron";
import Reminder from "../models/reminderSchema.js";
import Notification from "../models/notificationModel.js";
import { io } from "../server.js";
import { sendReminderNotification } from "../utils/fcmNotificationService.js";

// Check reminders every minute for accurate FCM delivery
cron.schedule("* * * * *", async () => {
  try {
    console.log("🔍 Checking reminders...");

    const now = new Date();

    // Find due reminders (using new reminder schema fields)
    const reminders = await Reminder.find({
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
    }).populate('employeeId', 'name email fcmToken');

    console.log(`📋 Found ${reminders.length} due reminders`);

    for (const r of reminders) {
      try {
        // Skip if triggered recently (prevent duplicates within 1 hour)
        if (r.lastTriggered) {
          const timeSinceLastTrigger = now - new Date(r.lastTriggered);
          if (timeSinceLastTrigger < 60 * 60 * 1000) { // 1 hour cooldown
            continue;
          }
        }

        console.log(`📬 Processing reminder: ${r.title}`);

        // 1️⃣ Create in-app notification
        const notification = new Notification({
          title: "🔔 Reminder Alert",
          message: r.title || "You have a reminder",
          reminderData: {
            name: r.clientName,
            email: r.email,
            phone: r.phone,
            location: r.location,
            note: r.comment,
            reminderTime: r.reminderDateTime,
          },
        });

        await notification.save();

        // 2️⃣ Send Socket.io notification (web/foreground)
        io.emit("newNotification", {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          reminderData: notification.reminderData,
          createdAt: notification.createdAt,
        });

        // 3️⃣ Send FCM Push Notification (ALL 3 MODES: Foreground, Background, Kill)
        if (r.employeeId && r.employeeId._id) {
          const fcmResult = await sendReminderNotification(r.employeeId._id, {
            name: r.clientName,
            email: r.email,
            phone: r.phone,
            location: r.location,
            note: r.comment,
            reminderTime: r.reminderDateTime
          });

          if (fcmResult.success) {
            console.log(`✅ FCM notification sent for reminder ${r._id}`);
          } else {
            console.log(`⚠️ FCM failed: ${fcmResult.message}`);
          }
        }

        // 4️⃣ Update reminder tracking
        r.lastTriggered = now;
        r.triggerCount = (r.triggerCount || 0) + 1;
        
        // For repeating reminders, calculate next trigger
        if (r.isRepeating && r.isActive) {
          if (r.status === 'snoozed') {
            r.status = 'pending';
            r.snoozedUntil = null;
          }
          r.calculateNextTrigger();
        } else {
          // For non-repeating reminders, mark as triggered to prevent re-processing
          // Keep status as 'pending' so user can still complete/dismiss it
          if (r.status === 'snoozed') {
            r.status = 'pending';
            r.snoozedUntil = null;
          }
          // Non-repeating reminders stay pending but won't trigger again due to lastTriggered check
        }

        await r.save();
        console.log(`✅ Reminder processed: ${r.title}`);

      } catch (error) {
        console.error(`❌ Error processing reminder ${r._id}:`, error);
      }
    }

  } catch (error) {
    console.error("❌ Cron job error:", error);
  }
});

console.log("⏰ Reminder cron started - FCM notifications enabled for all 3 modes");

