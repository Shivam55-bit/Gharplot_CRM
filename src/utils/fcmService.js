/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification setup, token management, and foreground notifications
 */

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// Storage key for FCM token
const FCM_TOKEN_KEY = '@fcm_token';

/**
 * Request notification permission from the user
 * Required for iOS and Android 13+
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted:', authStatus);
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token and store it in AsyncStorage
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const getFCMToken = async () => {
  try {
    // Check if user has granted permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('⚠️ Cannot get FCM token: Permission not granted');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    
    if (token) {
      console.log('✅ FCM Token retrieved:', token);
      
      // Store token in AsyncStorage
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      console.log('💾 FCM Token saved to AsyncStorage');
      
      return token;
    } else {
      console.log('⚠️ No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

/**
 * Get stored FCM token from AsyncStorage
 * @returns {Promise<string|null>} Stored FCM token or null
 */
export const getStoredFCMToken = async () => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error getting stored FCM token:', error);
    return null;
  }
};

/**
 * Force refresh FCM token (useful when Firebase project changes)
 * Deletes old token and gets a fresh one
 * @returns {Promise<string|null>} New FCM token or null
 */
export const forceRefreshFCMToken = async () => {
  try {
    console.log('🔄 Force refreshing FCM token...');
    
    // Delete old token from Firebase
    await messaging().deleteToken();
    console.log('🗑️ Old FCM token deleted');
    
    // Clear from AsyncStorage
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('🗑️ Stored token cleared');
    
    // Get fresh token
    const newToken = await messaging().getToken();
    
    if (newToken) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      console.log('✅ New FCM Token:', newToken);
      return newToken;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error refreshing FCM token:', error);
    return null;
  }
};

/**
 * Setup foreground notification handler
 * Shows alert when notification is received while app is in foreground
 */
export const setupForegroundNotificationHandler = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('📩 🔥 FOREGROUND notification received:', JSON.stringify(remoteMessage, null, 2));

    // Get notification details - Support both data-only and notification+data formats
    const title = remoteMessage.notification?.title || remoteMessage.data?.title || '🔔 सूचना';
    const body = remoteMessage.notification?.body || remoteMessage.data?.body || remoteMessage.data?.message || '';
    const data = remoteMessage.data || {};
    
    // 🔥 Skip welcome/greeting notifications - don't show popup
    if (
      title?.toLowerCase().includes('welcome') ||
      body?.toLowerCase().includes('welcome back') ||
      body?.toLowerCase().includes('welcome to our platform') ||
      data?.type === 'welcome' ||
      data?.type === 'greeting'
    ) {
      console.log('⏭️ Skipping welcome notification - not showing popup');
      return;
    }
    const notificationType = data.type || data.notificationType || 'system';

    // 🚫 SKIP system-generated reminders - don't show popup
    if (data.createdBy === 'System' || data.createdBy === 'system') {
      console.log('⏭️ Skipping System-created reminder - not showing popup');
      return;
    }

    // Handle Employee Reminder to Admin notifications (CRM)
    if (notificationType === 'employee_reminder_to_admin') {
      console.log('🔔 Employee Reminder notification received for Admin', { employeeName: data.employeeName, createdBy: data.createdBy });
      
      // 🚫 SKIP system-generated reminders - don't show popup
      if (data.employeeName === 'System' || data.createdBy === 'System' || data.createdBy === 'system') {
        console.log('⏭️ Skipping System-created Employee Reminder - not showing popup');
        return;
      }
      
      const employeeName = data.employeeName || 'Employee';
      const clientName = data.clientName || 'Client';
      const reminderTitle = data.reminderTitle || title || 'Reminder';
      
      // Use beautiful custom popup
      const { showEmployeeNotificationPopup } = require('../services/EmployeePopupManager');
      showEmployeeNotificationPopup({
        type: 'reminder',
        employeeName: employeeName,
        title: reminderTitle,
        clientName: clientName,
      });
      return;
    }

    // Handle Employee Alert to Admin notifications (CRM)
    if (notificationType === 'employee_alert_to_admin') {
      console.log('🔔 Employee Alert notification received for Admin');
      
      const employeeName = data.employeeName || 'Employee';
      const alertTitle = data.alertTitle || title || 'Alert';
      const alertReason = data.alertReason || body || 'New alert';
      
      // Use beautiful custom popup
      const { showEmployeeNotificationPopup } = require('../services/EmployeePopupManager');
      showEmployeeNotificationPopup({
        type: 'alert',
        employeeName: employeeName,
        title: alertTitle,
        reason: alertReason,
      });
      return;
    }

    // Handle ALERT notifications - Show custom popup
    if (notificationType === 'alert' || notificationType === 'system_alert') {
      console.log('🔔 ALERT notification received in foreground', { type: data.type, createdBy: data.createdBy, employeeName: data.employeeName });
      
      // 🚫 SKIP system alerts - don't show popup
      if (data.createdBy === 'System' || data.createdBy === 'system' || notificationType === 'system_alert') {
        console.log('⏭️ Skipping System alert - not showing popup');
        return;
      }
      
      // Use beautiful custom popup
      const { showEmployeeNotificationPopup } = require('../services/EmployeePopupManager');
      showEmployeeNotificationPopup({
        type: 'alert',
        employeeName: 'System',
        title: title || 'Alert',
        reason: body || data.reason || 'New alert',
      });
      return;
    }
    // Handle reminder notifications - Show custom popup
    else if (notificationType === 'reminder') {
      console.log('🔔 Reminder notification received in foreground', { type: data.type, createdBy: data.createdBy, employeeName: data.employeeName });
      
      // 🚫 SKIP system-generated reminders - don't show popup
      if (data.createdBy === 'System' || data.createdBy === 'system' || data.employeeName === 'System') {
        console.log('⏭️ Skipping System-created reminder - not showing popup');
        return;
      }
      
      // Use beautiful custom popup
      const { showEmployeeNotificationPopup } = require('../services/EmployeePopupManager');
      showEmployeeNotificationPopup({
        type: 'reminder',
        employeeName: data.clientName || 'System',
        title: title || 'Reminder',
        clientName: data.clientName || '',
      });
      return;
    } else {
      // Handle other notifications - Show custom popup
      if (title || body) {
        console.log('🚨 SHOWING FOREGROUND NOTIFICATION:', { title, body });
        
        // Use beautiful custom popup for all notifications
        const { showEmployeeNotificationPopup } = require('../services/EmployeePopupManager');
        showEmployeeNotificationPopup({
          type: notificationType === 'chat' ? 'reminder' : 'alert',
          employeeName: data.senderName || data.employeeName || 'System',
          title: title || 'Notification',
          reason: body || 'New notification',
          clientName: data.clientName || '',
        });
      } else {
        console.log('⚠️ No title/body in foreground notification');
      }
    }

    // Save notification to local storage
    try {
      const { addNotification } = await import('./notificationManager');
      
      // Support both data-only and notification+data formats
      if (remoteMessage && (remoteMessage.notification || remoteMessage.data)) {
        const notification = {
          type: notificationType,
          title: title,
          message: body,
          body: body,
          data: data, // Store complete FCM data
          propertyId: data.propertyId,
          chatId: data.chatId,
          inquiryId: data.inquiryId,
          reminderId: data.reminderId,
          alertId: data.alertId,
          enquiryId: data.enquiryId,
          reason: data.reason,
          date: data.date,
          time: data.time,
          repeatDaily: data.repeatDaily,
          phoneNumber: data.phoneNumber || data.phone,
          clientName: data.clientName,
          image: data.image
        };
        
        await addNotification(notification);
        console.log('✅ Foreground notification saved to local storage');
      }
    } catch (error) {
      console.error('❌ Error saving foreground notification:', error);
    }
  });

  // Return unsubscribe function to cleanup when component unmounts
  return unsubscribe;
};

/**
 * Setup background notification handler
 * Handles notifications when app is in background or quit state
 */
export const setupBackgroundNotificationHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📩 🔥 BACKGROUND/KILL MODE notification received:', JSON.stringify(remoteMessage, null, 2));
    
    // Extract data - support both formats
    const data = remoteMessage.data || {};
    const title = remoteMessage.notification?.title || data.title || 'Notification';
    const body = remoteMessage.notification?.body || data.body || data.message || '';
    const notificationType = data.type || data.notificationType || 'system';
    
    console.log('🎯 Notification Type:', notificationType);
    
    // Save notification to local storage even when app is killed
    try {
      const { addNotification } = await import('./notificationManager');
      
      // Accept both data-only and notification+data formats
      if (remoteMessage && (remoteMessage.notification || remoteMessage.data)) {
        const notification = {
          type: notificationType,
          title: title,
          message: body,
          body: body,
          data: data, // Store complete FCM data for navigation
          propertyId: data.propertyId,
          chatId: data.chatId,
          inquiryId: data.inquiryId,
          reminderId: data.reminderId,
          alertId: data.alertId,
          enquiryId: data.enquiryId,
          reason: data.reason,
          date: data.date,
          time: data.time,
          repeatDaily: data.repeatDaily,
          phoneNumber: data.phoneNumber || data.phone,
          clientName: data.clientName,
          image: data.image
        };
        
        await addNotification(notification);
        console.log('✅ Background notification saved to local storage');
        
        // For reminder notifications, log special handling
        if (notificationType === 'reminder') {
          console.log('🔔 Reminder notification saved in background for:', 
            remoteMessage.data?.clientName || 'Unknown Client');
        }
      }
    } catch (error) {
      console.error('❌ Error saving background notification:', error);
    }
    
    // The notification will be automatically displayed by the system
  });
};

/**
 * Listen for FCM token refresh
 * Token can refresh when app is restored, reinstalled, or user clears data
 */
export const setupTokenRefreshListener = (onTokenRefresh) => {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    console.log('🔄 FCM Token refreshed:', token);
    
    // Store new token
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    console.log('💾 New FCM Token saved to AsyncStorage');
    
    // Call callback if provided (e.g., to send to backend)
    if (onTokenRefresh && typeof onTokenRefresh === 'function') {
      onTokenRefresh(token);
    }
  });

  return unsubscribe;
};

/**
 * Handle notification tap when app is in background/quit state
 * @param {Function} handler - Callback to handle notification data
 */
export const setupNotificationOpenedListener = (handler) => {
  // Notification opened when app is in background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('🔔 Notification opened (background):', remoteMessage);
    if (handler && typeof handler === 'function') {
      handler(remoteMessage);
    }
  });

  // Notification opened when app was quit
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('🔔 Notification opened (quit state):', remoteMessage);
        if (handler && typeof handler === 'function') {
          handler(remoteMessage);
        }
      }
    });
};

/**
 * Create default notification channel (Android only)
 * Required for Android 8.0+ to display notifications
 */
export const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // Note: This requires @notifee/react-native package for advanced channel management
    // For basic FCM, the channel is created automatically when first notification arrives
    console.log('📱 Android notification channel will be created automatically');
  }
};

/**
 * Check if FCM is properly configured
 */
export const checkFCMConfiguration = async () => {
  try {
    console.log('🔍 Checking FCM configuration...');
    const results = {
      configured: false,
      details: {},
      errors: [],
      warnings: []
    };
    
    // Check if Firebase is initialized
    try {
      const app = messaging().app;
      console.log('✅ Firebase app initialized:', app.name);
      results.details.firebaseInit = true;
    } catch (firebaseError) {
      console.error('❌ Firebase initialization failed:', firebaseError);
      results.errors.push('Firebase not initialized: ' + firebaseError.message);
      results.details.firebaseInit = false;
      return { ...results, error: 'Firebase initialization failed' };
    }
    
    // Check permissions with better error handling
    try {
      const authStatus = await messaging().requestPermission();
      const hasPermission = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      results.details.permissions = {
        status: authStatus,
        granted: hasPermission
      };
      
      if (!hasPermission) {
        console.warn('⚠️ Notification permissions not granted, status:', authStatus);
        results.warnings.push(`Notification permissions not granted (status: ${authStatus})`);
        results.details.permissionWarning = true;
      } else {
        console.log('✅ Notification permissions granted');
      }
    } catch (permissionError) {
      console.error('❌ Permission check failed:', permissionError);
      results.errors.push('Permission check failed: ' + permissionError.message);
      results.details.permissions = { error: permissionError.message };
    }
    
    // Try to get token with retry logic
    let token = null;
    try {
      console.log('🎫 Attempting to get FCM token...');
      token = await messaging().getToken();
      
      if (!token) {
        console.warn('⚠️ FCM token is null - retrying...');
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await messaging().getToken();
      }
      
      if (token) {
        console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
        results.details.token = {
          available: true,
          preview: token.substring(0, 20) + '...',
          length: token.length
        };
      } else {
        console.warn('⚠️ Unable to get FCM token after retry');
        results.warnings.push('FCM token not available - check Google Play Services and network');
        results.details.token = { available: false };
      }
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError);
      results.errors.push('Token generation failed: ' + tokenError.message);
      results.details.token = { error: tokenError.message };
    }
    
    // Check device capabilities
    try {
      const isGooglePlayServicesAvailable = await messaging().hasPermission();
      results.details.googlePlayServices = isGooglePlayServicesAvailable !== -1;
      
      if (!results.details.googlePlayServices) {
        results.warnings.push('Google Play Services may not be available');
      }
    } catch (playServicesError) {
      console.warn('⚠️ Could not check Google Play Services:', playServicesError);
      results.details.googlePlayServices = 'unknown';
    }
    
    // Determine overall configuration status
    const hasErrors = results.errors.length > 0;
    const hasToken = results.details.token?.available === true;
    const hasPermissions = results.details.permissions?.granted === true;
    
    if (!hasErrors && hasToken && hasPermissions) {
      results.configured = true;
      console.log('✅ FCM is fully configured and working');
    } else if (!hasErrors && (hasToken || hasPermissions)) {
      results.configured = 'partial';
      console.log('⚠️ FCM is partially configured');
    } else {
      results.configured = false;
      console.log('❌ FCM configuration has issues');
    }
    
    return { ...results, token };
    
  } catch (error) {
    console.error('❌ FCM configuration check failed:', error);
    return { 
      configured: false, 
      error: error.message,
      errors: [error.message],
      details: { generalError: true }
    };
  }
};

/**
 * Send FCM token to backend for storage
 * Saves to BOTH User and Employee models for complete coverage
 */
export const sendTokenToBackend = async (userId, token) => {
  try {
    if (!userId || !token) {
      console.warn('⚠️ Missing userId or token for backend sync');
      return false;
    }
    
    console.log('📤 Sending FCM token to backend...');
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // 1️⃣ Save to User model
    const userResponse = await fetch('https://abc.bhoomitechzone.us/api/fcm/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        fcmToken: token,
        platform: Platform.OS,
      }),
      signal: controller.signal
    });
    
    if (userResponse.ok) {
      console.log('✅ FCM token saved to User model');
    }
    
    // 2️⃣ Save to Employee model (for CRM reminder notifications)
    try {
      const employeeResponse = await fetch('https://abc.bhoomitechzone.us/api/fcm/save-employee-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: userId,
          fcmToken: token,
        }),
      });
      
      if (employeeResponse.ok) {
        console.log('✅ FCM token saved to Employee model');
      }
    } catch (empError) {
      console.warn('⚠️ Employee token save failed (user might not be employee):', empError.message);
    }
    
    clearTimeout(timeoutId);
    
    await AsyncStorage.setItem('fcm_token_synced', 'true');
    return true;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('⚠️ FCM token request timed out');
    } else if (error.message.includes('Network request failed')) {
      console.warn('⚠️ Network error while sending FCM token - backend may be offline');
    } else {
      console.warn('⚠️ Failed to send FCM token to backend:', error.message);
    }
    // Don't throw error to prevent app crash
    return false;
  }
};

/**
 * Initialize FCM service with enhanced reminder notification support
 * Call this once when app starts
 * @param {Function} onTokenRefresh - Optional callback for token refresh
 * @param {Function} onNotificationOpened - Optional callback for notification opened
 * @returns {Object} Cleanup functions and configuration status
 */
export const initializeFCM = async (onTokenRefresh, onNotificationOpened) => {
  console.log('🚀 Initializing FCM Service with reminder support...');
  
  try {
    // First check if FCM is properly configured
    const configCheck = await checkFCMConfiguration();
    if (!configCheck.configured) {
      console.error('❌ FCM not properly configured:', configCheck.error);
      
      // Show user-friendly error
      Alert.alert(
        'Notification Setup',
        'Push notifications need to be enabled for the best experience. Please enable notifications in your device settings.',
        [{ text: 'OK' }]
      );
      
      return { 
        configured: false,
        token: null, 
        cleanup: () => {}, 
        error: configCheck.error 
      };
    }

    // Setup background handler (must be done outside component)
    setupBackgroundNotificationHandler();

    // Get FCM token
    const token = await getFCMToken();
    
    if (token) {
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
      
      // Try to send token to backend (non-blocking)
      setTimeout(async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            const success = await sendTokenToBackend(userId, token);
            if (!success) {
              console.log('ℹ️ FCM token sync to backend skipped - will retry later');
            }
          } else {
            console.log('ℹ️ No userId found - FCM token will be synced after login');
          }
        } catch (syncError) {
          console.warn('⚠️ Token sync to backend failed (non-critical):', syncError.message);
        }
      }, 2000); // Delay by 2 seconds to not block app startup
    }

    // Setup listeners
    const unsubscribeForeground = setupForegroundNotificationHandler();
    const unsubscribeTokenRefresh = setupTokenRefreshListener(async (newToken) => {
      console.log('🔄 FCM Token refreshed:', newToken.substring(0, 20) + '...');
      
      // Call user callback
      if (onTokenRefresh && typeof onTokenRefresh === 'function') {
        onTokenRefresh(newToken);
      }
      
      // Send updated token to backend
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          await sendTokenToBackend(userId, newToken);
        }
      } catch (syncError) {
        console.warn('⚠️ Updated token sync to backend failed:', syncError.message);
      }
    });
    
    setupNotificationOpenedListener(onNotificationOpened);

    console.log('✅ FCM Service initialized successfully');

    // Return cleanup function
    return {
      token,
      configured: true,
      cleanup: () => {
        if (unsubscribeForeground) unsubscribeForeground();
        if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      },
    };
    
  } catch (error) {
    console.error('❌ FCM initialization failed:', error);
    
    Alert.alert(
      'Notification Error',
      'There was an issue setting up push notifications. Some features may not work properly.',
      [{ text: 'OK' }]
    );
    
    return { 
      token: null, 
      configured: false, 
      error: error.message,
      cleanup: () => {} 
    };
  }
};

/**
 * Create reminder notification payload for FCM
 * Helper function to format reminder notifications consistently
 * @param {Object} reminderData - Reminder information
 * @returns {Object} Formatted FCM notification payload
 */
export const createReminderNotificationPayload = (reminderData) => {
  const { clientName, note, phoneNumber, enquiryId, reminderId, assignedTo } = reminderData;
  
  return {
    notification: {
      title: '⏰ रिमाइंडर',
      body: `${clientName || 'Client'} को कॉल करने का समय${note ? ` - ${note}` : ''}`,
      sound: 'default',
      priority: 'high'
    },
    data: {
      type: 'reminder',
      reminderId: String(reminderId || ''),
      enquiryId: String(enquiryId || ''),
      clientName: clientName || '',
      phoneNumber: phoneNumber || '',
      note: note || '',
      action: 'view_reminder',
      timestamp: new Date().toISOString()
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'enquiry_reminders',
        priority: 'max',
        defaultSound: true,
        defaultVibratePattern: true
      }
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
          alert: {
            title: '⏰ रिमाइंडर',
            body: `${clientName || 'Client'} को कॉल करने का समय`
          }
        }
      }
    }
  };
};

/**
 * Test reminder notification 
 * For debugging reminder notifications in development
 * @param {Object} testData - Test reminder data
 */
export const testReminderNotification = async (testData = {}) => {
  if (!__DEV__) {
    console.warn('⚠️ Test notifications only available in development mode');
    return;
  }
  
  try {
    const token = await getFCMToken();
    if (!token) {
      console.error('❌ No FCM token available for testing');
      return;
    }
    
    const reminderData = {
      clientName: testData.clientName || 'Test Client',
      note: testData.note || 'Test reminder call',
      phoneNumber: testData.phoneNumber || '9999999999',
      enquiryId: testData.enquiryId || 'test-enquiry-123',
      reminderId: testData.reminderId || 'test-reminder-123',
      assignedTo: testData.assignedTo || 'test-user'
    };
    
    const payload = createReminderNotificationPayload(reminderData);
    
    console.log('🧪 Test reminder notification payload created:');
    console.log(JSON.stringify(payload, null, 2));
    
    // In a real scenario, this payload would be sent to your FCM backend endpoint
    // For testing, you can manually trigger the foreground handler
    const { setupForegroundNotificationHandler } = require('./fcmService');
    
    Alert.alert(
      'Test Reminder Notification',
      `Test reminder created for ${reminderData.clientName}\nIn production, this would be sent via FCM backend.`,
      [{ text: 'OK' }]
    );
    
    return payload;
  } catch (error) {
    console.error('❌ Test reminder notification failed:', error);
  }
};
