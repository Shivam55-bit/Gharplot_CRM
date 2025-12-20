import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const adminToken = localStorage.getItem('adminToken');
    const employeeToken = localStorage.getItem('employeeToken');
    const token = localStorage.getItem('token');
    
    // Use the first available token
    const authToken = adminToken || employeeToken || token;
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    console.log('🔗 API Request:', config.method?.toUpperCase(), config.url, {
      hasAuth: !!authToken,
      tokenType: adminToken ? 'admin' : employeeToken ? 'employee' : token ? 'general' : 'none'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('🔐 Unauthorized access detected - clearing tokens');
      // Clear all tokens on 401
      localStorage.removeItem('adminToken');
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('token');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;