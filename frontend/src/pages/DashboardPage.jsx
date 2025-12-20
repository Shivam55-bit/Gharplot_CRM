import React, { useState, useEffect } from "react";
import DashboardCards from "../component/DashboardCards/DashboardCards.jsx";
import AdminAnalytics from "../component/AdminAnalytics/AdminAnalytics.jsx";
import AdminNotificationBanner from "../component/AdminNotificationBanner/AdminNotificationBanner.jsx";
import { useAdmin } from "../context/AdminContext";
import { usePermissions } from "../context/PermissionContext";
import { FaSync, FaLock, FaBell } from "react-icons/fa";
import EnquiryChart from "../component/EnquiryChart/EnquiryChart.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig.jsx";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const { refreshAllData, loading } = useAdmin();
  const { hasPermission, isAuthenticated, employee } = usePermissions();
  const [enquiryData, setEnquiryData] = useState({ total: 0, client: 0, manual: 0 });
  const [enquiryLoading, setEnquiryLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertFormData, setAlertFormData] = useState({
    date: '',
    time: '',
    reason: '',
    repeatDaily: false
  });
  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem("adminToken");
    const employeeToken = localStorage.getItem("employeeToken");
    const token = adminToken || employeeToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Check if user has dashboard read permission
  const canViewDashboard = hasPermission('dashboard', 'read');
  const isAdmin = localStorage.getItem('adminToken'); // Admin has full access

  // Handle alert form input change
  const handleAlertInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertFormData({
      ...alertFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle create alert from dashboard
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('adminToken') || 
                    localStorage.getItem('employeeToken');
      
      const response = await axios.post(`${API_BASE_URL}/api/alerts`, alertFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Alert created successfully!');
      setShowAlertModal(false);
      setAlertFormData({ date: '', time: '', reason: '', repeatDaily: false });
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert. Please try again.');
    }
  };

  // Fetch enquiry data
  useEffect(() => {
    const fetchEnquiryData = async () => {
      try {
        setEnquiryLoading(true);
        
        // Fetch both user enquiries and manual enquiries
        const [userEnquiriesRes, manualEnquiriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/inquiry/get-enquiries`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/inquiry/all`, { headers: getAuthHeaders() })
        ]);
        
        let userEnquiriesCount = 0;
        let manualEnquiriesCount = 0;
        
        if (userEnquiriesRes.data && userEnquiriesRes.data.data) {
          userEnquiriesCount = userEnquiriesRes.data.data.length;
        }
        
        if (manualEnquiriesRes.data && manualEnquiriesRes.data.data) {
          manualEnquiriesCount = manualEnquiriesRes.data.data.length;
        }
        
        const totalCount = userEnquiriesCount + manualEnquiriesCount;
        
        setEnquiryData({
          total: totalCount,
          client: userEnquiriesCount,
          manual: manualEnquiriesCount
        });
      } catch (err) {
        console.error("Error fetching enquiry data:", err);
      } finally {
        setEnquiryLoading(false);
      }
    };

    fetchEnquiryData();
  }, []);

  // Inline style for background
  const pageStyle = {
    backgroundColor: "#f0f0f0", // Very light gray background
    minHeight: "100vh",
    padding: "1rem",
    color: "#000", // Black text for better visibility on light gray background
  };

  // Permission check - show access denied if no permission
  if (isAuthenticated && !canViewDashboard && !isAdmin) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ ...pageStyle, minHeight: "80vh" }}>
        <div className="text-center">
          <FaLock size={64} className="text-muted mb-4" />
          <h3 className="text-muted mb-3">Access Denied</h3>
          <p className="text-muted mb-4">
            You don't have permission to view the dashboard.<br />
            Contact your administrator to get <strong>"Dashboard Read"</strong> permission.
          </p>
          <div className="alert alert-info">
            <small>
              <strong>Your Role:</strong> {employee?.role?.name || 'Not assigned'}<br />
              <strong>Required Permission:</strong> Dashboard → Read Access
            </small>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboardPage-container pt-5 mt-5" style={pageStyle}>
      {/* Top Action Bar */}
      <div className="container mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0 fw-bold text-primary">Dashboard</h4>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowAlertModal(true)}
            >
              <FaBell className="me-2" />
              Create Alert
            </button>
            <button 
              className="btn btn-outline-primary d-flex align-items-center"
              onClick={() => navigate('/alerts')}
            >
              View All Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Alert</h2>
              <button className="modal-close" onClick={() => setShowAlertModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateAlert}>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={alertFormData.date}
                  onChange={handleAlertInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  name="time"
                  value={alertFormData.time}
                  onChange={handleAlertInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  name="reason"
                  value={alertFormData.reason}
                  onChange={handleAlertInputChange}
                  required
                  rows="4"
                  placeholder="Enter alert reason..."
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="repeatDaily"
                    checked={alertFormData.repeatDaily}
                    onChange={handleAlertInputChange}
                  />
                  <span>Repeat Daily</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAlertModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="container">
        <DashboardCards />
      </div>
      
      {/* <AdminNotificationBanner tenantCount={74} /> */}
      
      {/* Enquiry Chart */}
      <section className="mt-4">
        <div className="container">
          <div className="enquiry-overview-card card border-0 rounded-3 shadow-sm">
            <div className="card-body py-2">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-3 gap-2">
                <h5 className="card-title mb-0 fw-bold text-primary fs-4">Enquiry Overview</h5>
                <div className="d-flex flex-wrap gap-1">
                  <div className="badge bg-primary badge-animated badge-sm">Total: {enquiryData.total}</div>
                  <div className="badge bg-info badge-animated badge-sm">Client: {enquiryData.client}</div>
                  <div className="badge bg-warning badge-animated badge-sm">Manual: {enquiryData.manual}</div>
                </div>
              </div>
              {enquiryLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3">
                  <div className="col-lg-4 mb-0">
                    <EnquiryChart 
                      total={enquiryData.total}
                      client={enquiryData.client}
                      manual={enquiryData.manual}
                    />
                  </div>
                  <div className="col-lg-5">
                    <div className="stats-summary rounded-2 p-3">
                      <h6 className="text-muted mb-2 fw-medium fs-7">Enquiry Distribution</h6>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center stat-item py-1">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary me-2 stat-dot"></div>
                            <span className="fw-medium fs-8">Client</span>
                          </div>
                          <span className="fw-bold fs-8 text-primary">{enquiryData.client}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center stat-item py-1">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-warning me-2 stat-dot"></div>
                            <span className="fw-medium fs-8">Manual</span>
                          </div>
                          <span className="fw-bold fs-8 text-warning">{enquiryData.manual}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Admin Analytics Section */}
      <section className="mt-4">
        <div className="container">
          <div className="card border-0 rounded-3 shadow-sm">
            <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h5 className="mb-0 fw-bold" style={{ color: '#0d6efd' }}>📊 Your Personal Analytics</h5>
              <small>Track your leads, reminders, and properties</small>
            </div>
            <div className="card-body p-4" style={{ overflowX: 'hidden' }}>
              <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <AdminAnalytics />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 22px;
          color: #333;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
        }
        .modal-close:hover {
          color: #333;
        }
        form {
          padding: 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        .form-group input[type="date"],
        .form-group input[type="time"],
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }
        .form-group textarea {
          resize: vertical;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 0;
        }
        .checkbox-group input[type="checkbox"] {
          margin-right: 8px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }
        .btn-cancel, .btn-submit {
          padding: 10px 24px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-cancel {
          background: #e0e0e0;
          color: #333;
        }
        .btn-cancel:hover {
          background: #d5d5d5;
        }
        .btn-submit {
          background: #4CAF50;
          color: white;
        }
        .btn-submit:hover {
          background: #45a049;
        }
        .admin-analytics-container {
          overflow-x: hidden;
          max-width: 100%;
        }
        .admin-analytics-container .row {
          margin-left: 0;
          margin-right: 0;
        }
        .admin-analytics-container .col-md-6 {
          padding-left: 8px;
          padding-right: 8px;
        }
        .timeline-stats .stat-item {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .timeline-stats .stat-item:hover {
          background-color: rgba(255, 255, 255, 0.9) !important;
          color: #000 !important;
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .timeline-stats .stat-item:hover span {
          color: #000 !important;
        }
        .timeline-stats .stat-item:hover .badge {
          color: #fff !important;
        }
        .timeline-stats .stat-item.bg-primary:hover {
          background-color: rgba(255, 255, 255, 0.95) !important;
        }
        .timeline-stats .stat-item.bg-primary:hover span {
          color: #000 !important;
        }
        .stats-summary {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 0.75rem;
        }
        .badge {
          font-size: 0.75rem;
          padding: 0.25em 0.5em;
          transition: all 0.3s ease;
        }
        .badge-sm {
          font-size: 0.7rem;
          padding: 0.2em 0.4em;
        }
        .badge-animated {
          animation: badge-pulse 2s infinite;
        }
        @keyframes badge-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .stat-dot {
          width: 8px;
          height: 8px;
          transition: all 0.3s ease;
        }
        .stat-item:hover .stat-dot {
          transform: scale(1.2);
        }
        .stat-item {
          transition: all 0.3s ease;
          border-radius: 6px;
        }
        .stat-item:hover {
          background-color: rgba(0,0,0,0.03);
          transform: translateX(3px);
        }
        .enquiry-overview-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }
        .enquiry-overview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>
    </div>
  );
}

export default DashboardPage;