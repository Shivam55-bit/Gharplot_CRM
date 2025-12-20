import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Tag,
  FileText,
  AlertTriangle,
  CreditCard,
  Settings,
  Shield,
  ShoppingCart,
  Wrench,
  MessageSquare,
  UserCog,
  UserPlus,
  Target,
  Bell,
  Menu,
  X,
  LogOut,
  Award,
  Briefcase
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { usePermissions } from "../../context/PermissionContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { recentProperties } = useAdmin();
  const { hasPermission, employee, isAuthenticated: isEmployeeAuthenticated } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileOpen(false); // Close mobile menu when switching to desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update body class when sidebar state changes
  useEffect(() => {
    if (isMobile) {
      // On mobile, manage body overflow and positioning
      if (isMobileOpen) {
        document.body.classList.add('mobile-sidebar-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('mobile-sidebar-open');
        document.body.style.overflow = '';
      }
    } else {
      // On desktop, manage collapsed state
      if (isCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-collapsed', 'mobile-sidebar-open');
      document.body.style.overflow = '';
    };
  }, [isCollapsed, isMobileOpen, isMobile]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Close mobile sidebar when clicking outside
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all tokens and user data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  // Check if user is admin (bypass all permission checks)
  const isAdminAuthenticated = localStorage.getItem('adminToken');
  
  // Get the count of recent properties (newly added)
  const recentPropertyCount = recentProperties?.length || 0;

  // Helper function to check if a menu item should be visible
  const canAccess = (module, action = 'read') => {
    // Admin can see everything - check for both adminToken and isAuthenticated admin state
    if (isAdminAuthenticated || localStorage.getItem('adminToken')) {
      console.log(`Admin access granted for ${module}`);
      return true;
    }
    
    // Check if employee has admin access flag
    if (employee && employee.giveAdminAccess) {
      console.log(`Employee admin access granted for ${module}`);
      return true;
    }
    
    // If not admin and not employee, hide everything except basic items
    if (!isEmployeeAuthenticated || !employee) {
      console.log(`No access for ${module} - not authenticated`);
      return false;
    }
    
    // Check employee permissions
    const hasAccess = hasPermission(module, action);
    console.log(`Employee access for ${module}: ${hasAccess}`);
    return hasAccess;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
          onClick={handleOverlayClick}
        />
      )}

      {/* Hamburger Toggle Button - only show when sidebar is closed */}
      {!(isMobile && isMobileOpen) && (
        <button 
          className={`hamburger-toggle ${isCollapsed ? 'collapsed' : ''}`}
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          style={{ display: isMobile || window.innerWidth <= 1024 ? 'flex' : 'flex' }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile && isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header Section */}
        <div className="sidebar-header">
          <div className="brand-logo d-flex align-items-center justify-content-start">
            <h4 className="brand-text mb-0">{isCollapsed && !isMobile ? 'AP' : 'Admin Panel'}</h4>
            {/* Close button inside sidebar */}
            {((isMobile && isMobileOpen) || (!isMobile && !isCollapsed)) && (
              <button 
                className="sidebar-close-btn"
                onClick={toggleSidebar}
                aria-label="Close Sidebar"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="admin-profile">
          <div className="admin-avatar">
            {isAdminAuthenticated ? 'SA' : (employee?.name?.charAt(0)?.toUpperCase() || 'E')}
          </div>
          {(!isCollapsed || isMobile) && (
            <div>
              <h6>
                {isAdminAuthenticated 
                  ? 'Super Admin' 
                  : (employee?.name || 'Employee')
                }
              </h6>
              <p>
                {isAdminAuthenticated 
                  ? 'Admin Panel' 
                  : (employee?.role?.name || 'Employee Panel')
                }
              </p>
            </div>
          )}
          <div className="status-dot"></div>
        </div>

        <ul className="nav flex-column mt-2">
          {/* Dashboard - Always visible to everyone */}
          <>
            {(!isCollapsed || isMobile) && <li className="nav-section">OVERVIEW</li>}
            <li className="nav-item">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Dashboard" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <LayoutDashboard size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Dashboard</span>}
              </NavLink>
            </li>
          </>

          {(canAccess('users') || canAccess('roles') || canAccess('employees') || canAccess('properties') || canAccess('bought-property') || canAccess('service-management') || canAccess('enquiries') || canAccess('leads') || isEmployeeAuthenticated) && (!isCollapsed || isMobile) && (
            <li className="nav-section">MANAGEMENT</li>
          )}
          {canAccess('users') && (
            <li className="nav-item">
              <NavLink
                to="/user"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "User Management" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Users size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>User Management</span>}
              </NavLink>
            </li>
          )}
          {canAccess('users') && (
            <li className="nav-item">
              <NavLink
                to="/user-lead-assignments"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "User Assignments" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <UserCog size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>User Assignments</span>}
              </NavLink>
            </li>
          )}
          {canAccess('roles') && (
            <li className="nav-item">
              <NavLink
                to="/role-management"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Role Management" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <UserCog size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Role Management</span>}
              </NavLink>
            </li>
          )}
          {canAccess('employees') && (
            <li className="nav-item">
              <NavLink
                to="/employee-management"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Employee Management" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <UserPlus size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Employee Management</span>}
              </NavLink>
            </li>
          )}
          {canAccess('employee_reports') && (
            <li className="nav-item">
              <NavLink
                to="/employee-reports"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Employee Reports" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <FileText size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Employee Reports</span>}
              </NavLink>
            </li>
          )}
          {isAdminAuthenticated && (
            <li className="nav-item">
              <NavLink
                to="/bad-attendant-alerts"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Bad Attendant Alerts" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Bell size={18} className="me-2" style={{color: '#dc2626'}} /> 
                {(!isCollapsed || isMobile) && <span style={{color: '#dc2626', fontWeight: 600}}>🚨 Bad Attendant Alerts</span>}
              </NavLink>
            </li>
          )}
          {isAdminAuthenticated && (
            <li className="nav-item">
              <NavLink
                to="/admin-reminders"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Admin Reminders Control" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Settings size={18} className="me-2" style={{color: '#3b82f6'}} /> 
                {(!isCollapsed || isMobile) && <span>Admin Reminders Control</span>}
              </NavLink>
            </li>
          )}
          {canAccess('properties') && (
            <li className="nav-item">
              <NavLink
                to="/category"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Property Management" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Tag size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Property Management</span>}
              </NavLink>
            </li>
          )}
          {canAccess('properties') && (
            <li className="nav-item">
              <NavLink
                to="/recent"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Property Listings" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <FileText size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Property Listings</span>}
                {recentPropertyCount > 0 && (!isCollapsed || isMobile) && (
                  <span className="badge">{recentPropertyCount}</span>
                )}
              </NavLink>
            </li>
          )}
          {canAccess('bought-property') && (
            <li className="nav-item">
              <NavLink
                to="/bought-property"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Bought Property" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <ShoppingCart size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Bought Property</span>}
              </NavLink>
            </li>
          )}
          {canAccess('service-management') && (
            <li className="nav-item">
              <NavLink
                to="/service-management"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Service Management" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Wrench size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Service Management</span>}
              </NavLink>
            </li>
          )}
          {canAccess('enquiries') && (
            <li className="nav-item">
              <NavLink
                to="/enquiries"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Enquiries" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <MessageSquare size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Enquiries</span>}
              </NavLink>
            </li>
          )}

          {/* USP Section */}
          {canAccess('usp') && (!isCollapsed || isMobile) && (
            <li className="nav-section">USP MANAGEMENT</li>
          )}
          {canAccess('usp') && (
            <li className="nav-item">
              <NavLink
                to="/usp-categories"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "USP Categories" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Award size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>USP Categories</span>}
              </NavLink>
            </li>
          )}
          {canAccess('usp') && (
            <li className="nav-item">
              <NavLink
                to="/usp-employees"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "USP Employees" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Briefcase size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>USP Employees</span>}
              </NavLink>
            </li>
          )}
          
          {/* Leads section for all employees and admins */}
          {(isEmployeeAuthenticated || isAdminAuthenticated || localStorage.getItem('adminToken')) && (
            <>
              {(!isCollapsed || isMobile) && <li className="nav-section">MY ASSIGNMENTS</li>}
              <li className="nav-item">
                <NavLink
                  to="/all-leads"
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  title={isCollapsed && !isMobile ? "All Leads" : ""}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <Users size={18} className="me-2" /> 
                  {(!isCollapsed || isMobile) && <span>All Leads</span>}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/reminders"
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  title={isCollapsed && !isMobile ? "My Reminders" : ""}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <Bell size={18} className="me-2" /> 
                  {(!isCollapsed || isMobile) && <span>My Reminders</span>}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/follow-ups"
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  title={isCollapsed && !isMobile ? "Follow-ups" : ""}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <Target size={18} className="me-2" /> 
                  {(!isCollapsed || isMobile) && <span>Follow-ups</span>}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/alerts"
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  title={isCollapsed && !isMobile ? "Alerts" : ""}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <Bell size={18} className="me-2" style={{color: '#ff9800'}} /> 
                  {(!isCollapsed || isMobile) && <span>Alerts</span>}
                </NavLink>
              </li>
            </>
          )}

          {canAccess('reports-complaints') && (
            <>
              {(!isCollapsed || isMobile) && <li className="nav-section">OPERATIONS</li>}
              <li className="nav-item">
                <NavLink
                  to="/report&complaint"
                  className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                  title={isCollapsed && !isMobile ? "Reports & Complaints" : ""}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <AlertTriangle size={18} className="me-2" /> 
                  {(!isCollapsed || isMobile) && <span>Reports & Complaints</span>}
                  {(!isCollapsed || isMobile) && <span className="badge blue">5</span>}
                </NavLink>
              </li>
            </>
          )}

          {(canAccess('settings') || canAccess('security')) && (!isCollapsed || isMobile) && (
            <li className="nav-section">SYSTEM</li>
          )}
          {canAccess('settings') && (
            <li className="nav-item">
              <NavLink
                to="/settings"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Settings" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Settings size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Settings</span>}
              </NavLink>
            </li>
          )}
          {canAccess('security') && (
            <li className="nav-item">
              <NavLink
                to="/security"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                title={isCollapsed && !isMobile ? "Security" : ""}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                <Shield size={18} className="me-2" /> 
                {(!isCollapsed || isMobile) && <span>Security</span>}
              </NavLink>
            </li>
          )}
        </ul>

        {/* Logout Button */}
        <button 
          className="logout-button"
          onClick={handleLogout}
          title={isCollapsed && !isMobile ? "Logout" : ""}
        >
          <LogOut size={18} />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </button>

        <hr className="" />

        {/* Footer */}
        {(!isCollapsed || isMobile) && (
          <div className="sidebar-footer m-0 p-0">
            <small>v2.1.0 © 2025 GharPlot</small>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;