/**
 * Quick notification status component for real-time debugging
 */

import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export const showQuickNotificationStatus = async () => {
  try {
    // Quick status check
    const authStatus = await messaging().requestPermission();
    const token = await messaging().getToken();
    const hasPermission = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    const status = {
      permission: hasPermission ? '✅ Granted' : '❌ Denied',
      token: token ? '✅ Available' : '❌ Missing',
      tokenPreview: token ? token.substring(0, 30) + '...' : 'None'
    };
    
    Alert.alert(
      '📊 Notification Status',
      `Permission: ${status.permission}\n` +
      `FCM Token: ${status.token}\n` +
      `Token: ${status.tokenPreview}`,
      [
        { text: 'OK' },
        {
          text: 'Copy Token',
          onPress: () => {
            console.log('🎫 Full FCM Token:', token);
            console.log('🎫 Use this token in Firebase Console for testing');
          }
        }
      ]
    );
    
    return status;
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    Alert.alert('❌ Status Check Failed', error.message);
    return null;
  }
};

export default { showQuickNotificationStatus };