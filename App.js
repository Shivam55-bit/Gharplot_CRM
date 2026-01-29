import React, { useEffect, useRef, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, AppState } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeFCM } from './src/utils/fcmService';
import { Alert, Linking } from 'react-native';
import ReminderPopup from './src/crm/components/Reminders/ReminderPopup';
import EmployeeNotificationPopup from './src/components/EmployeeNotificationPopup';
import { setShowPopupCallback } from './src/services/EmployeePopupManager';
import reminderManager from './src/crm/services/reminderManager';
import ReminderNotificationService from './src/services/ReminderNotificationService';
import AlertNotificationService from './src/services/AlertNotificationService';
import NotificationHandler from './src/services/NotificationHandler';
import NavigationService, { navigationRef } from './src/services/NavigationService';
import notifee from '@notifee/react-native';

// Import FCM debug helper in development mode
if (__DEV__) {
  import('./src/utils/fcmDebugHelper').catch(() => console.log('fcmDebugHelper not found'));
  import('./src/utils/fcmReminderTestHelper').catch(() => console.log('fcmReminderTestHelper not found'));
  // import('./test-notification-navigation'); // Temporarily disabled
  // import('./src/utils/testFCM'); // Temporarily disabled
  import('./test-background-alert-navigation').catch(() => console.log('test-background-alert-navigation not found'));
}

const AppMain = () => {
  const [currentReminder, setCurrentReminder] = useState(null);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [appError, setAppError] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  
  // Employee Notification Popup State
  const [employeePopupVisible, setEmployeePopupVisible] = useState(false);
  const [employeePopupData, setEmployeePopupData] = useState(null);
  
  // Setup Employee Popup callback
  useEffect(() => {
    setShowPopupCallback((data) => {
      console.log('📱 Showing Employee Notification Popup:', data);
      setEmployeePopupData(data);
      setEmployeePopupVisible(true);
    });
  }, []);

  // 🔥 CRITICAL: AppState listener to handle background -> foreground transition
  useEffect(() => {
    // 🔥 Track if we already processed this transition
    let isProcessingNavigation = false;
    
    const handleAppStateChange = async (nextAppState) => {
      console.log('📱 AppState changed from', appStateRef.current, 'to', nextAppState);
      
      // When app comes to FOREGROUND from BACKGROUND
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🎬 App came to FOREGROUND - Checking pending notifications');
        
        // 🔥 Prevent multiple processing
        if (isProcessingNavigation) {
          console.log('⚠️ Already processing navigation, skipping...');
          appStateRef.current = nextAppState;
          return;
        }
        
        isProcessingNavigation = true;
        
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          
          const pendingData = await AsyncStorage.getItem('pendingNotificationData');
          
          if (pendingData) {
            // 🔥 IMMEDIATELY clear data to prevent duplicate processing
            await AsyncStorage.removeItem('pendingNotificationData');
            
            const data = JSON.parse(pendingData);
            console.log('📨 Found pending notification:', data.navigateTo);
            
            if (data.shouldNavigateImmediately && data.navigateTo && data.navigationParams) {
              console.log('🚀 SINGLE NAVIGATION - Processing now!');
              
              // 🔥 Wait for navigation to be ready, then navigate ONCE
              const waitAndNavigate = () => {
                if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
                  const currentRoute = navigationRef.getCurrentRoute();
                  
                  // Skip if already on target screen
                  if (currentRoute?.name === data.navigateTo) {
                    console.log('⚠️ Already on target screen');
                    isProcessingNavigation = false;
                    return;
                  }
                  
                  console.log('📤 Navigating to:', data.navigateTo);
                  navigationRef.navigate(data.navigateTo, data.navigationParams);
                  console.log('✅ Navigation done');
                  
                  // Reset after successful navigation
                  setTimeout(() => { isProcessingNavigation = false; }, 3000);
                } else {
                  // Wait 500ms and try once more
                  setTimeout(() => {
                    if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
                      navigationRef.navigate(data.navigateTo, data.navigationParams);
                      console.log('✅ Delayed navigation done');
                    }
                    isProcessingNavigation = false;
                  }, 500);
                }
              };
              
              waitAndNavigate();
            } else {
              isProcessingNavigation = false;
            }
          } else {
            isProcessingNavigation = false;
          }
        } catch (error) {
          console.error('❌ AppState navigation error:', error);
          isProcessingNavigation = false;
        }
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let fcmCleanup = null;
    let unsubscribeNotificationPress = null;

    const initializeApp = async () => {
      try {
        console.log('🚀 Starting App initialization...');

        // Initialize Reminder Manager with error handling
        try {
          await reminderManager.initialize((reminder) => {
            console.log('🔔 Reminder popup triggered for:', reminder.name);
            setCurrentReminder(reminder);
            setShowReminderPopup(true);
          });
          console.log('✅ Reminder Manager initialized');
        } catch (reminderError) {
          console.error('❌ Reminder Manager initialization failed:', reminderError);
          // Continue app startup even if reminder manager fails
        }

        // 🔔 Initialize ReminderNotificationService for background notifications
        const initializeNotifications = async () => {
          try {
            console.log('🚀 Initializing ReminderNotificationService...');
            const initialized = await ReminderNotificationService.initialize();
            if (initialized) {
              console.log('✅ ReminderNotificationService ready for background reminders');
            } else {
              console.warn('⚠️ Failed to initialize notification service');
            }
            
            // Also initialize AlertNotificationService
            console.log('🚀 Initializing AlertNotificationService...');
            const alertInitialized = await AlertNotificationService.initialize();
            if (alertInitialized) {
              console.log('✅ AlertNotificationService ready for system alerts');
            } else {
              console.warn('⚠️ Failed to initialize alert notification service');
            }
          } catch (error) {
            console.error('❌ Notification service initialization error:', error);
            // Don't crash the app for notification service failures
          }
        };

        // Initialize notifications
        await initializeNotifications();

        // 🔔 Handle notification press events with proper navigation
        const setupNotificationListeners = () => {
          try {
            // Setup all notification listeners (foreground, background, killed)
            const listener = NotificationHandler.setupNotificationListeners(
              navigationRef, // Still pass ref for compatibility
              (notification) => {
                console.log('📱 Notification received in App:', notification);
              }
            );
            console.log('✅ Notification listeners setup complete');
            return listener;
          } catch (listenerError) {
            console.error('❌ Notification listener setup failed:', listenerError);
            return null; // Return null instead of crashing
          }
        };

        // Setup notification listeners
        unsubscribeNotificationPress = setupNotificationListeners();

        // 🎯 CRITICAL: Setup direct background notification tap handler
        // 🔥 NOTE: Notifee already handles background events - FCM handler is BACKUP only
        const setupBackgroundTapHandler = () => {
          try {
            const messaging = require('@react-native-firebase/messaging').default;
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            
            // Handle notification tap when app is in BACKGROUND (Firebase FCM)
            // 🔥 This is a BACKUP - Notifee's onBackgroundEvent should handle most cases
            const unsubscribe = messaging().onNotificationOpenedApp(async remoteMessage => {
              console.log('🔔🔔 BACKGROUND TAP (FCM) - Notification opened:', JSON.stringify(remoteMessage, null, 2));
              
              const notifType = remoteMessage.data?.type || remoteMessage.data?.notificationType;
              console.log('🎯 Notification Type:', notifType);
              
              // 🔥 SKIP reminder/alert - Notifee handles these
              if (notifType === 'reminder' || notifType === 'enquiry_reminder') {
                console.log('⏭️ SKIPPING FCM handler for reminder - Notifee will handle');
                return;
              }
              
              // 🔥 Check if Notifee already stored this notification
              const existingData = await AsyncStorage.getItem('pendingNotificationData');
              if (existingData) {
                console.log('⚠️ Notifee already stored data, skipping FCM handler');
                return;
              }
              
              if (notifType === 'alert' || notifType === 'system_alert') {
                console.log('🚀🚀🚀 ALERT DETECTED (FCM BACKUP) - Storing for navigation');
                
                const params = {
                  alertId: remoteMessage.data.alertId?.replace('alert_', '') || remoteMessage.data.alertId || Date.now().toString(),
                  originalReason: remoteMessage.data.reason || remoteMessage.notification?.body || '',
                  originalDate: remoteMessage.data.date,
                  originalTime: remoteMessage.data.time,
                  repeatDaily: remoteMessage.data.repeatDaily === 'true' || remoteMessage.data.repeatDaily === true
                };
                
                console.log('📤 Storing alert for navigation:', params);
                
                // Store for immediate navigation when app comes to foreground
                const notificationData = {
                  id: remoteMessage.messageId,
                  data: remoteMessage.data,
                  timestamp: new Date().toISOString(),
                  shouldNavigateImmediately: true,
                  navigateTo: 'EditAlert',
                  navigationParams: params
                };
                
                AsyncStorage.setItem('pendingNotificationData', JSON.stringify(notificationData))
                  .then(() => console.log('✅ Alert stored in AsyncStorage'))
                  .catch(err => console.error('❌ Failed to store alert:', err));
              }
              // 🔥 Reminder handling REMOVED - Notifee handles it to prevent duplicate
            });
            
            console.log('✅ Background tap handler registered successfully');
            return unsubscribe;
          } catch (error) {
            console.error('❌ Background tap handler setup failed:', error);
          }
        };

        // Setup background tap handler
        console.log('✅ Background tap handler setup complete (Killed state handled by SplashScreen)');
        setupBackgroundTapHandler();

        // Initialize FCM after other notifications are setup
        try {
          setupFCM();
          console.log('✅ FCM setup initiated');
        } catch (fcmError) {
          console.error('❌ FCM setup failed:', fcmError);
          // Don't crash the app for FCM failures
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setAppError(error.message || 'App initialization failed');
      }
    };

    initializeApp();

    // ✅ ENHANCED: Debug commands for App level reminder testing
    if (__DEV__) {
      global.debugAppReminders = {
        // Test popup immediately with mock reminder
        testPopupNow: () => {
          const mockReminder = {
            id: 'test-popup-' + Date.now(),
            title: '🧪 Test Popup',
            note: 'This is a test popup for debugging the reminder system',
            name: 'Test Client',
            phone: '9999999999',
            contactNumber: '9999999999',
            location: 'Test Location',
            reminderDateTime: new Date().toISOString(),
            status: 'pending',
            assignmentType: 'enquiry',
            productType: 'Residential',
            caseStatus: 'Open',
            source: 'Test',
            clientCode: 'CC999',
            projectCode: 'PC999',
            serialNumber: '999'
          };
          
          setCurrentReminder(mockReminder);
          setShowReminderPopup(true);
          console.log('🧪 Test popup triggered manually');
          return 'Test popup shown';
        },

        // Check if popup is working
        checkPopup: () => {
          console.log('🔍 Popup State:');
          console.log('  Show popup:', showReminderPopup);
          console.log('  Current reminder:', currentReminder?.title || 'None');
          return {
            showPopup: showReminderPopup,
            reminder: currentReminder?.title || 'None'
          };
        },

        // Force close popup
        closePopup: () => {
          setShowReminderPopup(false);
          setCurrentReminder(null);
          console.log('🚪 Popup manually closed');
          return 'Popup closed';
        }
      };

      setTimeout(() => {
        console.log('🛠️ App Level Debug Commands Available:');
        console.log('  • global.debugAppReminders.testPopupNow() - Show test popup immediately');
        console.log('  • global.debugAppReminders.checkPopup() - Check popup state');
        console.log('  • global.debugAppReminders.closePopup() - Force close popup');
        console.log('');
        console.log('📱 Combined with ReminderManager debug commands for complete testing');
      }, 4000);
    }

    // Initialize Firebase Cloud Messaging
    const setupFCM = async () => {
      try {
        console.log('🚀 Starting FCM setup in App.js...');
        
        const result = await initializeFCM(
          // Callback for token refresh
          async (newToken) => {
            console.log('🔄 FCM Token refreshed in App.js:', newToken?.substring(0, 20) + '...');
            
            // Send updated token to backend
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const userId = await AsyncStorage.getItem('userId');
              
              if (userId && newToken) {
                // You can add your backend token update API call here
                console.log('📤 Should send updated FCM token to backend for user:', userId);
                // await sendTokenToBackend(userId, newToken);
              }
            } catch (syncError) {
              console.warn('⚠️ Token sync failed (non-critical):', syncError.message);
            }
          },
          
          // Callback for notification opened
          (notification) => {
            console.log('🔔 Notification opened in App.js:', notification);
            
            try {
              // Add notification to local storage for display in notification list
              const { addNotification } = require('./src/utils/notificationManager');
              if (notification && notification.notification) {
                addNotification({
                  type: notification.data?.type || 'system',
                  title: notification.notification.title,
                  message: notification.notification.body,
                  propertyId: notification.data?.propertyId,
                  chatId: notification.data?.chatId,
                  inquiryId: notification.data?.inquiryId,
                  image: notification.data?.image
                });
              }
              
              // Use notification service to handle navigation
              if (navigationRef.current) {
                const { handleNotificationAction } = require('./src/services/notificationService');
                handleNotificationAction(notification.data || notification, navigationRef.current);
              }
            } catch (notificationError) {
              console.error('❌ Error handling opened notification:', notificationError);
            }
          }
        );

        if (result.configured && result.token) {
          console.log('✅ FCM initialized successfully with token:', result.token.substring(0, 20) + '...');
          
          // Store token locally for debugging
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('current_fcm_token', result.token);
          
        } else if (!result.configured) {
          console.warn('⚠️ FCM not properly configured:', result.error);
        } else {
          console.warn('⚠️ FCM configured but no token received');
        }

        fcmCleanup = result.cleanup;
        
      } catch (error) {
        console.warn('⚠️ FCM initialization failed (non-critical):', error.message);
        
        // Don't show alerts in production - only log the issue
        if (__DEV__) {
          setTimeout(() => {
            console.log('FCM Error Details:', {
              message: error.message,
              stack: error.stack?.substring(0, 200)
            });
          }, 1000);
        }
        
        // Continue app startup even if FCM fails
        fcmCleanup = () => {}; // No-op cleanup function
      }
    };

    setupFCM();

    // Cleanup on unmount
    return () => {
      try {
        if (fcmCleanup && typeof fcmCleanup === 'function') {
          fcmCleanup();
        }
        if (unsubscribeNotificationPress && typeof unsubscribeNotificationPress === 'function') {
          unsubscribeNotificationPress();
        }
        if (reminderManager && reminderManager.stopChecking) {
          reminderManager.stopChecking();
        }
        console.log('✅ App cleanup completed');
      } catch (cleanupError) {
        console.error('❌ Error during app cleanup:', cleanupError);
        // Don't throw error during cleanup
      }
    };
  }, []);

  const handleReminderClose = async (response) => {
    try {
      if (currentReminder && response) {
        await reminderManager.markAsCompleted(currentReminder.id, response);
      }
      setShowReminderPopup(false);
      setCurrentReminder(null);
    } catch (error) {
      console.error('❌ Error closing reminder:', error);
      // Still close the popup even if marking as completed fails
      setShowReminderPopup(false);
      setCurrentReminder(null);
    }
  };

  // Handle navigation ready - process pending notifications
  const onNavigationReady = async () => {
    console.log('✅ Navigation is ready');
    
    // 🔥 CRITICAL: Set global navigationRef for Notifee background handler
    global.navigationRef = navigationRef;
    console.log('✅ Global navigationRef set for background notifications');
    
    // Process any pending notification from killed state using NavigationService
    await NotificationHandler.processPendingNotification();
    
    // Also check for stored retry notifications
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const retryData = await AsyncStorage.getItem('retryNotificationNavigation');
      
      if (retryData) {
        console.log('🔄 Found retry notification data, processing...');
        const parsedData = JSON.parse(retryData);
        
        // Remove from storage first
        await AsyncStorage.removeItem('retryNotificationNavigation');
        
        // Process the retry navigation
        const success = await NavigationService.navigateFromNotification(parsedData);
        if (success) {
          console.log('✅ Retry notification navigation successful');
        } else {
          console.warn('⚠️ Retry notification navigation failed');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error processing retry notifications:', error.message);
    }
  };

  return (
    <>
      {appError ? (
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Loading Error</Text>
          <Text style={styles.errorText}>
            There was an issue loading the app. Please restart the application.
          </Text>
          <Text style={styles.errorDetails}>
            Error: {appError}
          </Text>
        </SafeAreaView>
      ) : (
        <AppNavigator ref={navigationRef} onReady={onNavigationReady} />
      )}
      
      {/* Reminder Popup */}
      <ReminderPopup
        visible={showReminderPopup}
        reminder={currentReminder}
        navigation={navigationRef.current}
        onClose={handleReminderClose}
      />
      
      {/* Employee Notification Popup for Admin */}
      <EmployeeNotificationPopup
        visible={employeePopupVisible}
        type={employeePopupData?.type || 'reminder'}
        employeeName={employeePopupData?.employeeName || 'Employee'}
        title={employeePopupData?.title || ''}
        clientName={employeePopupData?.clientName || ''}
        reason={employeePopupData?.reason || ''}
        onClose={() => {
          setEmployeePopupVisible(false);
          setEmployeePopupData(null);
        }}
      />
    </>
  );
};

// Error boundary styles
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorDetails: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

// Main App Component wrapped with Error Boundary
const App = () => {
  return (
    <ErrorBoundary>
      <AppMain />
    </ErrorBoundary>
  );
};

export default App;
