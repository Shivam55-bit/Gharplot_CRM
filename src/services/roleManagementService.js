/**
 * Role Management Service
 * Handles all role and permission management API calls
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://abc.bhoomitechzone.us';

/**
 * Get authentication headers with token
 */
const getAuthHeaders = async () => {
  try {
    const adminToken = await AsyncStorage.getItem('crm_auth_token');
    const employeeToken = await AsyncStorage.getItem('employee_auth_token');
    const token = adminToken || employeeToken;
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Get all roles
 */
export const getAllRoles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

/**
 * Get role details with permissions
 */
export const getRoleById = async (roleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles/${roleId}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching role details:', error);
    throw error;
  }
};

/**
 * Create new role
 */
export const createRole = async (roleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

/**
 * Update role
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles/${roleId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

/**
 * Delete role
 */
export const deleteRole = async (roleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles/${roleId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

/**
 * Get all available permissions
 */
export const getAllPermissions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/permissions`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

/**
 * Assign permissions to role
 */
export const assignPermissions = async (roleId, permissions) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error assigning permissions:', error);
    throw error;
  }
};

/**
 * Get role usage statistics
 */
export const getRoleStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/roles/stats`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching role stats:', error);
    throw error;
  }
};

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  assignPermissions,
  getRoleStats,
};
