/**
 * Employee Management Service
 * Handles all employee management API calls for CRM
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
 * Get all employees with pagination and filters
 */
export const getAllEmployees = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/crm/employees${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

/**
 * Get single employee details
 */
export const getEmployeeById = async (empId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees/${empId}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching employee details:', error);
    throw error;
  }
};

/**
 * Create new employee
 */
export const createEmployee = async (employeeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(employeeData),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

/**
 * Update employee details
 */
export const updateEmployee = async (empId, employeeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees/${empId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(employeeData),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

/**
 * Delete employee
 */
export const deleteEmployee = async (empId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees/${empId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

/**
 * Get employee performance metrics
 */
export const getEmployeePerformance = async (empId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees/${empId}/performance`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    throw error;
  }
};

/**
 * Get employee statistics
 */
export const getEmployeeStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees/stats`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    throw error;
  }
};

/**
 * Update employee status
 */
export const updateEmployeeStatus = async (empId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crm/employees/${empId}/status`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating employee status:', error);
    throw error;
  }
};

export default {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeePerformance,
  getEmployeeStats,
  updateEmployeeStatus,
};
