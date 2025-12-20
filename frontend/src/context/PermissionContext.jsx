import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('employeeToken');
    const employeeData = localStorage.getItem('employeeData');
    
    if (token && employeeData) {
      try {
        const parsedEmployee = JSON.parse(employeeData);
        setEmployee(parsedEmployee);
        setPermissions(parsedEmployee.role?.permissions || []);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing employee data:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employees/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { employee: employeeData, token } = response.data.data;
        
        localStorage.setItem('employeeToken', token);
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
        
        setEmployee(employeeData);
        setPermissions(employeeData.role?.permissions || []);
        setIsAuthenticated(true);
        
        return { success: true, data: employeeData };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeData');
    setEmployee(null);
    setPermissions([]);
    setIsAuthenticated(false);
  };

  // Check if employee has permission for a specific module and action
  const hasPermission = (module, action) => {
    if (!permissions || !Array.isArray(permissions)) {
      return false;
    }

    const modulePermission = permissions.find(perm => perm.module === module);
    return modulePermission && modulePermission.actions.includes(action);
  };

  // Check if employee has any of the specified permissions
  const hasAnyPermission = (requiredPermissions) => {
    return requiredPermissions.some(required => 
      hasPermission(required.module, required.action)
    );
  };

  // Check if employee has specific role
  const hasRole = (roleName) => {
    return employee?.role?.name?.toLowerCase() === roleName.toLowerCase();
  };

  // Get accessible navigation items based on permissions
  const getAccessibleNavItems = () => {
    const navItems = [
      {
        path: '/dashboard',
        name: 'Dashboard',
        requiredPermission: { module: 'dashboard', action: 'read' }
      },
      {
        path: '/my-property',
        name: 'Properties',
        requiredPermission: { module: 'properties', action: 'read' }
      },
      {
        path: '/user',
        name: 'Users',
        requiredPermission: { module: 'users', action: 'read' }
      },
      {
        path: '/category',
        name: 'Categories',
        requiredPermission: { module: 'categories', action: 'read' }
      },
      {
        path: '/recent',
        name: 'Recent',
        requiredPermission: { module: 'recent', action: 'read' }
      },
      {
        path: '/bought-property',
        name: 'Bought Property',
        requiredPermission: { module: 'bought-property', action: 'read' }
      },
      {
        path: '/service-management',
        name: 'Services',
        requiredPermission: { module: 'service-management', action: 'read' }
      },
      {
        path: '/enquiries',
        name: 'Enquiries',
        requiredPermission: { module: 'enquiries', action: 'read' }
      },
      {
        path: '/leads',
        name: 'Enquiry Leads',
        requiredPermission: { module: 'leads', action: 'read' }
      },
      {
        path: '/client-leads',
        name: 'Client Leads',
        requiredPermission: { module: 'client-leads', action: 'read' }
      },
      {
        path: '/report&complaint',
        name: 'Reports & Complaints',
        requiredPermission: { module: 'reports-complaints', action: 'read' }
      },
      {
        path: '/role-management',
        name: 'Role Management',
        requiredPermission: { module: 'roles', action: 'read' }
      },
      {
        path: '/employee-management',
        name: 'Employee Management',
        requiredPermission: { module: 'employees', action: 'read' }
      },
      {
        path: '/settings',
        name: 'Settings',
        requiredPermission: { module: 'settings', action: 'read' }
      },
      {
        path: '/security',
        name: 'Security',
        requiredPermission: { module: 'security', action: 'read' }
      }
    ];

    return navItems.filter(item => 
      hasPermission(item.requiredPermission.module, item.requiredPermission.action)
    );
  };

  const value = {
    employee,
    permissions,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasRole,
    getAccessibleNavItems,
    checkAuthStatus
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionProvider;