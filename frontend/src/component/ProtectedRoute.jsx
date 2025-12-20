import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check for both admin and employee authentication
  const isAdminAuthenticated = localStorage.getItem('adminToken') && localStorage.getItem('adminData');
  const isEmployeeAuthenticated = localStorage.getItem('employeeToken') && localStorage.getItem('employeeData');
  const isLegacyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Allow access if any form of authentication is present
  if (!isAdminAuthenticated && !isEmployeeAuthenticated && !isLegacyAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;