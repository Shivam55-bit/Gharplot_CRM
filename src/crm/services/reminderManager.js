/**
 * Reminder Manager Service
 * Handles reminder scheduling, checking, and popup triggering
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const REMINDERS_KEY = 'app_reminders';
const CHECK_INTERVAL = 60000; // Check every 1 minute

class ReminderManager {
  constructor() {
    this.checkInterval = null;
    this.reminderCallback = null;
  }

  /**
   * Initialize reminder manager
   * @param {Function} onReminderTrigger - Callback when reminder time matches
   */
  initialize(onReminderTrigger) {
    this.reminderCallback = onReminderTrigger;
    this.startChecking();
    console.log('✅ Reminder Manager initialized');
  }

  /**
   * Start checking reminders periodically
   */
  startChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check immediately
    this.checkReminders();

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, CHECK_INTERVAL);

    console.log('🔄 Reminder checking started');
  }

  /**
   * Stop checking reminders
   */
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏸️ Reminder checking stopped');
    }
  }

  /**
   * Add reminder to local storage
   */
  async addReminder(reminderData) {
    try {
      const reminders = await this.getAllReminders();
      
      // Add unique ID if not present
      const reminder = {
        ...reminderData,
        id: reminderData.id || `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: reminderData.createdAt || new Date().toISOString(),
        status: reminderData.status || 'pending',
        triggered: false,
      };

      reminders.push(reminder);
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
      
      console.log('✅ Reminder added to local storage:', reminder.id);
      return reminder;
    } catch (error) {
      console.error('❌ Error adding reminder:', error);
      throw error;
    }
  }

  /**
   * Get all reminders from local storage
   */
  async getAllReminders() {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error getting reminders:', error);
      return [];
    }
  }

  /**
   * Get pending reminders
   */
  async getPendingReminders() {
    try {
      const reminders = await this.getAllReminders();
      return reminders.filter(r => r.status === 'pending' && !r.triggered);
    } catch (error) {
      console.error('❌ Error getting pending reminders:', error);
      return [];
    }
  }

  /**
   * Check if any reminder time has arrived
   */
  async checkReminders() {
    try {
      const pendingReminders = await this.getPendingReminders();
      const now = new Date();

      for (const reminder of pendingReminders) {
        const reminderTime = new Date(reminder.reminderDateTime || reminder.reminderTime);
        
        // Check if reminder time has passed (within 2 minutes window)
        const timeDiff = now.getTime() - reminderTime.getTime();
        const isTime = timeDiff >= 0 && timeDiff <= 120000; // Within 2 minutes

        if (isTime) {
          console.log('🔔 Reminder triggered:', reminder.title || reminder.name);
          await this.triggerReminder(reminder);
        }
      }
    } catch (error) {
      console.error('❌ Error checking reminders:', error);
    }
  }

  /**
   * Trigger reminder popup
   */
  async triggerReminder(reminder) {
    try {
      // Mark as triggered
      await this.markAsTriggered(reminder.id);

      // Call callback to show popup
      if (this.reminderCallback) {
        this.reminderCallback(reminder);
      }

      console.log('✅ Reminder triggered successfully');
    } catch (error) {
      console.error('❌ Error triggering reminder:', error);
    }
  }

  /**
   * Mark reminder as triggered
   */
  async markAsTriggered(reminderId) {
    try {
      const reminders = await this.getAllReminders();
      const updated = reminders.map(r => 
        r.id === reminderId ? { ...r, triggered: true } : r
      );
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('❌ Error marking reminder as triggered:', error);
    }
  }

  /**
   * Mark reminder as completed
   */
  async markAsCompleted(reminderId, response) {
    try {
      const reminders = await this.getAllReminders();
      const updated = reminders.map(r => 
        r.id === reminderId ? { 
          ...r, 
          status: 'completed', 
          completedAt: new Date().toISOString(),
          response: response 
        } : r
      );
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
      console.log('✅ Reminder marked as completed');
    } catch (error) {
      console.error('❌ Error marking reminder as completed:', error);
    }
  }

  /**
   * Delete reminder
   */
  async deleteReminder(reminderId) {
    try {
      const reminders = await this.getAllReminders();
      const filtered = reminders.filter(r => r.id !== reminderId);
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));
      console.log('✅ Reminder deleted');
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
    }
  }

  /**
   * Clear all completed reminders
   */
  async clearCompletedReminders() {
    try {
      const reminders = await this.getAllReminders();
      const active = reminders.filter(r => r.status !== 'completed');
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(active));
      console.log('✅ Completed reminders cleared');
    } catch (error) {
      console.error('❌ Error clearing completed reminders:', error);
    }
  }

  /**
   * Get upcoming reminders (next 24 hours)
   */
  async getUpcomingReminders() {
    try {
      const reminders = await this.getPendingReminders();
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      return reminders.filter(r => {
        const reminderTime = new Date(r.reminderDateTime || r.reminderTime);
        return reminderTime >= now && reminderTime <= next24Hours;
      }).sort((a, b) => {
        const timeA = new Date(a.reminderDateTime || a.reminderTime);
        const timeB = new Date(b.reminderDateTime || b.reminderTime);
        return timeA - timeB;
      });
    } catch (error) {
      console.error('❌ Error getting upcoming reminders:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new ReminderManager();
