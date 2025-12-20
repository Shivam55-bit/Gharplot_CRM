import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { TokenManager } from '../utils/tokenManager';

/**
 * USP Service - Handles all API calls for USP Categories and USP Employees
 * Base URL: https://abc.bhoomitechzone.us
 */

// Helper function to get authentication headers
const getAuthHeaders = () => {
  TokenManager.clearExpiredTokens();
  const adminToken = localStorage.getItem('adminToken');
  const employeeToken = localStorage.getItem('employeeToken');
  const token = adminToken || employeeToken;
  
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// ================================================================================
// CATEGORY ENDPOINTS
// ================================================================================

/**
 * Create a new USP category
 * @param {Object} data - Category data { name, description }
 * @returns {Promise} API response
 */
export const createCategory = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/usp-categories`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Get all USP categories
 * @returns {Promise} API response with categories
 */
export const getAllCategories = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/usp-categories`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Get single category by ID
 * @param {string} id - Category ID
 * @returns {Promise} API response with category
 */
export const getCategoryById = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/usp-categories/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Update a category
 * @param {string} id - Category ID
 * @param {Object} data - Updated data { name, description, isActive }
 * @returns {Promise} API response
 */
export const updateCategory = async (id, data) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/usp-categories/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Delete a category (hard delete)
 * @param {string} id - Category ID
 * @returns {Promise} API response
 */
export const deleteCategory = async (id) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/usp-categories/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

// ================================================================================
// USP EMPLOYEE ENDPOINTS
// ================================================================================

/**
 * Add employee by existing Employee ID (system employee)
 * @param {Object} data - { employeeId, categoryId, expertise, experienceYears, description }
 * @returns {Promise} API response
 */
export const addEmployeeById = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/usp-employees/add-by-id`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Add employee manually (by name and phone)
 * @param {Object} data - { categoryId, name, phone, expertise, experienceYears, description }
 * @returns {Promise} API response
 */
export const addEmployeeManually = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/usp-employees/add-manually`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Get all USP employees
 * @returns {Promise} API response with employees
 */
export const getAllUspEmployees = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/usp-employees`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Get categories with employee count
 * @returns {Promise} API response with categories and counts
 */
export const getCategoriesWithCount = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/usp-employees/categories-with-count`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Get employees by category ID
 * @param {string} categoryId - Category ID
 * @returns {Promise} API response with employees
 */
export const getEmployeesByCategory = async (categoryId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/usp-employees/category/${categoryId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Get single USP employee by ID
 * @param {string} id - USP Employee ID
 * @returns {Promise} API response with employee
 */
export const getUspEmployeeById = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/usp-employees/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Update USP employee
 * @param {string} id - USP Employee ID
 * @param {Object} data - Updated data
 * @returns {Promise} API response
 */
export const updateUspEmployee = async (id, data) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/usp-employees/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

/**
 * Delete USP employee (hard delete)
 * @param {string} id - USP Employee ID
 * @returns {Promise} API response
 */
export const deleteUspEmployee = async (id) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/usp-employees/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (TokenManager.handleInvalidToken(error)) {
      throw new Error('Session expired');
    }
    throw error;
  }
};

// Export all functions as default object
export default {
  // Categories
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  
  // USP Employees
  addEmployeeById,
  addEmployeeManually,
  getAllUspEmployees,
  getCategoriesWithCount,
  getEmployeesByCategory,
  getUspEmployeeById,
  updateUspEmployee,
  deleteUspEmployee
};
