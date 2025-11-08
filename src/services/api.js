/**
 * api.js
 * Base file for handling API requests with Authorization token.
 * Includes generic GET, POST, and PUT utilities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

// EXPORT THE BASE_URL so other files can use it for endpoint construction
// Use HTTPS as the backend endpoint in the provided curl example
export const BASE_URL = 'https://abc.ridealmobility.com';

// --- HELPER FUNCTION TO CONSTRUCT QUERY STRING ---
const buildQuery = (params) => {
    return Object.keys(params).length
        ? '?' + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
        : '';
};
// --------------------------------------------------

// --- URL CLEANUP UTILITY ---
/**
 * Ensures the final URL is correctly formatted with one slash between base and endpoint.
 */
const cleanUrl = (baseUrl, endpoint) => {
    // Remove trailing slash from base and leading slash from endpoint, then combine with a single slash
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${cleanBase}/${cleanEndpoint}`;
};
// ----------------------------------

/**
 * Fetch with timeout and debug logging.
 */
async function fetchWithTimeout(url, options = {}, timeout = 15000) {
    // Log request info and token presence for debugging
    try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('[API] Request:', options.method || 'GET', url);
        console.log('[API] Token present:', !!token);
    } catch (e) {
        console.warn('[API] Failed to read token for debug logging', e);
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const fetchPromise = fetch(url, { ...options, signal });

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const res = await fetchPromise;
        clearTimeout(timeoutId);
        return res;
    } catch (err) {
        clearTimeout(timeoutId);
        // Normalize abort error to a clearer message
        if (err.name === 'AbortError') throw new Error('Network timeout');
        throw err;
    }
}

/**
 * Parse an error response: try JSON first, otherwise return raw text.
 */
async function parseErrorResponse(response) {
    const status = response.status;
    try {
        const json = await response.json();
        const message = json && (json.message || JSON.stringify(json));
        return { status, message, body: json };
    } catch (jsonErr) {
        // Couldn't parse JSON, fall back to text (may be HTML error page)
        try {
            const text = await response.text();
            return { status, message: text, body: text };
        } catch (textErr) {
            return { status, message: `Failed to parse error response (status ${status})`, body: null };
        }
    }
}

/**
 * Refresh the token if expired.
 */
async function refreshToken() {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
            console.warn('[API] No refresh token found. User needs to login again.');
            throw new Error('No refresh token found.');
        }

        const response = await fetchWithTimeout(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            const parsed = await parseErrorResponse(response);
            
            // Handle 404 specifically - endpoint doesn't exist
            if (parsed.status === 404) {
                console.warn('[API] Token refresh endpoint not available (404). Proceeding without refresh.');
                // Return null to indicate refresh not available
                return null;
            }
            
            throw new Error(`Token refresh failed: ${parsed.message}`);
        }

        const { token, refreshToken: newRefreshToken } = await response.json();
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        return token;
    } catch (error) {
        console.error('[API] Token refresh error:', error);
        
        // Don't throw for 404 - just return null
        if (error.message && error.message.includes('404')) {
            return null;
        }
        
        throw error;
    }
}

/**
 * Wrapper to handle token expiry and retry requests.
 */
async function fetchWithTokenRetry(url, options = {}, timeout = 15000) {
    try {
        return await fetchWithTimeout(url, options, timeout);
    } catch (error) {
        if (error.response && error.response.status === 403 && error.response.data.message === 'Invalid or expired token') {
            console.warn('[API] Token expired, attempting refresh...');
            try {
                const newToken = await refreshToken();
                
                // If refresh token endpoint doesn't exist (returns null), just proceed with old token
                if (newToken === null) {
                    console.warn('[API] Token refresh not available. Continuing with existing token.');
                    return await fetchWithTimeout(url, options, timeout);
                }
                
                // If we got a new token, retry with it
                if (newToken && options.headers) {
                    options.headers['Authorization'] = `Bearer ${newToken}`;
                    return await fetchWithTimeout(url, options, timeout);
                }
            } catch (refreshError) {
                console.error('[API] Token refresh failed:', refreshError);
                // Don't throw session expired error if refresh endpoint doesn't exist
                if (refreshError.message && refreshError.message.includes('404')) {
                    console.warn('[API] Proceeding without token refresh (endpoint not available)');
                    return await fetchWithTimeout(url, options, timeout);
                }
                throw new Error('Session expired. Please log in again.');
            }
        }
        throw error;
    }
}

/**
 * Generic POST request utility with token handling.
 */
export async function post(endpoint, data) {
    const url = cleanUrl(BASE_URL, endpoint); // Use cleanup helper
    const token = await AsyncStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Add token
    }

    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const parsed = await parseErrorResponse(response);
            
            // For phone OTP endpoint, return the error response body instead of throwing
            // This allows the UI to show a clean alert without console errors
            if (endpoint.includes('/send-phone-otp') && parsed.body && typeof parsed.body === 'object') {
                return parsed.body;
            }
            
            throw new Error(`HTTP error! Status: ${parsed.status}. Message: ${parsed.message}`);
        }
        return response.json();

    } catch (error) {
        console.error(`API POST request failed for endpoint ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Generic POST request utility that appends parameters to the URL query string.
 */
export async function postWithQuery(endpoint, params = {}, data = {}) {
    const query = buildQuery(params);
    
    // Build URL with cleanup helper, then append query
    const baseUrlWithEndpoint = cleanUrl(BASE_URL, endpoint); 
    const url = `${baseUrlWithEndpoint}${query}`; 
    
    const token = await AsyncStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Add token
    }

    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: headers,
            // Only include body if data is provided, otherwise pass undefined
            body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined, 
        });

        if (!response.ok) {
            const parsed = await parseErrorResponse(response);
            throw new Error(`HTTP error! Status: ${parsed.status}. Message: ${parsed.message}`);
        }
        return response.json();

    } catch (error) {
        console.error(`API POST (Query) request failed for endpoint ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Generic PUT request utility with token handling. Used for updates.
 */
export async function put(endpoint, data) {
    const url = cleanUrl(BASE_URL, endpoint); // Use cleanup helper
    const token = await AsyncStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Add token
    }

    try {
        const response = await fetchWithTimeout(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const parsed = await parseErrorResponse(response);
            throw new Error(`HTTP error! Status: ${parsed.status}. Message: ${parsed.message}`);
        }
        return response.json();

    } catch (error) {
        console.error(`API PUT request failed for endpoint ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Generic GET request utility with optional query params and token.
 */
export async function get(endpoint, params = {}) {
    const query = buildQuery(params); 
    
    // Build URL with cleanup helper, then append query
    const baseUrlWithEndpoint = cleanUrl(BASE_URL, endpoint);
    const url = `${baseUrlWithEndpoint}${query}`; 

    const token = await AsyncStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Add token
    }

    try {
        const response = await fetchWithTokenRetry(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            const parsed = await parseErrorResponse(response);
            throw new Error(`HTTP error! Status: ${parsed.status}. Message: ${parsed.message}`);
        }
        return response.json();
    } catch (error) {
        console.error(`API GET request failed for endpoint ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Generic DELETE request utility that appends parameters to the URL query string.
 */
export async function deleteWithQuery(endpoint, params = {}) {
    const query = buildQuery(params);
    const baseUrlWithEndpoint = cleanUrl(BASE_URL, endpoint);
    const url = `${baseUrlWithEndpoint}${query}`;

    const token = await AsyncStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetchWithTimeout(url, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const parsed = await parseErrorResponse(response);
            throw new Error(`HTTP error! Status: ${parsed.status}. Message: ${parsed.message}`);
        }
        // Some DELETE endpoints may return empty body
        try {
            return await response.json();
        } catch (e) {
            return {};
        }

    } catch (error) {
        console.error(`API DELETE (Query) request failed for endpoint ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Get the current location of the device.
 * Requests fine location permission on Android if not already granted.
 */
export async function getCurrentLocation() {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                throw new Error('Location permission denied');
            }
        }

        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('User location:', latitude, longitude);
                    resolve({ latitude, longitude });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        throw error;
    }
}

/**
 * Send FCM token to backend for push notifications
 * @param {string} userId - User ID from authentication
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @returns {Promise<Object>} Response from backend
 */
export async function sendFCMTokenToBackend(userId, fcmToken) {
    try {
        console.log('📤 Sending FCM token to backend...', { userId, fcmToken: fcmToken.substring(0, 20) + '...' });
        
        const response = await post('/api/save-token', {
            userId,
            fcmToken,
        });
        
        console.log('✅ FCM token sent to backend successfully:', response);
        return response;
    } catch (error) {
        // Don't throw error - FCM token is optional, shouldn't block login
        if (error.message && error.message.includes('404')) {
            console.warn('⚠️ FCM token endpoint not available (404). Skipping token save.');
        } else {
            console.warn('⚠️ Failed to send FCM token to backend:', error.message);
        }
        return { success: false, message: 'FCM token save failed but login continued' };
    }
}