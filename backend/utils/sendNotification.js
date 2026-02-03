
/**
 * Send push notification via Firebase Cloud Messaging (FCM)
 * Works in foreground, background, and kill mode
 *
 * @param {string | string[]} fcmToken - Single FCM token or array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {object} data - Optional custom data payload
 * 
 */
 
//  import admin from "../config/firebase.js";

// export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
//   try {
//     // Add required FCM click action for Flutter / RN
//     const payloadData = {
//       click_action: "FLUTTER_NOTIFICATION_CLICK",
//       ...data,
//     };

//     //  Common Notification Object
//     const baseNotification = {
//       notification: {
//         title,
//         body,
//       },
//       data: payloadData,
//       android: {
//         priority: "high",
//         notification: {
//           channelId: "high_importance_channel", // must exist on device
//           sound: "default",
//           defaultSound: true,
//           visibility: "public",
//         },
//       },
//       apns: {
//         headers: {
//           "apns-priority": "10", // 10 = immediate delivery
//         },
//         payload: {
//           aps: {
//             alert: { title, body },
//             sound: "default",
//             badge: 1,
//             contentAvailable: true,
//           },
//         },
//       },
//     };

//     //  Single Token
//     if (typeof fcmToken === "string") {
//       const message = {
//         ...baseNotification,
//         token: fcmToken,
//       };

//       const response = await admin.messaging().send(message);
//       console.log(" Notification sent (single):", response);
//       return response;
//     }

//     //  Multiple Tokens
//     if (Array.isArray(fcmToken) && fcmToken.length > 0) {
//       const message = {
//         ...baseNotification,
//         tokens: fcmToken,
//       };

//       const response = await admin.messaging().sendEachForMulticast(message);
//       console.log(
//         ` Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`
//       );

//       if (response.failureCount > 0) {
//         response.responses.forEach((res, index) => {
//           if (!res.success) {
//             console.error(` Failed for token[${index}]:`, res.error?.message);
//           }
//         });
//       }

//       return response;
//     }

//     console.warn(" No FCM token(s) provided!");
//     return null;
//   } catch (error) {
//     console.error(" Error sending FCM notification:", error);
//   }
// };


// import admin from "../config/firebase.js";

// export const sendPushNotification = async (
//   fcmToken,
//   title,
//   body,
//   data = {}
// ) => {
//   try {
//     // ✅ DATA-ONLY payload (IMPORTANT)
//     const payloadData = {
//       // Required for notification click handling
//       click_action: "FLUTTER_NOTIFICATION_CLICK",

//       // 🔥 Deep link (THIS is what you wanted)
//       deepLink: data.deepLink || "gharplot://editAlert",
//       screen: data.screen || "EditAlertScreen",

//       // Pass alert data
//       alertId: data.alertId || "",
//       reason: data.reason || "",
//       date: data.date || "",
//       time: data.time || "",
//       repeatDaily: data.repeatDaily
//         ? data.repeatDaily.toString()
//         : "false",

//       // Fallback text (some devices use this)
//       title: title || "Alert Reminder",
//       body: body || "You have an alert",
//     };

//     const baseMessage = {
//       data: payloadData,

//       android: {
//         priority: "high",
//       },

//       apns: {
//         payload: {
//           aps: {
//             "content-available": 1,
//           },
//         },
//       },
//     };

//     // 🔹 Single token
//     if (typeof fcmToken === "string") {
//       const message = {
//         ...baseMessage,
//         token: fcmToken,
//       };

//       const response = await admin.messaging().send(message);
//       console.log("✅ Notification sent (single):", response);
//       return response;
//     }

//     // 🔹 Multiple tokens
//     if (Array.isArray(fcmToken) && fcmToken.length > 0) {
//       const message = {
//         ...baseMessage,
//         tokens: fcmToken,
//       };

//       const response = await admin.messaging().sendEachForMulticast(message);
//       console.log(
//         `✅ Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`
//       );
//       return response;
//     }

//     console.warn("⚠️ No FCM token provided");
//     return null;
//   } catch (error) {
//     console.error("❌ Error sending FCM notification:", error);
//     throw error;
//   }
// };


import admin from "../config/firebase.js";

export const sendPushNotification = async (
  fcmToken,
  title,
  body,
  data = {}
) => {
  try {
    const message = {
      token: fcmToken,

      // 🔥 DeepLink ALWAYS in data
      data: {
        deepLink: data.deepLink || "gharplot://editAlert",
        screen: "EditAlertScreen",
        alertId: data.alertId || "",
        reason: data.reason || "",
        date: data.date || "",
        time: data.time || "",
        repeatDaily: String(data.repeatDaily ?? false),

        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },

      // ✅ ANDROID NOTIFICATION (REQUIRED)
      android: {
        priority: "high",
        notification: {
          title: title || "Alert Reminder",
          body: body || "You have an alert",
          channelId: "alert_channel",
          clickAction: "FLUTTER_NOTIFICATION_CLICK"
        }
      },

      // ✅ iOS
      apns: {
        payload: {
          aps: {
            alert: {
              title: title || "Alert Reminder",
              body: body || "You have an alert"
            },
            sound: "default",
            "content-available": 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    return response;

  } catch (error) {
    console.error("❌ FCM error:", error);
    throw error;
  }
};


