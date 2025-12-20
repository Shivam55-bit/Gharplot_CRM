/**
 * CRM Role Management API
 * Handles all role and permission management API calls
 */
import { CRM_BASE_URL, getCRMAuthHeaders, handleCRMResponse, buildQueryString } from './crmAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get endpoint based on token type (Admin vs Employee)
 */
const getEndpoint = async (resource, id = null) => {
  const adminToken = await AsyncStorage.getItem('adminToken');
  const baseUrl = adminToken ? 
    `${CRM_BASE_URL}/admin` : 
    `${CRM_BASE_URL}/api/crm`;
  
  const endpoint = `${baseUrl}/${resource}`;
  return id ? `${endpoint}/${id}` : endpoint;
};

/**
 * Get all roles
 */
export const getAllRoles = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const baseUrl = await getEndpoint('roles');
    const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching roles from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    const result = await handleCRMResponse(response);
    return result;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

/**
 * Get single role details
 */
export const getRoleById = async (roleId) => {
  try {
    const url = await getEndpoint('roles', roleId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
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
    const url = await getEndpoint('roles');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

/**
 * Update role details
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const url = await getEndpoint('roles', roleId);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(roleData),
    });
    
    return await handleCRMResponse(response);
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
    const url = await getEndpoint('roles', roleId);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

/**
 * Get all permissions
 */
export const getAllPermissions = async () => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const url = adminToken ? 
      `${CRM_BASE_URL}/admin/roles/permissions` : 
      `${CRM_BASE_URL}/api/crm/permissions`;
    
    console.log('Fetching permissions from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

/**
 * Assign role to user
 */
export const assignRoleToUser = async (userId, roleId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/users/${userId}/role`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify({ roleId }),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
};

/**
 * Get user permissions
 */
export const getUserPermissions = async (userId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/users/${userId}/permissions`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }
};

/**
 * Get role statistics
 */
export const getRoleStats = async () => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const url = adminToken ? 
      `${CRM_BASE_URL}/admin/roles/stats` : 
      `${CRM_BASE_URL}/api/crm/roles/stats`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
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
  assignRoleToUser,
  getUserPermissions,
  getRoleStats,
};
