/**
 * CRM USP Management API
 * Handles USP (Unique Selling Points) CRUD operations
 */
import { CRM_BASE_URL, getCRMAuthHeaders, handleCRMResponse } from './crmAPI';

/**
 * Get all USPs
 */
export const getAllUSPs = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/usp`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching USPs:', error);
    throw error;
  }
};

/**
 * Get USP by ID
 */
export const getUSPById = async (uspId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/usp/${uspId}`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching USP:', error);
    throw error;
  }
};

/**
 * Create USP
 */
export const createUSP = async (uspData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/usp`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(uspData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error creating USP:', error);
    throw error;
  }
};

/**
 * Update USP
 */
export const updateUSP = async (uspId, uspData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/usp/${uspId}`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(uspData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error updating USP:', error);
    throw error;
  }
};

/**
 * Delete USP
 */
export const deleteUSP = async (uspId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/usp/${uspId}`, {
      method: 'DELETE',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error deleting USP:', error);
    throw error;
  }
};

export default {
  getAllUSPs,
  getUSPById,
  createUSP,
  updateUSP,
  deleteUSP,
};
