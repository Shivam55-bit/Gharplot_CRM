/**
 * authapi.js
 * Centralized service for user authentication (Login, Register, Logout).
 * This file handles session management (saving/removing the auth token).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from './api.js'; // Import generic POST helper

// Define endpoint paths relative to BASE_URL (backend has auth under /auth)
const LOGIN_ENDPOINT = `/auth/login`;
const SIGNUP_ENDPOINT = `/auth/signup`;
const COMPLETE_REGISTRATION_ENDPOINT = `/auth/complete-registration`;
const LOGOUT_ENDPOINT = `/auth/logout`;
const SEND_OTP_ENDPOINT = `/auth/send-email-otp`;
const VERIFY_OTP_ENDPOINT = `/auth/verify-email-otp`;
const SEND_PHONE_OTP_ENDPOINT = `/auth/send-phone-otp`;
const VERIFY_PHONE_OTP_ENDPOINT = `/auth/verify-phone-otp`;

/**
 * Utility to retrieve the current user's JWT token from storage.
 * This is needed by userApi.js and other authenticated API calls.
 * @returns {Promise<string|null>} The stored JWT token.
 */
export async function getToken() {
    try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Retrieved token:', token); // Debug log
        return token;
    } catch (error) {
        console.error('Error retrieving token from AsyncStorage:', error);
        return null;
    }
}


/**
 * Performs the user signup request (equivalent to previous 'register').
 * @param {object} userData - User details (e.g., email, password, name).
 * @returns {Promise<{success: boolean, message: string}>} Registration result without auto-login.
 */
export async function signup(userData) {
    try {
        // Use the generic 'post' function
        const data = await post(SIGNUP_ENDPOINT, userData);
        
        // Don't save token - user should login manually after signup
        console.log('Signup successful, user needs to login:', data.message || 'Account created');
        
        return { 
            success: true, 
            message: data.message || 'Account created successfully',
            data: data 
        };

    } catch (error) {
        console.error("Signup Error:", error.message);
        throw error;
    }
}


/**
 * Handles user login by sending credentials to the server.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<{token: string, userId: string}>} Authentication token and user ID.
 */
export async function login(email, password) {
    try {
        // Use the generic 'post' function with the corrected endpoint
        const data = await post(LOGIN_ENDPOINT, { email, password });
        
        // --- FIX: Extract userId correctly from data.user.id ---
        const userId = data.user?.id;
        
        // CRITICAL: Save the token securely upon successful login
        if (data.token) {
            await AsyncStorage.setItem('userToken', data.token);
            console.log('Token saved successfully:', data.token); // Debug log
            
            // Save the user ID if it exists
            if (userId) {
                await AsyncStorage.setItem('userId', String(userId));
                console.log('User ID saved successfully:', userId); // Debug log
            } else {
                console.warn("Login successful but user ID was not found at data.user.id");
            }
        }
        
        // Return the token and the correctly extracted userId
        return { token: data.token, userId: userId };

    } catch (error) {
        console.error("Login Error:", error.message);
        throw error;
    }
}


/**
 * Send email OTP
 * @param {string} email
 * @returns {Promise<Object>} The API response.
 */
export async function sendEmailOtp(email) {
    try {
        return await post(SEND_OTP_ENDPOINT, { email });
    } catch (error) {
        console.error("Send OTP Error:", error.message);
        throw error;
    }
}

/**
 * Verify email OTP
 * @param {string} email
 * @param {string|number} otp
 * @returns {Promise<Object>} The API response.
 */
export async function verifyEmailOtp(email, otp) {
    try {
        return await post(VERIFY_OTP_ENDPOINT, { email, otp });
    } catch (error) {
        console.error("Verify OTP Error:", error.message);
        throw error;
    }
}

/**
 * Send phone OTP
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} The API response containing OTP or error.
 */
export async function sendPhoneOtp(phone) {
    // api.js now returns error response body for send-phone-otp endpoint
    // So we just return whatever we get - no need for try/catch
    return await post(SEND_PHONE_OTP_ENDPOINT, { phone });
}

/**
 * Verify phone OTP and check if user is registered
 * @param {string} phone - Phone number
 * @param {string|number} otp - OTP code
 * @returns {Promise<Object>} The API response with token if user exists, or success flag if new user.
 */
export async function verifyPhoneOtp(phone, otp) {
    try {
        const response = await post(VERIFY_PHONE_OTP_ENDPOINT, { phone, otp });
        console.log('Phone OTP verified successfully:', response);
        
        // If token exists, user is registered - save token
        if (response.token) {
            await AsyncStorage.setItem('userToken', response.token);
            console.log('Token saved for existing user:', response.token);
            
            if (response.user?.id) {
                await AsyncStorage.setItem('userId', String(response.user.id));
                console.log('User ID saved:', response.user.id);
            }
        }
        
        return response;
    } catch (error) {
        console.error("Verify Phone OTP Error:", error.message);
        throw error;
    }
}

/**
 * Complete registration for new user after OTP verification
 * @param {object} userData - User details (fullName, email, phone, dob)
 * @returns {Promise<Object>} The API response with token.
 */
export async function completeRegistration(userData) {
    try {
        const response = await post(COMPLETE_REGISTRATION_ENDPOINT, userData);
        console.log('Registration completed successfully:', response);
        
        // Save token after successful registration
        if (response.token) {
            await AsyncStorage.setItem('userToken', response.token);
            console.log('Token saved after registration:', response.token);
            
            if (response.user?.id) {
                await AsyncStorage.setItem('userId', String(response.user.id));
                console.log('User ID saved:', response.user.id);
            }
        }
        
        return response;
    } catch (error) {
        console.error("Complete Registration Error:", error.message);
        throw error;
    }
}


/**
 * Handles user logout. 
 * Clears local storage and attempts server-side token revocation.
 */
export async function logout() {
    // 1. Attempt server-side token revocation (token handled by generic post)
    try {
        // Note: No data is sent, token is retrieved from AsyncStorage by 'post'
        await post(LOGOUT_ENDPOINT, {}); 
    } catch (error) {
        // Non-critical error if network fails during logout, as local session is the priority
        console.warn("Server side token revocation failed, proceeding with local clear:", error.message);
    }
    
    // 2. CRITICAL: Clear local storage to end the session
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId'); 
}

/**
 * Utility to retrieve the current user's ID from storage.
 * @returns {Promise<string|null>} The stored user ID.
 */
export async function getUserId() {
    return AsyncStorage.getItem('userId');
}

// Default export combining all functions, including the new getToken()
export default {
    getToken, // <-- ADDED this helper
    signup,
    login,
    logout,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    completeRegistration,
    getUserId, // <-- This is what the referring file needs to access
};
