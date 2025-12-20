/**
 * CRM API Configuration
 * Base URL and common utilities for all CRM APIs
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production server URL
export const CRM_BASE_URL = 'https://abc.bhoomitechzone.us';
export const OTP_BASE_URL = 'http://abc.ridealmobility.com';

/**
 * Get authentication headers with CRM token
 */
export const getCRMAuthHeaders = async () => {
  try {
    // Try multiple token keys for compatibility
    const crmToken = await AsyncStorage.getItem('crm_auth_token');
    const adminToken = await AsyncStorage.getItem('adminToken');
    const employeeToken = await AsyncStorage.getItem('employee_auth_token');
    
    const token = crmToken || adminToken || employeeToken;
    
    if (token) {
      console.log('🔐 Token found, length:', token.length);
    } else {
      console.warn('⚠️ No authentication token found');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  } catch (error) {
    console.error('Error getting CRM auth headers:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
};

/**
 * Handle API response - Safely parse JSON and detect HTML responses
 */
export const handleCRMResponse = async (response) => {
  try {
    // Get response as text first
    const textResponse = await response.text();
    
    // Check if response is HTML (error page)
    if (textResponse.trim().startsWith('<')) {
      console.error('❌ Received HTML instead of JSON');
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Session expired. Please login again.');
      } else if (response.status === 404) {
        throw new Error('API endpoint not found. Backend may not be ready.');
      } else {
        throw new Error('Invalid response from server. Please try again.');
      }
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Invalid server response format.');
    }
    
    // Check HTTP status
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    // Re-throw with better error message
    if (error.message) {
      throw error;
    }
    throw new Error('Network request failed. Please check your connection.');
  }
};

/**
 * Build query string from params object
 */
export const buildQueryString = (params = {}) => {
  const queryParts = [];
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParts.push(`${key}=${encodeURIComponent(params[key])}`);
    }
  });
  return queryParts.join('&');
};
