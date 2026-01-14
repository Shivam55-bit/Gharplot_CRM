/**
 * Reminder Manager Service
 * Handles reminder scheduling, checking, and popup triggering
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const REMINDERS_KEY = 'app_reminders';
const CHECK_INTERVAL = 5000; // ✅ ENHANCED: Check every 5 seconds for better accuracy

class ReminderManager {
  constructor() {
    this.checkInterval = null;
    this.reminderCallback = null;
    this.checkedReminders = new Set(); // Track already triggered reminders
    this.isRunning = false;
  }

  /**
   * Initialize reminder manager
   * @param {Function} onReminderTrigger - Callback when reminder time matches
   */
  initialize(onReminderTrigger) {
    this.reminderCallback = onReminderTrigger;
    this.isRunning = true;
    this.startChecking();
    console.log('✅ Enhanced Reminder Manager initialized with 5-second check interval');
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

    // Then check every 5 seconds for better accuracy
    this.checkInterval = setInterval(() => {
      if (this.isRunning) {
        this.checkReminders();
      }
    }, CHECK_INTERVAL);

    console.log('🔄 Enhanced reminder checking started (5-second intervals)');
  }

  /**
   * Stop checking reminders
   */
  stopChecking() {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏸️ Enhanced reminder checking stopped');
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
   * ✅ ENHANCED: Check if any reminder time has arrived with better precision
   */
  async checkReminders() {
    try {
      const pendingReminders = await this.getPendingReminders();
      const now = new Date();

      if (pendingReminders.length === 0) {
        return; // No reminders to check
      }

      console.log(`🔍 Checking ${pendingReminders.length} pending reminders...`);

      for (const reminder of pendingReminders) {
        const reminderTime = new Date(reminder.reminderDateTime || reminder.reminderTime);
        
        // Skip if already triggered
        if (this.checkedReminders.has(reminder.id)) {
          continue;
        }
        
        // Check if reminder time has arrived (within 30 seconds window for reliability)
        const timeDiff = now.getTime() - reminderTime.getTime();
        const isDue = timeDiff >= 0 && timeDiff <= 30000; // Within 30 seconds

        if (isDue) {
          console.log('🔔 REMINDER DUE - Triggering popup!');
          console.log('  📋 Title:', reminder.title || reminder.name);
          console.log('  📅 Scheduled:', reminderTime.toLocaleString());
          console.log('  🕐 Current:', now.toLocaleString());
          console.log('  ⏱️ Difference:', Math.round(timeDiff / 1000), 'seconds');
          
          // Mark as checked to prevent duplicate triggers
          this.checkedReminders.add(reminder.id);
          
          await this.triggerReminder(reminder);
        } else {
          // Log upcoming reminders for debugging
          const futureTime = reminderTime.getTime() - now.getTime();
          if (futureTime > 0 && futureTime <= 300000) { // Within 5 minutes
            console.log(`⏰ Upcoming: ${reminder.title || reminder.name} in ${Math.round(futureTime / 1000)}s`);
          }
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

  /**
   * ✅ ENHANCED: Force immediate check (for testing)
   */
  forceCheck() {
    console.log('🔄 Forcing immediate reminder check...');
    this.checkReminders();
  }

  /**
   * ✅ ENHANCED: Get service status for debugging
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasCallback: !!this.reminderCallback,
      checkedCount: this.checkedReminders.size,
      intervalActive: !!this.checkInterval
    };
  }

  /**
   * ✅ ENHANCED: Create test reminder for debugging
   */
  async createTestReminder(delaySeconds = 30) {
    const testTime = new Date(Date.now() + delaySeconds * 1000);
    const testReminder = {
      id: `test-${Date.now()}`,
      title: '🧪 Test Reminder',
      note: `This is a test reminder created for debugging (${delaySeconds}s delay)`,
      name: 'Test Client',
      phone: '9999999999',
      contactNumber: '9999999999',
      location: 'Test Location',
      reminderDateTime: testTime.toISOString(),
      status: 'pending',
      assignmentType: 'enquiry',
      isLocalReminder: true,
      createdAt: new Date().toISOString()
    };

    await this.addReminder(testReminder);
    console.log(`🧪 Test reminder created - will trigger at: ${testTime.toLocaleString()}`);
    return testReminder;
  }

  /**
   * ✅ ENHANCED: Clear checked reminders set (for testing)
   */
  resetCheckedReminders() {
    this.checkedReminders.clear();
    console.log('🔄 Checked reminders set cleared');
  }
}

// Export singleton instance
const reminderManager = new ReminderManager();

// ✅ ENHANCED: Global debug commands for development
if (__DEV__) {
  global.debugReminders = {
    // Check service status
    status: () => {
      const status = reminderManager.getStatus();
      console.log('🔍 Reminder Manager Status:', status);
      return status;
    },

    // Create immediate test reminder (30 seconds)
    testNow: () => {
      return reminderManager.createTestReminder(30);
    },

    // Create test reminder for 2 minutes
    test2Min: () => {
      return reminderManager.createTestReminder(120);
    },

    // Force immediate check
    forceCheck: () => {
      reminderManager.forceCheck();
      return 'Force check triggered';
    },

    // Get all pending reminders
    pending: async () => {
      const pending = await reminderManager.getPendingReminders();
      console.log('📋 Pending reminders:', pending.length);
      pending.forEach((r, i) => {
        const time = new Date(r.reminderDateTime || r.reminderTime);
        console.log(`  ${i + 1}. ${r.title || r.name} at ${time.toLocaleString()}`);
      });
      return pending;
    },

    // Clear all reminders
    clearAll: async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('app_reminders');
      reminderManager.resetCheckedReminders();
      console.log('🗑️ All reminders cleared');
      return 'All reminders cleared';
    },

    // Reset checked reminders
    reset: () => {
      reminderManager.resetCheckedReminders();
      return 'Checked reminders reset';
    }
  };

  // Auto-log debug commands
  setTimeout(() => {
    console.log('🛠️ Enhanced Debug Commands Available:');
    console.log('  • global.debugReminders.status() - Check service status');
    console.log('  • global.debugReminders.testNow() - Test popup in 30s');
    console.log('  • global.debugReminders.test2Min() - Test popup in 2min');
    console.log('  • global.debugReminders.forceCheck() - Force check now');
    console.log('  • global.debugReminders.pending() - List pending reminders');
    console.log('  • global.debugReminders.clearAll() - Clear all reminders');
    console.log('  • global.debugReminders.reset() - Reset checked reminders');
  }, 3000);
}

export default reminderManager;
