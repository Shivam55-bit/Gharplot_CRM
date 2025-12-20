/**
 * CRM Alert Management API
 * Handles all alert and notification related API calls
 */
import { CRM_BASE_URL, getCRMAuthHeaders, handleCRMResponse, buildQueryString } from './crmAPI';

/**
 * Get all alerts
 */
export const getAllAlerts = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/alerts`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Create alert
 */
export const createAlert = async (alertData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

/**
 * Update alert
 */
export const updateAlert = async (alertId, alertData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/alerts/${alertId}`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
};

/**
 * Delete alert
 */
export const deleteAlert = async (alertId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/alerts/${alertId}`, {
      method: 'DELETE',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
};

/**
 * Get system alerts (Admin)
 */
export const getSystemAlerts = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const url = `${CRM_BASE_URL}/api/crm/admin/alerts${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    throw error;
  }
};

/**
 * Create system alert
 */
export const createSystemAlert = async (alertData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/admin/alerts`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error creating system alert:', error);
    throw error;
  }
};

/**
 * Update system alert
 */
export const updateSystemAlert = async (alertId, alertData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/admin/alerts/${alertId}`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error updating system alert:', error);
    throw error;
  }
};

/**
 * Delete system alert
 */
export const deleteSystemAlert = async (alertId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/admin/alerts/${alertId}`, {
      method: 'DELETE',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error deleting system alert:', error);
    throw error;
  }
};

/**
 * Broadcast alert
 */
export const broadcastAlert = async (broadcastData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/admin/alerts/broadcast`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(broadcastData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error broadcasting alert:', error);
    throw error;
  }
};

/**
 * Get alert engagement statistics
 */
export const getAlertEngagementStats = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/admin/alerts/stats`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching alert engagement stats:', error);
    throw error;
  }
};

/**
 * Get performance alerts
 */
export const getPerformanceAlerts = async (params = {}) => {
  try {
    const queryString = buildQueryString(params);
    const url = `${CRM_BASE_URL}/api/crm/alerts/performance${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching performance alerts:', error);
    throw error;
  }
};

/**
 * Get performance alert statistics
 */
export const getPerformanceAlertStats = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/alerts/performance/stats`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching performance alert stats:', error);
    throw error;
  }
};

/**
 * Update alert status
 */
export const updateAlertStatus = async (alertId, statusData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/alerts/${alertId}/status`, {
      method: 'PUT',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(statusData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
};

/**
 * Take action on alert
 */
export const takeAlertAction = async (alertId, actionData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/alerts/${alertId}/action`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(actionData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error taking alert action:', error);
    throw error;
  }
};

/**
 * Escalate alert
 */
export const escalateAlert = async (alertId, escalationData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/alerts/${alertId}/escalate`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(escalationData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error escalating alert:', error);
    throw error;
  }
};

/**
 * Resolve alert
 */
export const resolveAlert = async (alertId, resolutionData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: await getCRMAuthHeaders(),
      body: JSON.stringify(resolutionData),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

/**
 * Get employee alerts
 */
export const getEmployeeAlerts = async (employeeId) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/crm/employees/${employeeId}/alerts`, {
      method: 'GET',
      headers: await getCRMAuthHeaders(),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching employee alerts:', error);
    throw error;
  }
};

export default {
  getAllAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getSystemAlerts,
  createSystemAlert,
  updateSystemAlert,
  deleteSystemAlert,
  broadcastAlert,
  getAlertEngagementStats,
  getPerformanceAlerts,
  getPerformanceAlertStats,
  updateAlertStatus,
  takeAlertAction,
  escalateAlert,
  resolveAlert,
  getEmployeeAlerts,
};
