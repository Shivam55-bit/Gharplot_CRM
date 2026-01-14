/**
 * AlertNotificationService.js
 * Scheduled notification service for CRM Alert System
 * Handles notifications at exact date/time specified in alerts
 */
import notifee, { 
  AndroidImportance, 
  TriggerType,
  AndroidCategory,
  AndroidStyle,
  AndroidVisibility,
  AndroidColor
} from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification channel configuration (reuse enquiry_reminders channel for consistency)
const ALERT_CHANNEL_ID = 'enquiry_reminders';
const ALERT_CHANNEL_NAME = 'System Alerts';
const ALERT_CHANNEL_DESCRIPTION = 'Scheduled system alerts and notifications';

class AlertNotificationService {
  /**
   * Initialize the alert notification service
   * Creates notification channels if needed
   */
  static async initialize() {
    try {
      // Create notification channel for Android (channel should already exist from ReminderNotificationService)
      if (Platform.OS === 'android') {
        await this.createNotificationChannel();
      }
      
      console.log('✅ AlertNotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AlertNotificationService:', error);
      return false;
    }
  }

  /**
   * Create notification channel with enhanced UI settings
   */
  static async createNotificationChannel() {
    try {
      const channelConfig = {
        id: ALERT_CHANNEL_ID,
        name: ALERT_CHANNEL_NAME,
        description: ALERT_CHANNEL_DESCRIPTION,
        importance: AndroidImportance.HIGH, // High importance for sound and vibration
        sound: 'default', // Use default notification sound
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        lights: true,
        lightColor: AndroidColor.RED,
        badge: true,
        visibility: AndroidVisibility.PUBLIC,
        bypassDnd: false,
      };
      
      await notifee.createChannel(channelConfig);
      
      console.log('✅ Alert notification channel created successfully');
    } catch (error) {
      console.error('❌ Failed to create alert notification channel:', error);
    }
  }

  /**
   * Schedule an alert notification for exact date/time
   * @param {Object} alertData - Alert information
   * @param {string} alertData.id - Unique alert ID (from backend)
   * @param {string} alertData.date - Alert date (YYYY-MM-DD format)
   * @param {string} alertData.time - Alert time (HH:MM format)
   * @param {string} alertData.reason - Alert message/reason
   * @param {boolean} alertData.repeatDaily - Whether alert repeats daily
   */
  static async scheduleAlert(alertData) {
    try {
      const { id, date, time, reason, repeatDaily = false, title = '' } = alertData;

      // Validate required fields
      if (!id || !date || !time || !reason) {
        throw new Error('Missing required alert fields (id, date, time, reason)');
      }

      // Parse time to create notification timestamp
      // time format: HH:MM
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      
      let notificationDate;
      
      if (repeatDaily) {
        // For repeat daily alerts, ignore the date and use today's date with the specified time
        notificationDate = new Date();
        notificationDate.setHours(hours, minutes, 0, 0);
        
        // If the time has already passed today, schedule for tomorrow
        if (notificationDate <= now) {
          notificationDate.setDate(notificationDate.getDate() + 1);
          console.log('⏰ Time already passed today, scheduling for tomorrow');
        }
      } else {
        // For one-time alerts, use the specified date
        const [year, month, day] = date.split('-').map(Number);
        notificationDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        // Validate that the scheduled date is in the future
        if (notificationDate <= now) {
          console.warn('⚠️ Alert date/time is in the past. Skipping notification schedule.');
          return {
            success: false,
            error: 'Alert time is in the past',
            message: 'Cannot schedule notification for past date/time',
          };
        }
      }

      console.log('📅 Scheduling alert:', {
        id,
        date: repeatDaily ? 'Daily (ignored)' : date,
        time,
        reason: reason.substring(0, 50),
        notificationDate: notificationDate.toLocaleString(),
        now: now.toLocaleString(),
        repeatDaily
      });

      // Create timestamp trigger with alarmManager for background/killed state
      // Note: Local notifications don't support daily repeats with TIMESTAMP triggers
      // Repeat daily alerts are handled by backend FCM notifications
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationDate.getTime(),
        alarmManager: {
          allowWhileIdle: true, // Critical for background notifications
        },
      };

      // Prepare notification body with enhanced UI
      const timeString = notificationDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      const dateString = notificationDate.toLocaleDateString('en-IN', { 
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const notificationBody = {
        id: `alert_${id}`, // Prefix with 'alert_' to distinguish from reminders
        title: title || '🔔 Alert Notification', // Use custom title if provided
        body: `${reason}\n\n📅 ${dateString} • ${timeString}${repeatDaily ? ' • 🔁 Daily' : ''}`,
        android: {
          channelId: ALERT_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.REMINDER,
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
          lights: [AndroidColor.RED, 300, 600],
          color: '#FF5722',
          showTimestamp: true,
          timestamp: notificationDate.getTime(),
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `${reason}\n\n📅 ${dateString} • ${timeString}${repeatDaily ? '\n🔁 Repeats Daily' : ''}`,
          },
        },
        ios: {
          sound: 'default',
          categoryId: 'alert',
        },
        data: {
          type: 'alert',
          alertId: id,
          title: title,
          reason: reason,
          date,
          time,
          repeatDaily: String(repeatDaily),
          timestamp: Date.now(),
          // Pass additional navigation data
          navigationData: JSON.stringify({
            scrollToAlert: id,
            showDetails: true,
            fromNotification: true,
            highlightAlert: id
          })
        },
      };

      // Schedule the notification
      await notifee.createTriggerNotification(notificationBody, trigger);

      // Store alert notification info locally
      await this.storeAlertNotificationLocally({
        id,
        date,
        time,
        reason,
        repeatDaily,
        scheduledFor: notificationDate.toISOString(),
        notificationId: `alert_${id}`,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Alert notification scheduled for ${notificationDate.toLocaleString()}`);
      console.log(`   Reason: ${reason.substring(0, 50)}`);
      if (repeatDaily) {
        console.log(`   📋 Note: Daily repeat is handled by backend FCM, not local notification`);
      }
      
      return {
        success: true,
        notificationId: `alert_${id}`,
        scheduledFor: notificationDate.toISOString(),
        message: `Alert scheduled for ${notificationDate.toLocaleString()}`,
      };

    } catch (error) {
      console.error('❌ Failed to schedule alert notification:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to schedule alert notification. Please try again.',
      };
    }
  }

  /**
   * Cancel a scheduled alert notification
   * @param {string} alertId - The alert ID (will be prefixed with 'alert_')
   */
  static async cancelAlert(alertId) {
    try {
      const notificationId = `alert_${alertId}`;
      await notifee.cancelNotification(notificationId);
      
      // Remove from local storage
      await this.removeAlertNotificationLocally(alertId);
      
      console.log(`✅ Alert notification cancelled: ${notificationId}`);
      return {
        success: true,
        message: 'Alert notification cancelled successfully',
      };
    } catch (error) {
      console.error('❌ Failed to cancel alert notification:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to cancel alert notification',
      };
    }
  }

  /**
   * Cancel all scheduled alert notifications
   */
  static async cancelAllAlerts() {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await notifee.getTriggerNotifications();
      
      // Filter and cancel only alert notifications (those with id starting with 'alert_')
      const alertNotifications = scheduledNotifications.filter(
        notif => notif.notification.id && notif.notification.id.startsWith('alert_')
      );
      
      for (const notif of alertNotifications) {
        await notifee.cancelNotification(notif.notification.id);
      }
      
      // Clear local storage
      await AsyncStorage.removeItem('scheduled_alert_notifications');
      
      console.log(`✅ Cancelled ${alertNotifications.length} alert notifications`);
      return {
        success: true,
        count: alertNotifications.length,
        message: `Cancelled ${alertNotifications.length} alert notifications`,
      };
    } catch (error) {
      console.error('❌ Failed to cancel all alert notifications:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all scheduled alert notifications
   */
  static async getScheduledAlerts() {
    try {
      const scheduledNotifications = await notifee.getTriggerNotifications();
      
      // Filter only alert notifications
      const alertNotifications = scheduledNotifications
        .filter(notif => notif.notification.id && notif.notification.id.startsWith('alert_'))
        .map(notif => ({
          id: notif.notification.id,
          title: notif.notification.title,
          body: notif.notification.body,
          scheduledTime: notif.trigger.timestamp,
          data: notif.notification.data,
        }));
      
      return alertNotifications;
    } catch (error) {
      console.error('❌ Failed to get scheduled alerts:', error);
      return [];
    }
  }

  /**
   * Store alert notification info locally (for tracking)
   */
  static async storeAlertNotificationLocally(alertInfo) {
    try {
      const key = 'scheduled_alert_notifications';
      const stored = await AsyncStorage.getItem(key);
      const alerts = stored ? JSON.parse(stored) : [];
      
      // Add or update alert
      const existingIndex = alerts.findIndex(a => a.id === alertInfo.id);
      if (existingIndex >= 0) {
        alerts[existingIndex] = alertInfo;
      } else {
        alerts.push(alertInfo);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to store alert notification locally:', error);
    }
  }

  /**
   * Remove alert notification from local storage
   */
  static async removeAlertNotificationLocally(alertId) {
    try {
      const key = 'scheduled_alert_notifications';
      const stored = await AsyncStorage.getItem(key);
      const alerts = stored ? JSON.parse(stored) : [];
      
      const filtered = alerts.filter(a => a.id !== alertId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove alert notification locally:', error);
    }
  }

  /**
   * Get locally stored alert notifications
   */
  static async getLocallyStoredAlerts() {
    try {
      const key = 'scheduled_alert_notifications';
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get locally stored alerts:', error);
      return [];
    }
  }

  /**
   * Reschedule an alert (useful for updates)
   */
  static async rescheduleAlert(alertData) {
    try {
      // Cancel existing notification
      await this.cancelAlert(alertData.id);
      
      // Schedule new notification
      return await this.scheduleAlert(alertData);
    } catch (error) {
      console.error('❌ Failed to reschedule alert:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default AlertNotificationService;
