/**
 * CRM Employee Dashboard API
 * Handles employee dashboard statistics and analytics
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://abc.bhoomitechzone.us';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  try {
    const employeeToken = await AsyncStorage.getItem('employee_token');
    const employeeAuthToken = await AsyncStorage.getItem('employee_auth_token');
    const crmToken = await AsyncStorage.getItem('crm_auth_token');
    
    const token = employeeToken || employeeAuthToken || crmToken;
    
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
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

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Get all properties count for employee
 */
export const getAllPropertiesCount = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/properties/all`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 401 || response.status === 403) {
        console.log('ℹ️ No properties found or no permission');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📊 Employee properties response:', result);
    // Backend returns: { success: true, totalProperties: count, data: properties }
    return result.data || result.properties || [];
  } catch (error) {
    console.error('❌ Error fetching employee properties:', error.message);
    return [];
  }
};

/**
 * Get bought properties count for employee
 */
export const getBoughtPropertiesCount = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/properties/all-bought-properties`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 401 || response.status === 403) {
        console.log('ℹ️ No bought properties found or no permission');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('🏠 Employee bought properties response:', result);
    return result.data || result.properties || [];
  } catch (error) {
    console.error('❌ Error fetching employee bought properties:', error.message);
    return [];
  }
};

/**
 * Get rent properties count for employee
 */
export const getRentPropertiesCount = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/properties/rent`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 401 || response.status === 403) {
        console.log('ℹ️ No rent properties found or no permission');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('🏘️ Employee rent properties response:', result);
    return result.rentProperties || result.data || [];
  } catch (error) {
    console.error('❌ Error fetching employee rent properties:', error.message);
    return [];
  }
};

/**
 * Get employee's assigned leads
 */
export const getMyLeads = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employee/leads/my-leads`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        console.log('ℹ️ No leads found or unauthorized');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('🎯 Employee leads response:', JSON.stringify(result, null, 2));
    
    // Backend returns { success: true, data: { assignments: [], pagination: {} } }
    const leads = result?.data?.assignments || result?.assignments || result?.data || [];
    console.log('🎯 Extracted leads:', leads, 'Type:', typeof leads, 'IsArray:', Array.isArray(leads));
    
    return Array.isArray(leads) ? leads : [];
  } catch (error) {
    console.error('❌ Error fetching employee leads:', error.message);
    return [];
  }
};

/**
 * Get employee's reminders
 */
export const getMyReminders = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/reminder/list`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        console.log('ℹ️ No reminders found or unauthorized');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📅 Employee reminders response:', JSON.stringify(result, null, 2));
    
    // Backend returns { success: true, data: { reminders: [], pagination: {} } }
    const reminders = result?.data?.reminders || result?.reminders || result?.data || [];
    console.log('📅 Extracted reminders:', reminders, 'Type:', typeof reminders, 'IsArray:', Array.isArray(reminders));
    
    return Array.isArray(reminders) ? reminders : [];
  } catch (error) {
    console.error('❌ Error fetching employee reminders:', error.message);
    return [];
  }
};

/**
 * Get dashboard stats from /employee/dashboard/stats
 */
export const getDashboardStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employee/dashboard/stats`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        console.log('ℹ️ Dashboard stats not available (401/404)');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📈 Employee dashboard stats:', data);
    
    return data?.data || data;
  } catch (error) {
    console.error('❌ Error fetching employee dashboard stats:', error.message);
    return null;
  }
};

/**
 * Get complete employee dashboard data
 * Fetches all dashboard statistics in parallel
 */
export const getCompleteDashboardData = async () => {
  try {
    console.log('🔄 Starting employee dashboard data fetch...');
    
    const [
      properties,
      boughtProperties,
      rentProperties,
      leads,
      reminders
    ] = await Promise.all([
      getAllPropertiesCount(),
      getBoughtPropertiesCount(),
      getRentPropertiesCount(),
      getMyLeads(),
      getMyReminders()
    ]);

    // Ensure all values are arrays
    const propertiesArray = Array.isArray(properties) ? properties : [];
    const boughtArray = Array.isArray(boughtProperties) ? boughtProperties : [];
    const rentArray = Array.isArray(rentProperties) ? rentProperties : [];
    const leadsArray = Array.isArray(leads) ? leads : [];
    const remindersArray = Array.isArray(reminders) ? reminders : [];

    console.log('✅ Employee dashboard data fetched:', {
      propertiesCount: propertiesArray.length,
      boughtCount: boughtArray.length,
      rentCount: rentArray.length,
      leadsCount: leadsArray.length,
      remindersCount: remindersArray.length
    });

    const residential = propertiesArray.filter(p => p.propertyType?.toLowerCase() === 'residential').length;
    const commercial = propertiesArray.filter(p => p.propertyType?.toLowerCase() === 'commercial').length;

    return {
      totalProperty: propertiesArray.length,
      boughtProperty: boughtArray.length,
      residentialProperty: residential,
      commercialProperty: commercial,
      rentProperty: rentArray.length,
      reminders: remindersArray.length,
      leads: leadsArray.length,
      properties: {
        sale: propertiesArray.length - rentArray.length,
        rent: rentArray.length,
      },
      recentProperties: propertiesArray.slice(0, 5),
    };
  } catch (error) {
    console.error('❌ Error fetching complete employee dashboard data:', error);
    throw error;
  }
};

export default {
  getAllPropertiesCount,
  getBoughtPropertiesCount,
  getRentPropertiesCount,
  getMyLeads,
  getMyReminders,
  getDashboardStats,
  getCompleteDashboardData,
};
