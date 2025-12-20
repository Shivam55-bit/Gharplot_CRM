import { API_BASE_URL } from '../config/apiConfig';

// Utility to get the correct API endpoint and token based on user type
export const getAuthenticatedRequest = () => {
  const adminToken = localStorage.getItem('adminToken');
  const employeeToken = localStorage.getItem('employeeToken');

  if (adminToken) {
    return {
      token: adminToken,
      baseUrl: `${API_BASE_URL}/admin`,
      userType: 'admin'
    };
  } else if (employeeToken) {
    return {
      token: employeeToken,
      baseUrl: `${API_BASE_URL}/api`,
      userType: 'employee'
    };
  } else {
    throw new Error('No authentication token found');
  }
};

// Utility to create axios config with proper authentication headers
export const createAuthConfig = () => {
  const { token } = getAuthenticatedRequest();
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

// Utility to get endpoint for a specific resource
export const getEndpoint = (resource, id = null) => {
  const { baseUrl } = getAuthenticatedRequest();
  const endpoint = `${baseUrl}/${resource}`;
  return id ? `${endpoint}/${id}` : endpoint;
};