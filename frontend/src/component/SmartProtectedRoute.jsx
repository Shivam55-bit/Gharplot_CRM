import React from 'react';
import { Navigate } from 'react-router-dom';
import PermissionProtectedRoute from './PermissionProtectedRoute';

const SmartProtectedRoute = ({ children, requiredPermission, allowedRoles = [] }) => {
  // Check if admin is logged in - admins bypass all permission checks
  const isAdminAuthenticated = localStorage.getItem('adminToken') && localStorage.getItem('adminData');
  const isEmployeeAuthenticated = localStorage.getItem('employeeToken') && localStorage.getItem('employeeData');
  
  // If no one is authenticated, redirect to login
  if (!isAdminAuthenticated && !isEmployeeAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If admin is authenticated, grant access to everything
  if (isAdminAuthenticated) {
    return children;
  }
  
  // If employee is authenticated, use permission-based routing
  if (isEmployeeAuthenticated && (requiredPermission || allowedRoles.length > 0)) {
    return (
      <PermissionProtectedRoute 
        requiredPermission={requiredPermission} 
        allowedRoles={allowedRoles}
      >
        {children}
      </PermissionProtectedRoute>
    );
  }
  
  // Default case - just return children for employees without specific permission requirements
  return children;
};

export default SmartProtectedRoute;