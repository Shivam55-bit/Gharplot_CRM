// Token management utilities
export class TokenManager {
  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token expires within next 5 minutes (300 seconds)
      return payload.exp < (currentTime + 300);
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }
  
  static getTokenExpiry(token) {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }
  
  static clearExpiredTokens() {
    const adminToken = localStorage.getItem('adminToken');
    const employeeToken = localStorage.getItem('employeeToken');
    
    if (adminToken && this.isTokenExpired(adminToken)) {
      localStorage.removeItem('adminToken');
      console.log('Removed expired admin token');
    }
    
    if (employeeToken && this.isTokenExpired(employeeToken)) {
      localStorage.removeItem('employeeToken');
      console.log('Removed expired employee token');
    }
  }
  
  static redirectToLogin() {
    // Clear all tokens
    localStorage.removeItem('adminToken');
    localStorage.removeItem('employeeToken');
    
    // Show alert before redirect
    alert('Your session has expired. Please login again.');
    
    // Redirect based on current path
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/admin') || currentPath.includes('/employee-management')) {
      window.location.href = '/admin-login';
    } else {
      window.location.href = '/login';
    }
  }
  
  static handleInvalidToken(error) {
    // Check if it's a token-related error
    if (error.response?.status === 401 && 
        (error.response?.data?.message?.includes('Invalid token') || 
         error.response?.data?.message?.includes('expired') ||
         error.response?.data?.message?.includes('Token is not valid'))) {
      
      console.log('🚫 Invalid/expired token detected, redirecting to login');
      this.redirectToLogin();
      return true;
    }
    return false;
  }
  
  static setupTokenExpiryCheck() {
    // Check token expiry every minute
    setInterval(() => {
      this.clearExpiredTokens();
    }, 60000);
  }
}

// Auto-setup token expiry checking
TokenManager.setupTokenExpiryCheck();