/**
 * Authentication Service
 * Handles login, token verification, and user session management
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorageHelper from '../../utils/asyncStorageHelper';
import { BASE_URL, OTP_BASE_URL } from '../config/apiConfig';

class AuthService {
  
  // Logout user
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        'adminToken',
        'employeeToken', 
        'adminData',
        'employeeData',
        'userType',
        'sessionId'
      ]);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Error during logout' };
    }
  }

  // Check if user is authenticated
  async signup(userData) {
    try {
      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          name: userData.name,
          phone: userData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data) {
        return {
          success: true,
          message: data.message || 'User registered successfully',
          data: data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Network error during registration'
      };
    }
  }

  // Send Email OTP
  async sendEmailOtp(email) {
    try {
      const response = await fetch(`${OTP_BASE_URL}/auth/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data) {
        return {
          success: true,
          message: data.message || 'OTP sent successfully',
          data: data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to send OTP'
        };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Network error while sending OTP'
      };
    }
  }

  // Verify Email OTP
  async verifyEmailOtp(email, otp) {
    try {
      const response = await fetch(`${OTP_BASE_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp
        }),
      });

      const data = await response.json();

      if (response.ok && data) {
        // If OTP verification includes login, store tokens
        if (data.token) {
          await AsyncStorage.setItem('adminToken', data.token);
          
          // Safely store admin data using helper
          const adminUser = data.user || data.admin;
          if (adminUser) {
            await AsyncStorageHelper.safeSetJSON('adminData', adminUser);
          }
          
          await AsyncStorage.setItem('userType', 'admin');
        }
        
        return {
          success: true,
          message: data.message || 'OTP verified successfully',
          token: data.token,
          user: data.user || data.admin,
          data: data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid OTP'
        };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'Network error during OTP verification'
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const adminToken = await AsyncStorage.getItem('adminToken');
      const employeeToken = await AsyncStorage.getItem('employeeToken');
      return !!(adminToken || employeeToken);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Get current user data
  async getCurrentUser() {
    try {
      const adminData = await AsyncStorageHelper.safeGetJSON('adminData');
      const employeeData = await AsyncStorageHelper.safeGetJSON('employeeData');
      
      if (adminData && typeof adminData === 'object') {
        return { ...adminData, userType: 'admin' };
      }
      
      if (employeeData && typeof employeeData === 'object') {
        return { ...employeeData, userType: 'employee' };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Admin login
  async adminLogin(email, password) {
    try {
      const response = await fetch('https://abc.bhoomitechzone.us/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });
      
      const data = await response.json();

      // Check for successful login based on actual API response
      if (response.ok && data && data.success && data.token) {
        // Store admin token and data
        await AsyncStorage.setItem('adminToken', data.token);
        
        // Safely store admin data using helper
        if (data.user) {
          await AsyncStorageHelper.safeSetJSON('adminData', data.user);
        }
        
        await AsyncStorage.setItem('userType', 'admin');
        await AsyncStorage.setItem('isAuthenticated', 'true');

        return {
          success: true,
          token: data.token,
          user: data.user,
          message: 'Admin login successful',
          userType: 'admin'
        };
      } else {
        // Handle various error scenarios
        const errorMessage = response.status === 401 
          ? 'Invalid credentials. Please check your email and password.' 
          : response.status === 404 
          ? 'Login service not found. Please contact support.' 
          : response.status >= 500 
          ? 'Server error. Please try again later.' 
          : data?.message || data?.error || 'Login failed. Please try again.';
          
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Employee login
  async employeeLogin(email, password) {
    try {
      const response = await fetch('https://abc.bhoomitechzone.us/api/employees/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data && data.success && data.data && data.data.token) {
        // Store employee token and data
        await AsyncStorage.setItem('employeeToken', data.data.token);
        await AsyncStorage.setItem('accessToken', data.data.token);
        
        // Safely store employee data using helper
        if (data.data.employee) {
          await AsyncStorageHelper.safeSetJSON('employeeData', data.data.employee);
          // 🔥 Store employee ID as userId for FCM token sync
          if (data.data.employee._id) {
            await AsyncStorage.setItem('userId', data.data.employee._id);
            await AsyncStorage.setItem('employeeId', data.data.employee._id);
            console.log('✅ Employee ID stored:', data.data.employee._id);
            
            // 🔥 Sync FCM token to Employee model for notifications
            try {
              const { getFCMToken, sendTokenToBackend } = require('../utils/fcmService');
              const fcmToken = await getFCMToken();
              if (fcmToken) {
                await sendTokenToBackend(data.data.employee._id, fcmToken);
                console.log('✅ FCM token synced to Employee model after login');
              }
            } catch (fcmError) {
              console.warn('⚠️ FCM sync after login failed:', fcmError.message);
            }
          }
        }
        
        await AsyncStorage.setItem('userType', 'employee');
        await AsyncStorage.setItem('isAuthenticated', 'true');

        return { 
          success: true, 
          user: data.data.employee, 
          token: data.data.token,
          permissions: data.data.employee.role?.permissions || [],
          message: 'Employee login successful',
          userType: 'employee'
        };
      } else {
        // Handle various error scenarios
        const errorMessage = response.status === 401 
          ? 'Invalid credentials. Please check your email and password.' 
          : response.status === 404 
          ? 'Employee login service not found. Please contact support.' 
          : response.status >= 500 
          ? 'Server error. Please try again later.' 
          : data?.message || data?.error || 'Employee login failed. Please try again.';
          
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Employee login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Unified login function (automatically detects admin/employee)
  async unifiedLogin(email, password) {
    // Try Admin Login First
    try {
      const adminResult = await this.adminLogin(email, password);
      if (adminResult.success) {
        return { 
          success: true, 
          userType: 'admin', 
          data: adminResult,
          token: adminResult.token,
          user: adminResult.user 
        };
      }
    } catch (error) {
      console.log('Admin login failed, trying employee login...', error);
    }
    
    // Try Employee Login
    try {
      const employeeResult = await this.employeeLogin(email, password);
      if (employeeResult.success) {
        return { 
          success: true, 
          userType: 'employee', 
          data: employeeResult,
          token: employeeResult.token,
          user: employeeResult.user,
          permissions: employeeResult.permissions
        };
      }
    } catch (error) {
      console.log('Employee login also failed', error);
    }
    
    return { 
      success: false, 
      message: 'Invalid credentials. Please check your email and password.' 
    };
  }

  // Main login method that uses unified login
  async login(email, password, userType = 'auto') {
    if (userType === 'auto') {
      return await this.unifiedLogin(email, password);
    } else if (userType === 'admin') {
      return await this.adminLogin(email, password);
    } else if (userType === 'employee') {
      return await this.employeeLogin(email, password);
    } else {
      return { success: false, message: 'Invalid user type specified' };
    }
  }

  // Get authentication headers for API requests
  async getAuthHeaders() {
    try {
      const adminToken = await AsyncStorage.getItem('adminToken');
      const employeeToken = await AsyncStorage.getItem('employeeToken');
      const token = adminToken || employeeToken;
      
      return token ? { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  // Check user permissions
  async hasPermission(module, action) {
    try {
      const userData = await this.getCurrentUser();
      
      if (userData?.userType === 'admin') {
        // Admins have all permissions
        return true;
      }
      
      if (userData?.userType === 'employee') {
        const employeeData = await AsyncStorageHelper.safeGetJSON('employeeData');
        const permissions = employeeData?.role?.permissions || [];
        
        // Check if the employee has permission for the specified module and action
        const modulePermission = permissions.find(perm => perm.module === module);
        return modulePermission && modulePermission.actions.includes(action);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Get user role
  async getUserRole() {
    try {
      const userData = await this.getCurrentUser();
      
      if (userData?.userType === 'admin') {
        return 'admin';
      }
      
      if (userData?.userType === 'employee') {
        const employeeData = await AsyncStorageHelper.safeGetJSON('employeeData');
        return employeeData?.role?.name || 'employee';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Send OTP for admin 2FA
  async sendOTP(email) {
    try {
      const response = await fetch(`${OTP_BASE_URL}/admin/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('verificationEmail', email);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to send OTP' };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Verify OTP
  async verifyOTP(email, otp) {
    try {
      const response = await fetch(`${OTP_BASE_URL}/admin/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Admin signup/register
  async adminSignup(fullName, email, mobileNumber, password) {
    try {
      const response = await fetch(`${BASE_URL}/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email: email.toLowerCase().trim(),
          mobileNumber,
          password,
        }),
      });

      const data = await response.json();
      return { success: data.success, message: data.message, data: data.data };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await fetch(`${BASE_URL}/admin/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Reset password
  async resetPassword(email, otp, newPassword) {
    try {
      const response = await fetch(`${BASE_URL}/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Setup demo authentication
  async setupDemoAuth() {
    try {
      const demoToken = 'demo_admin_token_12345';
      const demoUser = {
        id: '1',
        email: 'admin@demo.com',
        fullName: 'Demo Admin',
        mobileNumber: '9999999999'
      };

      await AsyncStorage.setItem('adminToken', demoToken);
      await AsyncStorage.setItem('adminData', JSON.stringify(demoUser));
      await AsyncStorage.setItem('userType', 'admin');
      await AsyncStorage.setItem('isAuthenticated', 'true');

      return { success: true, user: demoUser };
    } catch (error) {
      console.error('Demo auth setup error:', error);
      return { success: false, message: 'Failed to setup demo authentication' };
    }
  }

  // Logout user
  async logout() {
    try {
      await AsyncStorageHelper.safeClearItems([
        'adminToken',
        'employeeToken', 
        'adminData',
        'employeeData',
        'userType',
        'isAuthenticated',
        'is2FAEnabled',
        'verificationEmail'
      ]);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Failed to logout' };
    }
  }

  // Check if user has specific permission
  async hasPermission(module, action) {
    try {
      const user = await this.getCurrentUser();
      if (!user || user.userType !== 'employee') {
        // Admin has all permissions
        return user && user.userType === 'admin';
      }

      const permissions = user.role?.permissions || [];
      const modulePermission = permissions.find(perm => perm.module === module);
      return modulePermission && modulePermission.actions.includes(action);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Check if user has specific role
  async hasRole(requiredRole) {
    try {
      const user = await this.getCurrentUser();
      return user && user.role?.name?.toLowerCase() === requiredRole.toLowerCase();
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  // Enable/Disable 2FA
  async set2FA(enabled) {
    try {
      await AsyncStorage.setItem('is2FAEnabled', enabled ? 'true' : 'false');
      return { success: true };
    } catch (error) {
      console.error('Error setting 2FA:', error);
      return { success: false, message: 'Failed to update 2FA settings' };
    }
  }

  // Check if 2FA is enabled
  async is2FAEnabled() {
    try {
      const enabled = await AsyncStorage.getItem('is2FAEnabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  // Demo authentication for testing
  async setupDemoAuth() {
    try {
      const demoUser = {
        id: 'demo-001',
        name: 'Demo User',
        email: 'demo@gharplot.com',
        role: 'Admin'
      };
      
      const demoToken = 'demo-token-' + Date.now();
      
      // Store demo credentials
      await AsyncStorage.setItem('adminToken', demoToken);
      await AsyncStorage.setItem('adminData', JSON.stringify(demoUser));
      await AsyncStorage.setItem('userType', 'admin');
      await AsyncStorage.setItem('isAuthenticated', 'true');
      
      return {
        success: true,
        user: demoUser,
        token: demoToken,
        message: 'Demo login successful!'
      };
    } catch (error) {
      console.error('Demo auth error:', error);
      return { success: false, message: 'Demo login failed' };
    }
  }

  // Verify token validity
  async verifyToken(token = null) {
    try {
      const tokenToVerify = token || await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('adminToken') || await AsyncStorage.getItem('employeeToken');
      
      if (!tokenToVerify) {
        return { success: false, message: 'No token found' };
      }

      // For demo/testing purposes, assume token is valid if it exists
      // In production, you would make an API call to verify the token
      const userData = await AsyncStorage.getItem('userData') || await AsyncStorage.getItem('adminData') || await AsyncStorage.getItem('employeeData');
      
      if (userData) {
        return { 
          success: true, 
          user: JSON.parse(userData),
          token: tokenToVerify,
          message: 'Token is valid' 
        };
      }
      
      return { success: false, message: 'Invalid token' };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false, message: 'Token verification failed' };
    }
  }

  // Logout and clear all stored data
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'userData', 
        'userType',
        'adminToken',
        'adminData',
        'employeeToken',
        'employeeData',
        'sessionId',
        'verificationEmail',
        'isAuthenticated'
      ]);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }

  // Get stored tokens
  async getTokens() {
    try {
      const adminToken = await AsyncStorage.getItem('adminToken');
      const employeeToken = await AsyncStorage.getItem('employeeToken');
      const userToken = await AsyncStorage.getItem('userToken');
      
      return {
        adminToken,
        employeeToken,
        userToken
      };
    } catch (error) {
      console.error('Get tokens error:', error);
      return {};
    }
  }
}

export default new AuthService();