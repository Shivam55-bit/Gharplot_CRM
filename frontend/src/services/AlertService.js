import API from '../utils/axiosConfig';

const AlertService = {
  /**
   * Create a new alert
   * @param {Object} alertData - { date, time, reason, repeatDaily }
   * @param {string} token - Authorization token
   * @returns {Promise}
   */
  createAlert: async (alertData, token) => {
    try {
      console.log('📤 Creating alert:', alertData);
      console.log('📤 Using token:', token ? 'Token available' : 'No token');
      console.log('📤 Full endpoint: /api/alerts');
      const response = await API.post('/api/alerts', alertData);
      console.log('✅ Alert created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating alert:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get all alerts
   * @param {string} token - Authorization token
   * @returns {Promise}
   */
  getAllAlerts: async (token) => {
    try {
      console.log('📥 Fetching all alerts');
      const response = await API.get('/api/alerts');
      console.log('✅ Alerts fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching alerts:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get alerts by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} token - Authorization token
   * @returns {Promise}
   */
  getAlertsByDateRange: async (startDate, endDate, token) => {
    try {
      console.log('📥 Fetching alerts by date range:', { startDate, endDate });
      const response = await API.get('/api/alerts', {
        params: { startDate, endDate }
      });
      console.log('✅ Alerts fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching alerts by date range:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update an existing alert
   * @param {string} alertId - Alert ID
   * @param {Object} updateData - { time, reason, isActive }
   * @param {string} token - Authorization token
   * @returns {Promise}
   */
  updateAlert: async (alertId, updateData, token) => {
    try {
      console.log('📤 Updating alert:', alertId, updateData);
      const response = await API.put(`/api/alerts/${alertId}`, updateData);
      console.log('✅ Alert updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating alert:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete an alert
   * @param {string} alertId - Alert ID
   * @param {string} token - Authorization token
   * @returns {Promise}
   */
  deleteAlert: async (alertId, token) => {
    try {
      console.log('🗑️ Deleting alert:', alertId);
      const response = await API.delete(`/api/alerts/${alertId}`);
      console.log('✅ Alert deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting alert:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default AlertService;
