/**
 * NotificationHandler.js
 * Centralized handler for notification events and navigation
 * Works with @notifee/react-native for foreground/background/killed states
 */
import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationService from './NavigationService';

class NotificationHandler {
  // 🔥 Navigation lock to prevent duplicate navigation
  static isNavigating = false;
  static lastNavigationTime = 0;
  static NAVIGATION_COOLDOWN = 3000; // 3 seconds cooldown

  /**
   * Setup notification event listeners for both foreground and background
   * @param {Object} navigationRef - React Navigation ref
   * @param {Function} onNotificationReceived - Callback for received notifications
   */
  static setupNotificationListeners(navigationRef, onNotificationReceived) {
    console.log('🔔 Setting up notification event listeners');

    // Handle notification press in FOREGROUND
    const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
      console.log('📱 Foreground Event Type:', type);
      console.log('📱 Notification Detail:', detail);

      // 🔥 Check if navigation is locked (prevent duplicate)
      const now = Date.now();
      if (this.isNavigating || (now - this.lastNavigationTime) < this.NAVIGATION_COOLDOWN) {
        console.log('⚠️ Navigation locked or cooldown active, skipping foreground event');
        return;
      }

      // 🔥 Check if already handled by background event
      const alreadyNavigated = await AsyncStorage.getItem('notificationNavigationDone');
      if (alreadyNavigated === 'true') {
        console.log('⚠️ Already navigated from background event, skipping foreground');
        await AsyncStorage.removeItem('notificationNavigationDone');
        return;
      }

      // Type 1 = PRESS, Type 2 = ACTION_PRESS
      if (type === 1) {
        const notifType = detail.notification?.data?.type;
        
        // 🔥 For ALERT notifications - Navigate IMMEDIATELY in foreground
        if (notifType === 'alert' || notifType === 'system_alert' || notifType === 'employee_alert_to_admin') {
          console.log('🚀 ALERT notification pressed in FOREGROUND - Navigating immediately');
          
          // 🔥 Lock navigation
          this.isNavigating = true;
          this.lastNavigationTime = now;
          
          const alertId = detail.notification?.data?.alertId;
          const cleanAlertId = alertId ? alertId.replace('alert_', '') : Date.now().toString();
          
          const params = {
            alertId: cleanAlertId,
            originalTitle: detail.notification?.data?.alertTitle || detail.notification?.data?.title || detail.notification?.title || '',
            originalReason: detail.notification?.data?.alertReason || detail.notification?.data?.reason || detail.notification?.body || '',
            originalDate: detail.notification?.data?.scheduledDate || detail.notification?.data?.date,
            originalTime: detail.notification?.data?.scheduledTime || detail.notification?.data?.time,
            repeatDaily: detail.notification?.data?.repeatDaily === 'true' || detail.notification?.data?.repeatDaily === true
          };
          
          console.log('📤 Foreground alert navigation params:', params);
          
          // Navigate directly using NavigationService
          setTimeout(() => {
            NavigationService.navigate('EditAlert', params);
            console.log('✅ Alert navigation completed');
          }, 100);
          
          // Unlock after delay
          setTimeout(() => { this.isNavigating = false; }, this.NAVIGATION_COOLDOWN);
          return;
        }
        
        // 🔥 For reminder - SKIP foreground navigation, let AppState handler do it
        if (notifType === 'reminder' || notifType === 'enquiry_reminder') {
          console.log('⏭️ SKIPPING foreground navigation for reminder - AppState will handle');
          return;
        }
        
        // 🔥 Lock navigation
        this.isNavigating = true;
        this.lastNavigationTime = now;
        
        // Handle notification body press for OTHER notification types only
        this.handleNotificationPress(detail.notification, navigationRef);
        
        // Unlock after delay
        setTimeout(() => { this.isNavigating = false; }, this.NAVIGATION_COOLDOWN);
      } else if (type === 2) {
        // Handle action button press (Edit, View, etc.)
        const actionId = detail.pressAction?.id;
        console.log('🎯 Action pressed:', actionId);
        
        // 🔥 For reminder actions - SKIP foreground, let AppState handle
        if (actionId === 'edit_reminder') {
          console.log('⏭️ SKIPPING foreground action for reminder edit - AppState will handle');
          return;
        }
        
        // 🔥 For alert action - Navigate immediately
        if (actionId === 'edit_alert') {
          console.log('🚀 ALERT action pressed - Navigating immediately');
          const alertId = detail.notification?.data?.alertId;
          const cleanAlertId = alertId ? alertId.replace('alert_', '') : Date.now().toString();
          
          const params = {
            alertId: cleanAlertId,
            originalTitle: detail.notification?.data?.title || detail.notification?.title || '',
            originalReason: detail.notification?.data?.reason || detail.notification?.body || '',
            originalDate: detail.notification?.data?.date,
            originalTime: detail.notification?.data?.time,
            repeatDaily: detail.notification?.data?.repeatDaily === 'true' || detail.notification?.data?.repeatDaily === true
          };
          
          setTimeout(() => {
            NavigationService.navigate('EditAlert', params);
          }, 100);
          return;
        }
        
        // 🔥 Lock navigation
        this.isNavigating = true;
        this.lastNavigationTime = now;
        
        this.handleNotificationPress(detail.notification, navigationRef);
        
        // Unlock after delay
        setTimeout(() => { this.isNavigating = false; }, this.NAVIGATION_COOLDOWN);
      }
    });

    // Handle notification press when app is BACKGROUND or KILLED
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('🌅 Background Event Type:', type);
      console.log('🌅 Notification Detail:', JSON.stringify(detail, null, 2));

      // Type 1 = PRESS, Type 2 = ACTION_PRESS
      if (type === 1) {
        // 🔥 CRITICAL: Navigate immediately for ALERT notifications
        const notifType = detail.notification?.data?.type || detail.notification?.data?.notificationType;
        console.log('🎯 Background notification type:', notifType);
        
        if (notifType === 'alert' || notifType === 'system_alert' || notifType === 'employee_alert_to_admin') {
          console.log('🚀🚀 ALERT detected in background - Preparing navigation');
          
          const alertId = detail.notification?.data?.alertId;
          const cleanAlertId = alertId ? alertId.replace('alert_', '') : Date.now().toString();
          
          const params = {
            alertId: cleanAlertId,
            originalTitle: detail.notification?.data?.alertTitle || detail.notification?.data?.title || detail.notification?.title || '',
            originalReason: detail.notification?.data?.alertReason || detail.notification?.data?.reason || detail.notification?.body || '',
            originalDate: detail.notification?.data?.scheduledDate || detail.notification?.data?.date,
            originalTime: detail.notification?.data?.scheduledTime || detail.notification?.data?.time,
            repeatDaily: detail.notification?.data?.repeatDaily === 'true' || detail.notification?.data?.repeatDaily === true
          };
          
          console.log('📤 Background: Storing alert navigation params:', params);
          
          // 🔥 Store with immediate flag for AppState handler
          const notificationData = {
            id: detail.notification?.id,
            data: detail.notification?.data,
            body: detail.notification?.body,
            timestamp: new Date().toISOString(),
            shouldNavigateImmediately: true,
            navigateTo: 'EditAlert',
            navigationParams: params
          };
          
          await require('@react-native-async-storage/async-storage').default.setItem(
            'pendingNotificationData',
            JSON.stringify(notificationData)
          );
          console.log('✅ Alert notification stored for IMMEDIATE navigation');
          return;
        } else if (notifType === 'reminder' || notifType === 'enquiry_reminder') {
          // 🔥 CRITICAL: Same handling for REMINDER notifications in background
          console.log('🚀🚀 REMINDER detected in background - Preparing navigation');
          
          const params = {
            reminderId: detail.notification?.data?.reminderId || detail.notification?.id,
            clientName: detail.notification?.data?.clientName || 'Client',
            originalMessage: detail.notification?.data?.message || detail.notification?.body || '',
            enquiryId: detail.notification?.data?.enquiryId,
            fromNotification: true
          };
          
          console.log('📤 Background: Storing reminder navigation params:', params);
          
          // 🔥 Store with immediate flag for AppState handler
          const notificationData = {
            id: detail.notification?.id,
            data: detail.notification?.data,
            body: detail.notification?.body,
            timestamp: new Date().toISOString(),
            shouldNavigateImmediately: true,
            navigateTo: 'EditReminder',
            navigationParams: params
          };
          
          await require('@react-native-async-storage/async-storage').default.setItem(
            'pendingNotificationData',
            JSON.stringify(notificationData)
          );
          console.log('✅ Reminder notification stored for IMMEDIATE navigation');
          return;
        }
        
        // For other notifications, store the notification data to process when app resumes
        await this.storeNotificationData(detail.notification);
      } else if (type === 2) {
        // Handle action button press
        const actionId = detail.pressAction?.id;
        console.log('🎯 Background Action pressed:', actionId);
        
        if (actionId === 'edit_reminder' || actionId === 'edit_alert') {
          await this.storeNotificationData(detail.notification, actionId);
        } else {
          await this.storeNotificationData(detail.notification);
        }
      }
    });

    // Check for initial notification if app was killed and reopened by notification
    this.checkInitialNotification(navigationRef);

    return unsubscribeForeground;
  }

  /**
   * Handle edit action from notification
   * Navigate to EditReminderScreen or EditAlertScreen
   * @param {Object} notification - Notification object
   * @param {Object} navigationRef - React Navigation ref
   * @param {string} actionId - Action ID (edit_reminder or edit_alert)
   */
  static async handleEditAction(notification, navigationRef, actionId) {
    try {
      console.log('✏️ Handling edit action:', actionId);
      const notificationData = notification?.data;

      if (!notificationData) {
        console.warn('⚠️ No data in notification');
        return;
      }

      if (actionId === 'edit_reminder') {
        // Navigate to EditReminderScreen
        const editParams = {
          reminderId: notificationData.reminderId || notification.id,
          clientName: notificationData.clientName || 'Client',
          originalMessage: notification.body || '',
          enquiryId: notificationData.enquiryId,
        };

        console.log('📤 Navigating to EditReminderScreen with:', editParams);
        
        // 🔥 Use NavigationService navigateNested to stay in Admin stack
        NavigationService.navigateNested('AdminApp', 'EditReminder', editParams);
      } else if (actionId === 'edit_alert') {
        // Navigate to EditAlertScreen
        const editParams = {
          alertId: notificationData.alertId?.replace('alert_', '') || notification.id?.replace('alert_', ''),
          originalReason: notification.body || '',
          originalDate: notificationData.date,
          originalTime: notificationData.time,
          repeatDaily: notificationData.repeatDaily,
        };

        console.log('📤 Navigating to EditAlertScreen with:', editParams);
        
        // 🔥 Use NavigationService navigateNested to stay in Admin stack
        NavigationService.navigateNested('AdminApp', 'EditAlert', editParams);
      }
    } catch (error) {
      console.error('❌ Error handling edit action:', error);
    }
  }

  /**
   * Handle notification press and navigate to target screen
   * @param {Object} notification - Notification object from notifee
   * @param {Object} navigationRef - React Navigation ref (optional, uses NavigationService)
   */
  static async handleNotificationPress(notification, navigationRef = null) {
    try {
      console.log('🎯 Handling notification press');
      const notificationData = notification?.data;

      if (!notificationData) {
        console.warn('⚠️ No data in notification');
        return;
      }

      console.log('📱 Notification Data:', notificationData);

      const type = notificationData.type || notificationData.notificationType;

      // Check if this is a reminder or alert notification - SKIP navigation here
      // AppState handler will navigate when app comes to foreground from background
      if (type === 'reminder' || type === 'enquiry_reminder' || type === 'employee_reminder_to_admin') {
        console.log('⏭️ Reminder notification detected - SKIPPING navigation (AppState will handle)');
        // DO NOT navigate here - this prevents duplicate navigation
        return;
      }

      if (type === 'alert' || type === 'system_alert' || type === 'employee_alert_to_admin') {
        console.log('🚀 Alert notification - Navigating to EditAlert');
        
        const alertId = notificationData.alertId;
        const cleanAlertId = alertId ? alertId.replace('alert_', '') : Date.now().toString();
        
        const params = {
          alertId: cleanAlertId,
          originalTitle: notificationData.alertTitle || notificationData.title || notification?.title || '',
          originalReason: notificationData.alertReason || notificationData.reason || notification?.body || '',
          originalDate: notificationData.scheduledDate || notificationData.date,
          originalTime: notificationData.scheduledTime || notificationData.time,
          repeatDaily: notificationData.repeatDaily === 'true' || notificationData.repeatDaily === true
        };
        
        console.log('📤 Alert navigation params:', params);
        NavigationService.navigate('EditAlert', params);
        return;
      }

      // Extract navigation parameters from notification data for other types
      const {
        targetScreen = type === 'enquiry_reminder' ? 'EnquiriesScreen' : 'EnquiryDetails',
        navigationType = 'nested',
        enquiryId,
        clientName,
        reminderId,
        navigationData = {} // Additional navigation data
      } = notificationData;

      // Prepare comprehensive navigation data
      const navData = {
        targetScreen: type === 'enquiry_reminder' ? 'EnquiriesScreen' : targetScreen,
        navigationType,
        enquiryId,
        clientName,
        reminderId,
        navigationData: {
          ...navigationData,
          scrollToEnquiry: enquiryId,
          showDetails: true,
          fromNotification: true,
          isReminderNotification: type === 'enquiry_reminder',
          timestamp: Date.now()
        }
      };

      console.log('🚀 Prepared navigation data:', navData);

      // Use NavigationService for navigation
      const success = await NavigationService.navigateFromNotification(navData);
      
      if (!success) {
        console.warn('⚠️ Navigation failed, storing for later');
        await this.storeNotificationData(notification);
      }
    } catch (error) {
      console.error('❌ Error handling notification press:', error);
      await this.storeNotificationData(notification);
    }
  }

  /**
   * Check if app was opened by notification (when killed/closed)
   * @param {Object} navigationRef - React Navigation ref
   */
  static checkInitialNotification(navigationRef) {
    notifee
      .getInitialNotification()
      .then((initialNotification) => {
        if (initialNotification) {
          console.log('🚀 App opened from killed state by notification');
          console.log('📱 Initial Notification:', initialNotification.notification);

          // Small delay to ensure navigation is ready
          setTimeout(() => {
            this.handleNotificationPress(initialNotification.notification, navigationRef);
          }, 1000);
        }
      })
      .catch((error) => {
        console.error('❌ Error checking initial notification:', error);
      });
  }

  /**
   * Store notification data for processing when app resumes
   * Useful when notification is clicked but app is not ready
   * @param {Object} notification - Notification to store
   * @param {string} actionId - Optional action ID (edit_reminder, edit_alert, etc.)
   */
  static async storeNotificationData(notification, actionId = null) {
    try {
      const notificationData = {
        id: notification?.id,
        data: notification?.data,
        body: notification?.body,
        actionId: actionId,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        'pendingNotificationData',
        JSON.stringify(notificationData)
      );
      console.log('💾 Notification data stored for later processing');
    } catch (error) {
      console.error('❌ Error storing notification data:', error);
    }
  }

  /**
   * Retrieve and clear stored notification data
   * Call this from App.js after navigation is ready
   * @returns {Object|null} Stored notification data or null
   */
  static async getPendingNotificationData() {
    try {
      const data = await AsyncStorage.getItem('pendingNotificationData');
      if (data) {
        await AsyncStorage.removeItem('pendingNotificationData');
        const parsedData = JSON.parse(data);
        console.log('📨 Retrieved pending notification data:', parsedData);
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting pending notification:', error);
      return null;
    }
  }

  /**
   * Process pending notification data when app becomes ready
   * @param {Object} navigationRef - React Navigation ref (optional)
   */
  static async processPendingNotification(navigationRef = null) {
    try {
      const pendingData = await this.getPendingNotificationData();
      if (pendingData) {
        console.log('⏳ Processing pending notification');
        
        // 🔥 SKIP EditReminder navigation here - AppState handler will do it
        if (pendingData.navigateTo === 'EditReminder') {
          console.log('⏭️ SKIPPING EditReminder in processPendingNotification - AppState will handle');
          return;
        }
        
        // 🔥 CRITICAL: Check for immediate navigation flag (Alert notifications)
        if (pendingData.shouldNavigateImmediately && pendingData.navigateTo && pendingData.navigationParams) {
          console.log('🚀🚀 IMMEDIATE NAVIGATION REQUIRED for:', pendingData.navigateTo);
          console.log('📤 Navigation params:', pendingData.navigationParams);
          
          // 🔥 NO DELAY - Immediate navigation!
          try {
            const NavigationService = require('./NavigationService').default;
            if (NavigationService.isReady()) {
              NavigationService.navigate(pendingData.navigateTo, pendingData.navigationParams);
              console.log('✅ IMMEDIATE navigation to', pendingData.navigateTo, 'SUCCESS!');
            } else {
              console.error('❌ NavigationService not ready for immediate navigation');
            }
          } catch (navError) {
            console.error('❌ Immediate navigation failed:', navError);
          }
          return;
        }
        
        // Regular notification processing
        if (navigationRef?.current?.isReady?.()) {
          // Create a fake notification object
          const fakeNotification = { 
            id: pendingData.id,
            data: pendingData.data,
            body: pendingData.body,
          };
          
          // Check if it's an edit action
          if (pendingData.actionId === 'edit_reminder' || pendingData.actionId === 'edit_alert') {
            await this.handleEditAction(fakeNotification, navigationRef, pendingData.actionId);
          } else {
            await this.handleNotificationPress(fakeNotification, navigationRef);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing pending notification:', error);
    }
  }
}

export default NotificationHandler;

/**
 * USAGE IN App.js:
 * 
 * 1. In useEffect, setup listeners:
 * ```
 * const unsubscribeNotification = NotificationHandler.setupNotificationListeners(
 *   navigationRef,
 *   (notification) => {
 *     console.log('Notification received:', notification);
 *   }
 * );
 * ```
 * 
 * 2. When navigation becomes ready:
 * ```
 * const onNavigationReady = async () => {
 *   // Process any pending notification from killed state
 *   await NotificationHandler.processPendingNotification(navigationRef);
 * };
 * ```
 * 
 * 3. In cleanup:
 * ```
 * return () => {
 *   if (unsubscribeNotification) {
 *     unsubscribeNotification();
 *   }
 * };
 * ```
 */
