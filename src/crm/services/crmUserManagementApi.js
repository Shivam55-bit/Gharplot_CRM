/**
 * CRM User Management API
 * Handles all user management related API calls
 */
import { CRM_BASE_URL, getCRMAuthHeaders, handleCRMResponse, buildQueryString } from './crmAPI';

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const url = `${CRM_BASE_URL}/api/users${queryString ? `?${queryString}` : ''}`;
    
    console.log('📡 API Request URL:', url);
    
    const headers = await getCRMAuthHeaders();
    console.log('🔐 Auth Headers:', headers.Authorization ? 'Token present' : 'No token');
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.log('📥 Response Status:', response.status);
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get single user details
 */
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/users/${userId}`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/users`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user details
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Deactivate user account
 */
export const deactivateUser = async (userId) => {
  try {
    // Note: Backend doesn't have deactivate endpoint, using delete instead
    const response = await fetch(`${CRM_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

/**
 * Activate user account
 */
export const activateUser = async (userId) => {
  try {
    // Note: Backend doesn't have activate endpoint, this is a placeholder
    const response = await fetch(`${CRM_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  try {
    // Note: Backend doesn't have user stats endpoint
    // Return mock data or fetch from getAllUsers
    const response = await fetch(`${CRM_BASE_URL}/api/users`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

/**
 * Get all users (Alternative endpoint)
 */
export const getAllUsersAlternative = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/users`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching users (alternative):', error);
    throw error;
  }
};

export default {
  getAllUsers,
  getAllUsersAlternative,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUserStats,
};
