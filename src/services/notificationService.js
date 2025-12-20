/**
 * Simple Notification Service
 * Integrates with existing backend APIs for sending notifications
 */

import { post } from './api';
import { getFCMToken } from '../utils/fcmService';

/**
 * Send notification when new property is added
 * NOTE: Backend automatically sends notifications when property is added
 * This function is for manual testing or special cases
 */
export const sendNewPropertyNotification = async (propertyData) => {
    try {
        console.log('📢 New property notification would be sent for:', propertyData);
        console.log('ℹ️  Backend automatically sends notifications when properties are added via addProperty API');
        
        // For testing purposes, we can simulate the backend notification format
        const testNotification = {
            title: "🏠 New Property Added!",
            body: "A new property has just been listed.",
            data: {
                propertyId: propertyData.propertyId || propertyData.id
            }
        };
        
        console.log('🧪 Test notification format:', testNotification);
        return { success: true, message: 'Backend handles this automatically' };
    } catch (error) {
        console.error('❌ Failed to process new property notification:', error);
    }
};

/**
 * Send notification for new inquiry
 * Uses existing 'inquiry' API
 */
export const sendInquiryNotification = async (inquiryData) => {
    try {
        const payload = {
            title: "📋 New Property Inquiry",
            body: `${inquiryData.buyerName} is interested in your property`,
            data: {
                type: 'new_inquiry',
                propertyId: inquiryData.propertyId,
                inquiryId: inquiryData.id,
                action: 'view_inquiry'
            },
            ownerId: inquiryData.ownerId
        };

        const response = await post('/api/notifications/inquiry', payload);
        console.log('✅ Inquiry notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to send inquiry notification:', error);
    }
};

/**
 * Send chat message notification
 * Uses existing 'chat' API
 */
export const sendChatNotification = async (messageData) => {
    try {
        const payload = {
            title: "💬 New Message",
            body: messageData.message.substring(0, 50) + "...",
            data: {
                type: 'new_message',
                chatId: messageData.chatId,
                senderId: messageData.senderId,
                propertyId: messageData.propertyId,
                action: 'open_chat'
            },
            receiverId: messageData.receiverId
        };

        const response = await post('/api/notifications/chat', payload);
        console.log('✅ Chat notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to send chat notification:', error);
    }
};

/**
 * Send service cancellation notification
 * Uses existing 'service cancel' API
 */
export const sendServiceCancelNotification = async (serviceData) => {
    try {
        const payload = {
            title: "❌ Service Cancelled",
            body: `Your ${serviceData.serviceName} appointment has been cancelled`,
            data: {
                type: 'service_cancelled',
                serviceId: serviceData.id,
                reason: serviceData.reason,
                action: 'view_services'
            },
            userId: serviceData.userId
        };

        const response = await post('/api/notifications/service-cancel', payload);
        console.log('✅ Service cancel notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to send service cancel notification:', error);
    }
};

/**
 * Send service completion notification
 * Uses existing 'service complete' API
 */
export const sendServiceCompleteNotification = async (serviceData) => {
    try {
        const payload = {
            title: "✅ Service Completed",
            body: `Your ${serviceData.serviceName} has been completed successfully`,
            data: {
                type: 'service_completed',
                serviceId: serviceData.id,
                rating: serviceData.rating,
                action: 'rate_service'
            },
            userId: serviceData.userId
        };

        const response = await post('/api/notifications/service-complete', payload);
        console.log('✅ Service complete notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to send service complete notification:', error);
    }
};

/**
 * Send system update notification using the real backend API
 * POST https://abc.bhoomitechzone.us/application/notify-update
 */
export const sendSystemUpdateNotification = async (updateData) => {
    try {
        // Use the actual backend endpoint
        const apiUrl = 'https://abc.bhoomitechzone.us/application/notify-update';
        
        const payload = {
            title: updateData.title || "New App Update Available!",
            message: updateData.message || updateData.description || "A new version of the Real Estate app is now available. Update to enjoy the latest features and improvements."
        };

        console.log('📤 Sending app update notification:', payload);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ App update notification sent successfully:', result);
            console.log(`📊 Sent to: ${result.sentCount} users, Failed: ${result.failedCount} users`);
        } else {
            console.error('❌ App update notification failed:', result);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Failed to send app update notification:', error);
        throw error;
    }
};

/**
 * Broadcast app update notification to all users
 * This is a convenience function for sending app updates
 */
export const broadcastAppUpdate = async (version, customMessage) => {
    try {
        const updateData = {
            title: `🚀 GharPlot v${version} Available!`,
            message: customMessage || `New version ${version} is now available with exciting new features and improvements. Update now for the best experience!`
        };

        const result = await sendSystemUpdateNotification(updateData);
        return result;
    } catch (error) {
        console.error('❌ Failed to broadcast app update:', error);
        throw error;
    }
};

/**
 * Handle notification tap/open actions
 */
export const handleNotificationAction = (notificationData, navigation) => {
    const { type, action, propertyId } = notificationData;

    console.log('🔔 Handling notification action:', { type, action, propertyId });

    // Handle backend's new property notification format
    if (propertyId && !action) {
        console.log('🏠 Opening property details for:', propertyId);
        navigation.navigate('PropertyDetailsScreen', { 
            itemId: propertyId 
        });
        return;
    }

    switch (action) {
        case 'view_property':
            navigation.navigate('PropertyDetailsScreen', { 
                itemId: notificationData.propertyId 
            });
            break;

        case 'view_inquiry':
            navigation.navigate('MyBookingsScreen', {
                tab: 'inquiries',
                inquiryId: notificationData.inquiryId
            });
            break;

        case 'open_chat':
            // Enhanced chat navigation with sender info
            const chatParams = {
                chatId: notificationData.chatId,
                propertyId: notificationData.propertyId,
            };
            
            // Add user info if available
            if (notificationData.senderName) {
                chatParams.user = {
                    fullName: notificationData.senderName,
                    _id: notificationData.senderId
                };
            }
            
            navigation.navigate('ChatDetailScreen', chatParams);
            break;

        case 'view_services':
            navigation.navigate('ServicesScreen');
            break;

        case 'rate_service':
            navigation.navigate('ServicesScreen', {
                serviceId: notificationData.serviceId,
                showRating: true
            });
            break;

        case 'update_app':
            // Open app store or show update dialog
            console.log('📱 Redirect to app update:', notificationData.updateUrl);
            break;

        default:
            // Default action - go to home
            navigation.navigate('Home');
            break;
    }
};

/**
 * Setup notification handlers for the app
 * Call this in App.js after FCM initialization
 */
export const setupNotificationHandlers = (navigation) => {
    // This function will be called when notification is tapped
    return (remoteMessage) => {
        if (remoteMessage && remoteMessage.data) {
            handleNotificationAction(remoteMessage.data, navigation);
        }
    };
};

/**
 * Test notification sending (for debugging)
 */
export const sendTestNotification = async () => {
    try {
        const token = await getFCMToken();
        
        const payload = {
            title: "🧪 Test Notification",
            body: "This is a test notification from Gharplot app!",
            data: {
                type: 'test',
                action: 'view_home'
            },
            fcmToken: token
        };

        console.log('🧪 Sending test notification...');
        // You can create a test endpoint in backend or use any existing one
        return payload;
    } catch (error) {
        console.error('❌ Test notification failed:', error);
    }
};