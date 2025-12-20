import axios from 'axios';

class GlobalReminderService {
  constructor() {
    this.checkInterval = null;
    this.isActive = false;
    this.onReminderDue = null;
    // Load checked reminders from localStorage
    const saved = localStorage.getItem('checkedReminders');
    this.checkedReminders = saved ? new Set(JSON.parse(saved)) : new Set();
    this.apiBaseUrl = 'https://abc.bhoomitechzone.us';
    
    // FEATURE FLAG: Set to false to completely disable auto-popup reminders
    this.enableAutoPopup = true; // Enable auto-popup for real reminders only
    
    // Check every 1 second for due reminders (very frequent for immediate response)
    this.intervalDuration = 1000;
    
    // LOCAL REMINDER STORAGE - for reminders created from enquiry form
    // This ensures popups work even if API has issues
    const savedLocalReminders = localStorage.getItem('localReminders');
    this.localReminders = savedLocalReminders ? JSON.parse(savedLocalReminders) : [];

    // Auto-start the service as soon as it's instantiated if we have a token
    this.autoStart();
    
    // Also listen for page changes to ensure service persists
    this.setupPageChangeListeners();
  }
  
  // Add a local reminder (called when creating enquiry with week action datetime)
  addLocalReminder(reminderData) {
    console.log('📝 Adding local reminder:', reminderData);
    
    // Ensure unique ID
    const localReminder = {
      ...reminderData,
      _id: reminderData._id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isLocalReminder: true,
      createdAt: new Date().toISOString()
    };
    
    this.localReminders.push(localReminder);
    
    // Save to localStorage
    localStorage.setItem('localReminders', JSON.stringify(this.localReminders));
    
    console.log('✅ Local reminder added. Total local reminders:', this.localReminders.length);
    
    return localReminder;
  }
  
  // Check local reminders for due ones
  checkLocalReminders() {
    if (this.localReminders.length === 0) return [];
    
    const now = new Date();
    const dueLocalReminders = [];
    const remainingReminders = [];
    
    this.localReminders.forEach(reminder => {
      const reminderTime = new Date(reminder.reminderDateTime);
      const timeDiff = now.getTime() - reminderTime.getTime();
      
      // Check if due - ONLY when current time >= reminder time (not before)
      // Window of 10 minutes after the time for reliability
      const isDue = timeDiff >= 0 && timeDiff <= (10 * 60 * 1000);
      
      console.log(`🏠 Local reminder check: ${reminder.title}`, {
        reminderTime: reminderTime.toLocaleString(),
        currentTime: now.toLocaleString(),
        diffSeconds: Math.round(timeDiff / 1000),
        isDue
      });
      
      if (isDue) {
        // Check if not already shown
        if (!this.checkedReminders.has(reminder._id)) {
          dueLocalReminders.push(reminder);
        }
      } else if (timeDiff < 0) {
        // Not yet due (time is in future), keep it
        remainingReminders.push(reminder);
      }
      // If timeDiff > 10 minutes, remove it (expired)
    });
    
    // Update local reminders (remove expired ones)
    if (remainingReminders.length !== this.localReminders.length - dueLocalReminders.length) {
      this.localReminders = remainingReminders.concat(dueLocalReminders.filter(r => !this.checkedReminders.has(r._id)));
      localStorage.setItem('localReminders', JSON.stringify(this.localReminders));
    }
    
    return dueLocalReminders;
  }

  // Setup page change listeners to ensure service persists across navigation
  setupPageChangeListeners() {
    // Listen for hash changes (SPA navigation)
    window.addEventListener('hashchange', () => {
      this.ensureServiceRunning();
    });
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.ensureServiceRunning();
    });
    
    // Use mutation observer for React Router navigation
    if (typeof window !== 'undefined') {
      const observer = new MutationObserver(() => {
        this.ensureServiceRunning();
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    }
  }

  // Ensure the service is running (call this on page changes)
  ensureServiceRunning() {
    console.log('🔄 Ensuring reminder service is running on page:', window.location.pathname);
    
    if (!this.isActive) {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('adminToken') || 
                    localStorage.getItem('employeeToken');
      
      if (token) {
        console.log('🔄 Restarting reminder service after page change');
        this.start(token);
      }
    }
  }

  // Auto-start method to initialize service immediately
  autoStart() {
    // Try to start with any available token
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('adminToken') || 
                  localStorage.getItem('employeeToken');
    
    if (token) {
      console.log('🚀 Auto-starting Global Reminder Service with existing token');
      setTimeout(() => this.start(token), 1000);
    } else {
      console.log('⚠️ No token found for auto-start, waiting for manual start');
    }
  }

  // Set callback function for when reminders are due
  setReminderCallback(callback) {
    this.onReminderDue = callback;
  }

  // Start the global reminder monitoring
  start(token) {
    if (this.isActive) {
      console.log('🔔 Global Reminder Service already running, updating token if provided');
      if (token) this.token = token;
      return;
    }
    
    this.isActive = true;
    this.token = token;
    
    console.log('🔔 Global Reminder Service started on page:', window.location.pathname);
    console.log('🔑 Token status:', token ? 'Provided' : 'Will detect from localStorage');
    
    // Check immediately on start
    this.checkDueReminders();
    
    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, this.intervalDuration);

    console.log(`⏰ Reminder checking interval set to ${this.intervalDuration}ms`);
  }

  // Stop the global reminder monitoring
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('🔕 Global Reminder Service stopped');
  }

  // Check for due reminders from the API
  async checkDueReminders() {
    if (!this.isActive) return;
    
    // CHECK: If auto-popup is disabled, skip checking
    if (!this.enableAutoPopup) {
      console.log('⏸️ Auto-popup reminders are DISABLED. Skipping check.');
      return;
    }
    
    // Update token from localStorage if not provided
    if (!this.token) {
      this.token = localStorage.getItem('token') || 
                   localStorage.getItem('adminToken') || 
                   localStorage.getItem('employeeToken');
      
      if (!this.token) {
        console.log('⚠️ No authentication token found for reminder service');
        return;
      }
    }
    
    // Check if user is admin
    const isAdmin = !!localStorage.getItem('adminToken');
    
    try {
      const currentTime = new Date();
      console.log('🔍 Checking for due reminders at:', currentTime.toLocaleString());
      
      // FIRST: Check local reminders (these are from enquiry form)
      const dueLocalReminders = this.checkLocalReminders();
      if (dueLocalReminders.length > 0) {
        console.log(`🏠 Found ${dueLocalReminders.length} due LOCAL reminders!`);
        dueLocalReminders.forEach(reminder => {
          if (!this.checkedReminders.has(reminder._id)) {
            console.log('🔔 Triggering LOCAL reminder popup:', reminder.title);
            this.checkedReminders.add(reminder._id);
            localStorage.setItem('checkedReminders', JSON.stringify(Array.from(this.checkedReminders)));
            
            if (this.onReminderDue) {
              const formattedReminder = this.formatReminderForPopup(reminder, false);
              this.onReminderDue(formattedReminder);
            }
          }
        });
      }
      
      let allReminders = [];
      
      if (isAdmin) {
        // Admin: Fetch reminders for employees with adminReminderPopupEnabled = true
        try {
          const adminResponse = await axios.get(`${this.apiBaseUrl}/admin/reminders/due-all`, {
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (adminResponse.data.success && adminResponse.data.data) {
            // Flatten employee-wise reminders into single array
            adminResponse.data.data.forEach(empData => {
              if (empData.reminders && empData.reminders.length > 0) {
                allReminders.push(...empData.reminders.map(r => ({
                  ...r,
                  _id: r._id || r.id, // Backend uses 'id' field, normalize to '_id'
                  employeeName: empData.employee.name,
                  employeeEmail: empData.employee.email,
                  // Extract client info from assignment data
                  clientName: r.assignmentId?.clientName || r.assignmentId?.name || r.clientName || r.name,
                  clientPhone: r.assignmentId?.phone || r.phone,
                  clientEmail: r.assignmentId?.email || r.email
                })));
                console.log('🔍 Sample reminder data:', empData.reminders[0]);
              }
            });
            console.log(`👨‍💼 Admin: Fetched ${allReminders.length} due reminders from enabled employees`);
          }
        } catch (adminErr) {
          console.log('⚠️ Admin due-all endpoint failed, falling back to employee endpoint');
          // Fallback to regular employee endpoint
          const response = await axios.get(`${this.apiBaseUrl}/employee/reminders/list`, {
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            },
            params: {
              status: 'pending',
              limit: 100
            }
          });
          allReminders = response.data?.data?.reminders || response.data?.data || [];
        }
      } else {
        // Employee: Fetch own reminders
        const response = await axios.get(`${this.apiBaseUrl}/employee/reminders/list`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          params: {
            status: 'pending',
            limit: 100
          }
        });
        allReminders = response.data?.data?.reminders || response.data?.data || [];
        console.log(`👤 Employee: Fetched ${allReminders.length} pending reminders`);
      }

      if (allReminders.length === 0) {
        console.log('ℹ️ No pending reminders found');
        return;
      }

      // For admin: due-all endpoint already returns DUE reminders, skip client-side check
      let dueReminders = [];
      
      if (isAdmin) {
        // Admin reminders are already filtered by backend
        dueReminders = allReminders;
        console.log(`📋 Admin: Processing ${dueReminders.length} backend-confirmed due reminders`);
      } else {
        // Employee: Client-side check to see if reminders are due NOW
        console.log(`📋 Employee: Checking ${allReminders.length} reminders for due status...`);
        
        dueReminders = allReminders.filter(reminder => {
          if (!reminder.reminderDateTime) {
            console.log(`   ⏭️ Skipping reminder ${reminder._id} - no reminderDateTime`);
            return false;
          }
          
          // Parse the reminder time - stored as ISO string (UTC)
          const reminderDateUTC = new Date(reminder.reminderDateTime);
          
          // Get current time (also in UTC internally)
          const now = new Date();
          
          // Calculate time difference in milliseconds
          // Both dates are automatically handled as UTC when using getTime()
          const timeDiff = now.getTime() - reminderDateUTC.getTime();
          
          // Reminder is due ONLY when current time >= reminder time (not before)
          // Window of 10 minutes after the time for reliability
          const isDue = timeDiff >= 0 && timeDiff <= (10 * 60 * 1000);
          
          // Log all reminders for debugging
          console.log(`   📅 Reminder ${reminder._id}:`, {
            title: reminder.title,
            stored: reminder.reminderDateTime,
            reminderTimeLocal: reminderDateUTC.toLocaleString(),
            currentTimeLocal: now.toLocaleString(),
            diffMinutes: Math.round(timeDiff / 60000),
            diffSeconds: Math.round(timeDiff / 1000),
            isDue: isDue,
            status: reminder.status
          });
          
          if (isDue) {
            console.log(`   🔔 ✅ Reminder IS DUE:`, {
              id: reminder._id,
              title: reminder.title,
              reminderTime: reminderDateUTC.toLocaleString(),
              currentTime: now.toLocaleString(),
              diffMinutes: Math.round(timeDiff / 60000)
            });
          }
          
          return isDue;
        });
        console.log(`📋 Employee: Found ${dueReminders.length} due reminders (client-side check)`);
      }

      if (dueReminders.length > 0) {
        console.log(`📋 Processing ${dueReminders.length} reminders:`, dueReminders.map(r => ({
          id: r._id,
          time: r.reminderDateTime,
          title: r.title,
          status: r.status
        })));
        
        // Filter out already checked reminders - use ONLY _id for tracking to prevent duplicates
        const newDueReminders = dueReminders.filter(reminder => {
          const reminderKey = reminder._id || reminder.id; // Backend uses 'id', frontend uses '_id'
          const alreadyShown = this.checkedReminders.has(reminderKey);
          
          if (alreadyShown) {
            console.log(`⏭️ Skipping already shown reminder: ${reminderKey} (${reminder.title})`);
          }
          
          return !alreadyShown;
        });

        if (newDueReminders.length > 0) {
          console.log(`🔔 Found ${newDueReminders.length} NEW due reminders!`);
          
          // Mark these reminders as checked using only ID
          newDueReminders.forEach(reminder => {
            const reminderKey = reminder._id || reminder.id; // Backend uses 'id', frontend uses '_id'
            this.checkedReminders.add(reminderKey);
            console.log(`✅ Marked as shown: ${reminderKey} (${reminder.title})`);
          });
          
          // Save to localStorage to persist across page refreshes
          localStorage.setItem('checkedReminders', JSON.stringify(Array.from(this.checkedReminders)));

          // Process and trigger callback for each new due reminder
          if (this.onReminderDue) {
            newDueReminders.forEach(reminder => {
              // Format reminder data for consistent popup display
              const formattedReminder = this.formatReminderForPopup(reminder, true);
              console.log('🔔 Triggering reminder popup for:', formattedReminder.title || formattedReminder.description);
              this.onReminderDue(formattedReminder);
            });
          }
        } else {
          console.log('ℹ️ No new reminders (all already shown)');
        }
      } else {
        console.log('ℹ️ No due reminders at this time');
      }
    } catch (error) {
      // Only log if it's not a network error (to avoid spam in console)
      if (!error.message.includes('Network Error') && !error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.error('❌ Error checking due reminders:', error.message);
      }
    }
  }

  // Clean up old checked reminders (call periodically to prevent memory buildup)
  cleanupCheckedReminders() {
    // Keep only last 1000 checked reminders to prevent memory issues
    if (this.checkedReminders.size > 1000) {
      const reminderArray = Array.from(this.checkedReminders);
      this.checkedReminders.clear();
      
      // Keep the last 500
      reminderArray.slice(-500).forEach(key => {
        this.checkedReminders.add(key);
      });
      
      // Save to localStorage
      localStorage.setItem('checkedReminders', JSON.stringify(Array.from(this.checkedReminders)));
    }
  }

  // Manual check for due reminders (can be called on demand)
  async forceCheck() {
    if (!this.isActive || !this.token) return;
    
    console.log('🔍 Force checking for due reminders...');
    await this.checkDueReminders();
  }

  // Reset checked reminders (for testing/debugging)
  resetCheckedReminders() {
    console.log('🔄 Resetting checked reminders cache...');
    this.checkedReminders.clear();
    localStorage.removeItem('checkedReminders');
    console.log('✅ Checked reminders cache cleared');
  }

  // Force show all due reminders (ignoring already-shown status)
  async forceShowReminders() {
    if (!this.isActive || !this.token) return;
    
    console.log('🔔 Force showing all due reminders...');
    this.resetCheckedReminders();
    await this.checkDueReminders();
  }

  // Method to manually trigger a reminder popup (for immediate testing)
  triggerManualReminder(reminderData) {
    if (this.onReminderDue) {
      console.log('🔔 MANUAL TRIGGER: Showing reminder popup immediately');
      this.onReminderDue(reminderData);
    }
  }

  // Format reminder data for consistent popup display
  formatReminderForPopup(reminder, isFromRealEndpoint) {
    if (!isFromRealEndpoint) {
      // Local/Test reminders - preserve all fields for comprehensive display
      return {
        ...reminder, // Keep all original fields
        // EXPLICITLY preserve isLocalReminder flag
        isLocalReminder: reminder.isLocalReminder || true,
        // Ensure consistent field names for display
        description: reminder.description || reminder.message || reminder.note || reminder.comment,
        message: reminder.message || reminder.description || reminder.note || reminder.comment,
        title: reminder.title,
        note: reminder.note || reminder.actionPlan,
        // Client information
        clientName: reminder.clientName || reminder.leadName || reminder.name,
        leadName: reminder.leadName || reminder.clientName || reminder.name,
        name: reminder.name || reminder.clientName || reminder.leadName,
        phone: reminder.phone || reminder.contactNumber,
        contactNumber: reminder.contactNumber || reminder.phone,
        email: reminder.email,
        location: reminder.location,
        address: reminder.address,
        // Enquiry-specific fields
        productType: reminder.productType,
        caseStatus: reminder.caseStatus,
        source: reminder.source,
        majorComments: reminder.majorComments,
        referenceBy: reminder.referenceBy,
        clientCode: reminder.clientCode,
        projectCode: reminder.projectCode,
        serialNumber: reminder.serialNumber,
        enquiryId: reminder.enquiryId,
        // Status and metadata
        status: reminder.status || 'pending',
        assignmentType: reminder.assignmentType || 'enquiry',
        assignmentId: reminder.assignmentId,
        // Timing
        reminderDateTime: reminder.reminderDateTime || reminder.dueDate,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt,
        // Repeat and tracking
        isRepeating: reminder.isRepeating,
        repeatType: reminder.repeatType,
        snoozeCount: reminder.snoozeCount || 0,
        triggerCount: reminder.triggerCount || 0,
        nextTrigger: reminder.nextTrigger,
        // Completion history
        completionResponse: reminder.completionResponse,
        completedAt: reminder.completedAt,
        responseWordCount: reminder.responseWordCount,
        responseColor: reminder.responseColor
      };
    }

    // Format real API reminders
    const assignmentData = reminder.assignmentId;
    let clientName = 'Unknown Client';
    let phone = '';
    let email = '';
    let location = '';

    // Try to extract client information from the assignment or direct reminder fields
    // First check if reminder has direct client info (from create-from-lead endpoint)
    if (reminder.name || reminder.clientName) {
      clientName = reminder.name || reminder.clientName || 'Unknown Client';
      phone = reminder.phone || '';
      email = reminder.email || '';
      location = reminder.location || '';
    } else if (assignmentData) {
      if (assignmentData.userId) {
        // This is from a User Lead Assignment
        clientName = assignmentData.userId.name || assignmentData.userId.fullName || 'User Lead';
        phone = assignmentData.userId.phone || assignmentData.userId.phoneNumber || '';
        email = assignmentData.userId.email || '';
      } else if (assignmentData.inquiryId) {
        // This is from an Enquiry Lead Assignment
        clientName = assignmentData.inquiryId.name || assignmentData.inquiryId.fullName || 'Enquiry Lead';
        phone = assignmentData.inquiryId.phone || assignmentData.inquiryId.phoneNumber || '';
        email = assignmentData.inquiryId.email || '';
      }
    }

    return {
      // Preserve all original reminder fields
      ...reminder,
      // Consistent field mapping
      description: reminder.note || reminder.comment || reminder.description || reminder.title || 'Reminder notification',
      message: reminder.note || reminder.comment || reminder.description || reminder.title || 'Reminder notification',
      title: reminder.title,
      comment: reminder.note || reminder.comment,
      // Client information (extracted or original)
      clientName: clientName,
      leadName: clientName,
      name: clientName,
      phone: phone || reminder.phone || reminder.contactNumber,
      contactNumber: reminder.contactNumber || reminder.phone || phone,
      email: email || reminder.email,
      location: location || reminder.location,
      // Enquiry-specific fields
      productType: reminder.productType,
      caseStatus: reminder.caseStatus,
      source: reminder.source,
      majorComments: reminder.majorComments,
      address: reminder.address,
      referenceBy: reminder.referenceBy,
      clientCode: reminder.clientCode,
      projectCode: reminder.projectCode,
      serialNumber: reminder.serialNumber,
      enquiryId: reminder.enquiryId,
      // Assignment context
      assignmentType: reminder.assignmentType || 'enquiry',
      assignmentId: reminder.assignmentId,
      // Timing and status
      reminderDateTime: reminder.reminderDateTime || reminder.reminderTime,
      status: reminder.status || 'pending',
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      // Repeat settings
      isRepeating: reminder.isRepeating,
      repeatType: reminder.repeatType,
      // Tracking
      snoozeCount: reminder.snoozeCount || 0,
      triggerCount: reminder.triggerCount || 0,
      nextTrigger: reminder.nextTrigger,
      // Completion history
      completionResponse: reminder.completionResponse,
      completedAt: reminder.completedAt,
      responseWordCount: reminder.responseWordCount,
      responseColor: reminder.responseColor
    };
  }

  // Get service status
  getStatus() {
    return {
      isActive: this.isActive,
      hasToken: !!this.token,
      checkedCount: this.checkedReminders.size,
      intervalDuration: this.intervalDuration
    };
  }

  // Method to permanently dismiss a reminder (prevent it from showing again)
  dismissReminder(reminderId) {
    console.log(`🚫 Permanently dismissing reminder: ${reminderId}`);
    this.checkedReminders.add(reminderId);
    // Save to localStorage to persist across page refreshes
    localStorage.setItem('checkedReminders', JSON.stringify(Array.from(this.checkedReminders)));
  }

  // Method to clear all checked reminders (use with caution)
  clearCheckedReminders() {
    console.log('🗑️ Clearing all checked reminders cache');
    this.checkedReminders.clear();
  }

  // Enable or disable auto-popup reminders
  setAutoPopup(enabled) {
    console.log(`🔔 Auto-popup reminders ${enabled ? 'ENABLED' : 'DISABLED'}`);
    this.enableAutoPopup = enabled;
  }

  // Check if auto-popup is enabled
  isAutoPopupEnabled() {
    return this.enableAutoPopup;
  }
}

// Create singleton instance
const globalReminderService = new GlobalReminderService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.GlobalReminderService = globalReminderService;
  
  // Add helpful console commands
  console.log('💡 Global Reminder Service Commands:');
  console.log('  - window.GlobalReminderService.setAutoPopup(true)  // Enable auto-popup');
  console.log('  - window.GlobalReminderService.setAutoPopup(false) // Disable auto-popup');
  console.log('  - window.GlobalReminderService.clearCheckedReminders() // Clear cache');
  console.log('  - window.GlobalReminderService.getStatus() // Check status');
  console.log('  - window.GlobalReminderService.resetCheckedReminders() // Reset all dismissed');
  console.log('  - window.GlobalReminderService.forceShowReminders() // Force show due reminders');
  console.log('  - window.testReminderPopup() // Show a test reminder popup immediately');
  
  // Add test function for immediate popup testing
  window.testReminderPopup = () => {
    console.log('🧪 Testing reminder popup...');
    const testReminder = {
      _id: 'test-reminder-' + Date.now(),
      title: 'Test Enquiry Reminder',
      note: 'This is a test reminder from the enquiry form',
      clientName: 'Test Client',
      phone: '9876543210',
      email: 'test@example.com',
      location: 'Test Location',
      productType: 'Plot',
      caseStatus: 'Hot',
      source: 'Website',
      serialNumber: '001',
      reminderDateTime: new Date().toISOString(),
      status: 'pending',
      assignmentType: 'enquiry'
    };
    globalReminderService.triggerManualReminder(testReminder);
    return 'Test reminder triggered! Check for popup.';
  };
}

export default globalReminderService;