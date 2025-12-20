import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';
import { Container, Alert } from 'react-bootstrap';

const PermissionProtectedRoute = ({ children, requiredPermission, allowedRoles = [] }) => {
  const { isAuthenticated, loading, hasPermission, hasRole, employee } = usePermissions();

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  // Check if admin is logged in - admins bypass permission checks
  const isAdminAuthenticated = localStorage.getItem('adminToken') && localStorage.getItem('adminData');
  
  if (!isAuthenticated && !isAdminAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If admin is authenticated, grant access to everything
  if (isAdminAuthenticated) {
    return children;
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => hasRole(role));
    if (!hasAllowedRole) {
      return (
        <Container className="mt-4">
          <Alert variant="danger">
            <Alert.Heading>Access Denied</Alert.Heading>
            <p>You don't have the required role to access this page.</p>
            <hr />
            <p className="mb-0">
              Required roles: {allowedRoles.join(', ')}
              <br />
              Your role: {employee?.role?.name || 'No role assigned'}
            </p>
          </Alert>
        </Container>
      );
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const { module, action } = requiredPermission;
    if (!hasPermission(module, action)) {
      return (
        <Container className="mt-4">
          <Alert variant="warning">
            <Alert.Heading>Insufficient Permissions</Alert.Heading>
            <p>You don't have permission to access this page.</p>
            <hr />
            <p className="mb-0">
              Required permission: {action} access to {module} module
            </p>
          </Alert>
        </Container>
      );
    }
  }

  return children;
};

export default PermissionProtectedRoute;