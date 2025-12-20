import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./component/Dashboard/DashboardLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MyPropertyPage from "./pages/MyPropertyPage.jsx";
import UserPage from "./pages/UserPage.jsx";
import CategoryPage from "./pages/Category/CategoryPage.jsx";
import Signup from "./pages/Signup/Signup.jsx";
import Login from "./pages/Login/Login.jsx";
import ForgotPassword from "./pages/Login/ForgotPassword.jsx";
import UnifiedLogin from "./pages/UnifiedLogin/UnifiedLogin.jsx";
import SettingPage from "./pages/Setting/SettingPage.jsx";
import SecurityPage from "./pages/Security/SecurityPage.jsx";
import ReportsComplaints from "./pages/Report&Complaint/Report&Complaint.jsx";
import RecentPage from "./pages/RecentPage/RecentPage.jsx";
import BoughtPropertyPage from "./pages/BoughtProperty/BoughtPropertyPage.jsx";
import OtpVerificationPage from "./pages/OtpVerificationPage/OtpVerificationPage.jsx";
import ProtectedRoute from "./component/ProtectedRoute.jsx";
import ServiceManagementPage from "./pages/ServiceManagement/ServiceManagementPage.jsx";
import EnquiriesPage from "./pages/Enquiries/EnquiriesPage.jsx";
import RoleManagement from "./pages/RoleManagement/RoleManagement.jsx";
import EmployeeManagement from "./pages/EmployeeManagement/EmployeeManagement.jsx";
import EmployeeReports from "./pages/EmployeeReports.jsx";
import LeadsPage from "./pages/Leads/LeadsPage.jsx";
import ClientLeadsPage from "./pages/ClientLeads/ClientLeadsPage.jsx";
import UnifiedLeadsPage from "./pages/Leads/UnifiedLeadsPage.jsx";
import RemindersPage from "./pages/Reminders/RemindersPage.jsx";
import FollowUpPage from "./pages/FollowUp/FollowUpPage.jsx";
import GlobalReminderPopup from "./components/GlobalReminderPopup/GlobalReminderPopup.jsx";
import GlobalAlertPopup from "./components/GlobalAlertPopup/GlobalAlertPopup.jsx";
import UserLeadAssignmentsPage from "./pages/UserLeadAssignments/UserLeadAssignmentsPage.jsx";
import BadAttendantNotifications from "./pages/Admin/BadAttendantNotifications.jsx";
import AlertsPage from "./pages/Alerts/AlertsPage.jsx";
import USPCategories from "./pages/USP/USPCategories.jsx";
import USPEmployees from "./pages/USP/USPEmployees.jsx";
import AdminReminders from "./pages/Admin/AdminReminders.jsx";
import PropertiesPage from "./pages/Properties/PropertiesPage.jsx";

//  Import Context Provider
import { AdminProvider } from "./context/AdminContext.jsx";
import { PermissionProvider } from "./context/PermissionContext.jsx";
import EmployeeLogin from "./pages/EmployeeLogin/EmployeeLogin.jsx";
import PermissionProtectedRoute from "./component/PermissionProtectedRoute.jsx";
import SmartProtectedRoute from "./component/SmartProtectedRoute.jsx";

// Component to handle token retrieval for GlobalReminderPopup
const AuthenticatedApp = () => {
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    // Check for token in localStorage (try multiple possible keys)
    const getToken = () => {
      return localStorage.getItem('token') || 
             localStorage.getItem('adminToken') || 
             localStorage.getItem('employeeToken');
    };

    const token = getToken();
    console.log('🔑 App.jsx - Initial token check:', token ? 'Token found' : 'No token found');
    setAuthToken(token);

    // Listen for storage changes to update token dynamically
    const handleStorageChange = () => {
      const newToken = getToken();
      console.log('🔑 App.jsx - Token change detected:', newToken ? 'Token found' : 'No token found');
      setAuthToken(newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for token changes
    const tokenCheck = setInterval(() => {
      const currentToken = getToken();
      if (currentToken !== authToken) {
        console.log('🔑 App.jsx - Token updated via interval check');
        setAuthToken(currentToken);
      }
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenCheck);
    };
  }, [authToken]);

  // Debug logging for App component
  console.log('🏠 App.jsx render - Auth token:', authToken ? 'Available' : 'Not available');
  console.log('📍 Current location:', window.location.pathname);

  return (
    <>
      {/* Global Reminder Popup - render on all pages when token is available */}
      {console.log('🔔 Rendering GlobalReminderPopup:', !!authToken)}
      {authToken && <GlobalReminderPopup token={authToken} />}
      
      {/* Global Alert Popup - render on all pages when token is available */}
      {console.log('🔔 Rendering GlobalAlertPopup:', !!authToken)}
      {authToken && <GlobalAlertPopup token={authToken} />}
      
      <Routes>
        {/* Default redirect to login */ }
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentication Routes (No Layout) */ }
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/admin-login" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OtpVerificationPage />} />
      
        {/* Protected Routes with Layout */ }
        <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
        }>
          {/* Nested pages */ }
          <Route path="dashboard" element={
            <SmartProtectedRoute requiredPermission={{ module: 'dashboard', action: 'read' }}>
              <DashboardPage />
            </SmartProtectedRoute>
          } />
          <Route path="my-property" element={
            <SmartProtectedRoute requiredPermission={{ module: 'properties', action: 'read' }}>
              <MyPropertyPage />
            </SmartProtectedRoute>
          } />
          <Route path="properties" element={
            <SmartProtectedRoute requiredPermission={{ module: 'properties', action: 'read' }}>
              <PropertiesPage />
            </SmartProtectedRoute>
          } />
          <Route path="user" element={
            <SmartProtectedRoute requiredPermission={{ module: 'users', action: 'read' }}>
              <UserPage />
            </SmartProtectedRoute>
          } />
          <Route path="category" element={
            <SmartProtectedRoute requiredPermission={{ module: 'categories', action: 'read' }}>
              <CategoryPage />
            </SmartProtectedRoute>
          } />
          <Route path="recent" element={
            <SmartProtectedRoute requiredPermission={{ module: 'recent', action: 'read' }}>
              <RecentPage />
            </SmartProtectedRoute>
          } />
          <Route path="bought-property" element={
            <SmartProtectedRoute requiredPermission={{ module: 'bought-property', action: 'read' }}>
              <BoughtPropertyPage />
            </SmartProtectedRoute>
          } />
          <Route path="settings" element={
            <SmartProtectedRoute requiredPermission={{ module: 'settings', action: 'read' }}>
              <SettingPage />
            </SmartProtectedRoute>
          } />
          <Route path="security" element={
            <SmartProtectedRoute requiredPermission={{ module: 'security', action: 'read' }}>
              <SecurityPage />
            </SmartProtectedRoute>
          } />
          <Route path="report&complaint" element={
            <SmartProtectedRoute requiredPermission={{ module: 'reports-complaints', action: 'read' }}>
              <ReportsComplaints />
            </SmartProtectedRoute>
          } />
          <Route path="service-management" element={
            <SmartProtectedRoute requiredPermission={{ module: 'service-management', action: 'read' }}>
              <ServiceManagementPage />
            </SmartProtectedRoute>
          } />
          <Route path="enquiries" element={
            <SmartProtectedRoute requiredPermission={{ module: 'enquiries', action: 'read' }}>
              <EnquiriesPage />
            </SmartProtectedRoute>
          } />
          <Route path="role-management" element={
            <SmartProtectedRoute requiredPermission={{ module: 'roles', action: 'read' }}>
              <RoleManagement />
            </SmartProtectedRoute>
          } />
          <Route path="employee-management" element={
            <SmartProtectedRoute requiredPermission={{ module: 'employees', action: 'read' }}>
              <EmployeeManagement />
            </SmartProtectedRoute>
          } />
          <Route path="employee-reports" element={
            <SmartProtectedRoute requiredPermission={{ module: 'employee_reports', action: 'read' }}>
              <EmployeeReports />
            </SmartProtectedRoute>
          } />
          <Route path="bad-attendant-alerts" element={
            <SmartProtectedRoute requiredPermission={{ module: 'admin', action: 'read' }}>
              <BadAttendantNotifications />
            </SmartProtectedRoute>
          } />
          <Route path="leads" element={
            <SmartProtectedRoute>
              <LeadsPage />
            </SmartProtectedRoute>
          } />
          <Route path="client-leads" element={
            <SmartProtectedRoute>
              <ClientLeadsPage />
            </SmartProtectedRoute>
          } />
          <Route path="all-leads" element={
            <SmartProtectedRoute>
              <UnifiedLeadsPage />
            </SmartProtectedRoute>
          } />
          <Route path="reminders" element={
            <SmartProtectedRoute>
              <RemindersPage />
            </SmartProtectedRoute>
          } />
          <Route path="follow-ups" element={
            <SmartProtectedRoute>
              <FollowUpPage />
            </SmartProtectedRoute>
          } />
          <Route path="user-lead-assignments" element={
            <SmartProtectedRoute requiredPermission={{ module: 'users', action: 'read' }}>
              <UserLeadAssignmentsPage />
            </SmartProtectedRoute>
          } />
          <Route path="alerts" element={
            <SmartProtectedRoute>
              <AlertsPage />
            </SmartProtectedRoute>
          } />
          <Route path="usp-categories" element={
            <SmartProtectedRoute requiredPermission={{ module: 'usp', action: 'read' }}>
              <USPCategories />
            </SmartProtectedRoute>
          } />
          <Route path="usp-employees" element={
            <SmartProtectedRoute requiredPermission={{ module: 'usp', action: 'read' }}>
              <USPEmployees />
            </SmartProtectedRoute>
          } />
          <Route path="admin-reminders" element={
            <SmartProtectedRoute requiredPermission={{ module: 'admin', action: 'read' }}>
              <AdminReminders />
            </SmartProtectedRoute>
          } />
        </Route>

        {/* 404 Not Found */ }
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    //  Wrap entire app inside providers
    <PermissionProvider>
      <AdminProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
      </AdminProvider>
    </PermissionProvider>
  );
}

export default App;