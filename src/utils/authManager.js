/**
 * Authentication State Management Utility
 * Handles login state persistence and management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Check if user is logged in by verifying stored credentials
 */
export const isUserLoggedIn = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    const userId = await AsyncStorage.getItem('userId');
    
    return !!(userToken && userId);
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

/**
 * Get stored user credentials
 */
export const getStoredCredentials = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    const userId = await AsyncStorage.getItem('userId');
    
    return {
      token: userToken,
      userId: userId,
      isLoggedIn: !!(userToken && userId)
    };
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return {
      token: null,
      userId: null,
      isLoggedIn: false
    };
  }
};

/**
 * Store user credentials after successful login
 */
export const storeUserCredentials = async (token, userId) => {
  try {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', String(userId));
    
    console.log('✅ User credentials stored successfully');
    return true;
  } catch (error) {
    console.error('❌ Error storing user credentials:', error);
    return false;
  }
};

/**
 * Clear all user credentials (logout)
 */
export const clearUserCredentials = async () => {
  try {
    console.log('🗑️ Clearing user credentials...');
    
    await AsyncStorage.multiRemove([
      'userToken',
      'userId',
      'userProfile',
      'fcmToken' // Clear FCM token on logout
    ]);
    
    // Verify removal
    const remainingToken = await AsyncStorage.getItem('userToken');
    const remainingUserId = await AsyncStorage.getItem('userId');
    
    console.log('🔍 Verification after clearing:', {
      tokenRemaining: remainingToken,
      userIdRemaining: remainingUserId
    });
    
    console.log('✅ User credentials cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing user credentials:', error);
    return false;
  }
};

/**
 * Logout user and clear all stored data
 */
export const logoutUser = async (navigation) => {
  try {
    console.log('🔄 Starting logout process...');
    
    // Clear all stored credentials
    const cleared = await clearUserCredentials();
    console.log('🗑️ Credentials cleared:', cleared);
    
    // Verify credentials are actually cleared
    const verifyCredentials = await getStoredCredentials();
    console.log('🔍 Verification after logout:', verifyCredentials);
    
    // Reset navigation stack to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
    
    console.log('✅ User logged out successfully');
    return true;
  } catch (error) {
    console.error('❌ Error during logout:', error);
    return false;
  }
};

/**
 * Auto-login check for app startup
 */
export const checkAutoLogin = async (navigation) => {
  try {
    console.log('🔍 Checking auto-login status...');
    
    const credentials = await getStoredCredentials();
    console.log('📋 Retrieved credentials:', {
      hasToken: !!credentials.token,
      hasUserId: !!credentials.userId,
      isLoggedIn: credentials.isLoggedIn
    });
    
    if (credentials.isLoggedIn) {
      console.log('✅ User is logged in, navigating to Home');
      navigation.replace('Home');
    } else {
      console.log('❌ User not logged in, navigating to Login');
      navigation.replace('LoginScreen');
    }
  } catch (error) {
    console.error('❌ Error during auto-login check:', error);
    // Default to login screen on error
    navigation.replace('LoginScreen');
  }
};

/**
 * Check if user token is still valid (optional server validation)
 */
export const validateUserToken = async () => {
  try {
    const { token } = await getStoredCredentials();
    
    if (!token) {
      return false;
    }
    
    // TODO: Add server-side token validation if needed
    // const response = await fetch('/api/validate-token', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return response.ok;
    
    return true; // For now, assume token is valid if it exists
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Get user info for display purposes
 */
export const getUserInfo = async () => {
  try {
    const credentials = await getStoredCredentials();
    const userProfile = await AsyncStorage.getItem('userProfile');
    
    return {
      ...credentials,
      profile: userProfile ? JSON.parse(userProfile) : null
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};