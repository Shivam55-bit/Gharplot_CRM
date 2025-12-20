import React, { useState, useEffect } from "react";
import { 
  User, 
  Clock, 
  CheckSquare, 
  AlertCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin,
  Filter,
  Search,
  Plus,
  Edit3,
  Eye,
  Target,
  Users,
  TrendingUp,
  UserCheck,
  X
} from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResultDisplay from "../../components/ResultDisplay/ResultDisplay.jsx";
import "./FollowUpPage.css";

const FollowUpPage = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    caseStatus: 'all',
    leadType: 'all',
    priority: 'all',
    assignedAgent: 'all'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFollowUps, setTotalFollowUps] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [actionTaken, setActionTaken] = useState('other');
  const [employees, setEmployees] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('All Employees');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [followUpToClose, setFollowUpToClose] = useState(null);
  const [closeResult, setCloseResult] = useState('');
  const [closeResultError, setCloseResultError] = useState('');

  // Detect user role based on available tokens and stored role
  const detectUserRole = () => {
    const storedRole = localStorage.getItem('userRole');
    const adminToken = localStorage.getItem('adminToken');
    const employeeToken = localStorage.getItem('employeeToken');
    
    // If there's an explicit role stored, use it
    if (storedRole) {
      return storedRole;
    }
    
    // Otherwise, infer from available tokens
    if (adminToken) {
      return 'admin';
    } else if (employeeToken) {
      return 'employee';
    } else {
      return 'employee'; // default fallback
    }
  };

  const userRole = detectUserRole();
  const isAdmin = userRole === 'admin' || userRole === 'manager';
  
  // Debug logging
  console.log('FollowUpPage - Detected user role:', userRole);
  console.log('FollowUpPage - Is admin:', isAdmin);
  console.log('FollowUpPage - Available tokens:', {
    adminToken: !!localStorage.getItem('adminToken'),
    employeeToken: !!localStorage.getItem('employeeToken'),
    token: !!localStorage.getItem('token'),
    storedRole: localStorage.getItem('userRole')
  });

  // Status and priority options
  const statusOptions = [
    { value: 'all', label: 'All Status', color: '#6b7280' },
    { value: 'open', label: 'Open', color: '#10b981' },
    { value: 'close', label: 'Closed', color: '#ef4444' },
    { value: 'not-interested', label: 'Not Interested', color: '#f59e0b' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'urgent', label: 'Urgent', color: '#dc2626' }
  ];

  const actionTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'meeting', label: 'Meeting', icon: Users },
    { value: 'site_visit', label: 'Site Visit', icon: MapPin },
    { value: 'document_sent', label: 'Document Sent', icon: MessageSquare },
    { value: 'follow_up_scheduled', label: 'Follow-up Scheduled', icon: Calendar },
    { value: 'other', label: 'Other', icon: Edit3 }
  ];

  useEffect(() => {
    fetchFollowUps();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [page, filter, searchTerm, selectedEmployeeId]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      
      // Use role-appropriate token
      let token;
      if (isAdmin) {
        token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      } else {
        token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
      }
      
      if (!token) {
        setError('Authentication required. Please login again.');
        toast.error('Please login to view follow-ups');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm
      });

      // Add filters
      Object.keys(filter).forEach(key => {
        if (filter[key] !== 'all') {
          params.append(key, filter[key]);
        }
      });

      // Use role-based endpoint selection
      let endpoint;
      
      if (isAdmin) {
        endpoint = '/api/follow-ups/all';
      } else {
        endpoint = '/api/follow-ups/my-followups';
      }

      // If admin selected a specific employee, use my-followups endpoint with that employee's token/data
      if (isAdmin && selectedEmployeeId !== 'all') {
        // For admins viewing specific employee data, we'll add assignedAgent filter to the all endpoint
        params.append('assignedAgent', selectedEmployeeId);
      }

      console.log(`User role: ${userRole}, Using endpoint: ${endpoint}`);
      console.log(`Selected employee filter: ${selectedEmployeeId}`);
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Validate and set followUps array
        const followUpsData = response.data.data?.followUps;
        if (Array.isArray(followUpsData)) {
          setFollowUps(followUpsData);
        } else {
          console.warn('Invalid followUps data structure:', followUpsData);
          setFollowUps([]);
        }
        
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        setTotalFollowUps(response.data.data.pagination?.total || 0);
        
        // Validate and process statistics - only for admin endpoint
        if (response.data.data.statistics && isAdmin) {
          const stats = response.data.data.statistics;
          const processedStats = {};
          
          Object.keys(stats).forEach(key => {
            const value = stats[key];
            // Handle objects with _id and count structure
            if (value && typeof value === 'object' && value._id !== undefined && value.count !== undefined) {
              processedStats[key] = value.count;
            } else if (typeof value === 'number') {
              processedStats[key] = value;
            } else if (typeof value === 'string' && !isNaN(value)) {
              processedStats[key] = parseInt(value, 10);
            } else {
              console.warn(`Invalid statistics value for ${key}:`, value);
              processedStats[key] = 0;
            }
          });
          
          setStatistics(processedStats);
        } else if (!isAdmin) {
          // For employees, don't show statistics or show basic count
          setStatistics({ my_followups: followUpsData.length || 0 });
        }
      }
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
      setError('Failed to fetch follow-ups. Please check your authentication.');
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const employeesData = response.data.data;
        if (Array.isArray(employeesData)) {
          setEmployees(employeesData);
        } else {
          console.warn('Invalid employees data structure:', employeesData);
          setEmployees([]);
        }
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]); // Set empty array on error
    }
  };

  // Helper function to count words
  const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleCloseFollowUp = (followUp) => {
    setFollowUpToClose(followUp);
    setCloseResult('');
    setCloseResultError('');
    setShowCloseModal(true);
  };

  const handleStatusUpdate = async (followUpId, newStatus, closeReason = '', result = '') => {
    try {
      // Validate result for closing
      if (newStatus === 'close') {
        if (!result || result.trim().length === 0) {
          setCloseResultError('Result is required when closing a follow-up');
          toast.error('Result is required when closing a follow-up');
          return;
        }
        const wordCount = countWords(result);
        if (wordCount < 1) {
          setCloseResultError('Result must contain at least 1 word');
          toast.error('Result must contain at least 1 word');
          return;
        }
      }

      // Use role-appropriate token
      let token;
      if (isAdmin) {
        token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      } else {
        token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
      }
      
      const requestBody = {
        caseStatus: newStatus,
        closeReason: closeReason
      };

      // Add result and word count for closing
      if (newStatus === 'close' && result) {
        requestBody.result = result.trim();
        requestBody.wordCount = countWords(result);
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/api/follow-ups/${followUpId}/status`,
        requestBody,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Status updated successfully');
        fetchFollowUps();
        // Close modal if it was open
        if (showCloseModal) {
          setShowCloseModal(false);
          setFollowUpToClose(null);
          setCloseResult('');
          setCloseResultError('');
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleConfirmClose = () => {
    if (!followUpToClose) return;
    handleStatusUpdate(followUpToClose._id, 'close', '', closeResult);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      // Use role-appropriate token
      let token;
      if (isAdmin) {
        token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      } else {
        token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
      }
      
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      console.log('Adding comment to follow-up:', selectedFollowUp._id);
      console.log('Comment data:', { text: newComment, actionTaken });
      
      const response = await axios.post(
        `${API_BASE_URL}/api/follow-ups/${selectedFollowUp._id}/comment`,
        {
          text: newComment,
          actionTaken: actionTaken
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Comment response:', response.data);

      if (response.data.success) {
        toast.success('Comment added successfully');
        setNewComment('');
        setActionTaken('other');
        setShowCommentModal(false);
        fetchFollowUps();
      } else {
        toast.error(response.data.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      const errorMessage = err.response?.data?.message || 'Failed to add comment';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(opt => opt.value === status);
    return (
      <span 
        className={`status-badge status-${status}`}
        style={{ backgroundColor: statusConfig?.color + '20', color: statusConfig?.color }}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = priorityOptions.find(opt => opt.value === priority);
    return (
      <span 
        className={`priority-badge priority-${priority}`}
        style={{ backgroundColor: priorityConfig?.color + '20', color: priorityConfig?.color }}
      >
        {priorityConfig?.label || priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Parse ISO string and extract UTC components to display as-is
    const isoDate = new Date(dateString);
    const year = isoDate.getUTCFullYear();
    const month = isoDate.getUTCMonth();
    const day = isoDate.getUTCDate();
    const hours = isoDate.getUTCHours();
    const minutes = isoDate.getUTCMinutes();
    
    // Create display date
    const dateObj = new Date(year, month, day);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    return `${monthNames[month]} ${day}, ${year}, ${formattedTime}`;
  };

  const getLeadTypeDisplay = (leadType) => {
    return leadType === 'UserLeadAssignment' ? 'User Lead' : 'Enquiry Lead';
  };

  const getLeadTypeBadge = (leadType) => {
    const isUserLead = leadType === 'UserLeadAssignment';
    return {
      backgroundColor: isUserLead ? '#059669' : '#0ea5e9',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };
  };

  if (loading && followUps.length === 0) {
    return (
      <div className="follow-up-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="follow-up-page mt-5" style={{ width: '100%', maxWidth: 'none', overflow: 'visible' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Target className="header-icon" />
            <div>
              <h1>
                Follow-ups
                {isAdmin && selectedEmployeeId !== 'all' && (
                  <span className="text-muted fs-6 ms-2">- {selectedEmployeeName}</span>
                )}
              </h1>
              <p>
                {isAdmin 
                  ? (selectedEmployeeId === 'all' 
                      ? 'Manage and track all team follow-ups' 
                      : `Viewing follow-ups assigned to ${selectedEmployeeName}`)
                  : 'Manage and track your assigned follow-ups'
                }
              </p>
            </div>

            {/* Employee Filter for Admin - Right side of title */}
            {isAdmin && (
              <div className="employee-filter-section-right">
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-semibold">View Follow-ups for:</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '200px' }}
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      const employeeId = e.target.value;
                      setSelectedEmployeeId(employeeId);
                      
                      if (employeeId === 'all') {
                        setSelectedEmployeeName('All Employees');
                      } else {
                        const selectedEmp = employees.find(emp => emp._id === employeeId);
                        setSelectedEmployeeName(selectedEmp?.name || 'Unknown Employee');
                      }
                      
                      // Reset to first page when changing employee filter
                      setPage(1);
                    }}
                  >
                    <option value="all">🌟 All Employees (Admin View)</option>
                    {Array.isArray(employees) && employees.map(emp => {
                      if (!emp || typeof emp !== 'object' || !emp._id || !emp.name) {
                        return null;
                      }
                      return (
                        <option key={emp._id} value={emp._id}>
                          👤 {emp.name} {emp.role?.name ? `(${emp.role.name})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {selectedEmployeeId !== 'all' && (
                    <span className="badge bg-primary">
                      Viewing: {selectedEmployeeName}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Statistics Cards */}
          <div className="stats-cards">
            {statistics && Object.entries(statistics).map(([status, count], index) => {
              // Ensure count is a number or string, not an object
              const displayCount = (typeof count === 'object' && count !== null) 
                ? (count.count !== undefined ? count.count : JSON.stringify(count))
                : count;
              
              // Create proper labels for the status cards
              const getStatusLabel = (statusKey, index) => {
                switch (statusKey) {
                  case 'open':
                    return 'Open';
                  case 'close':
                  case 'closed':
                    return 'Closed';
                  case 'not_interested':
                  case 'not-interested':
                    return 'Not Interested';
                  case 'pending':
                    return 'Pending';
                  case 'my_followups':
                    return 'My Follow-ups';
                  default:
                    // For the first and second cards if no specific status match
                    if (index === 0) return 'Open';
                    if (index === 1) return 'Closed';
                    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
              };
              
              return (
                <div key={status} className="stat-card">
                  <div className="stat-value">{displayCount}</div>
                  <div className="stat-label">{getStatusLabel(status, index)}</div>
                </div>
              );
            })}
            <div className="stat-card">
              <div className="stat-value">{totalFollowUps}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by client name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
        </button>

        {showFilters && (
          <div className="filters-container">
            <select
              value={filter.caseStatus}
              onChange={(e) => setFilter({...filter, caseStatus: e.target.value})}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filter.priority}
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filter.leadType}
              onChange={(e) => setFilter({...filter, leadType: e.target.value})}
            >
              <option value="all">All Lead Types</option>
              <option value="UserLeadAssignment">User Leads</option>
              <option value="LeadAssignment">Enquiry Leads</option>
            </select>

            {isAdmin && (
              <select
                value={filter.assignedAgent}
                onChange={(e) => setFilter({...filter, assignedAgent: e.target.value})}
              >
                <option value="all">All Agents</option>
                {Array.isArray(employees) && employees.map(emp => {
                  // Validate employee object
                  if (!emp || typeof emp !== 'object' || !emp._id || !emp.name) {
                    console.warn('Invalid employee object:', emp);
                    return null;
                  }
                  return (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  );
                })}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Follow-ups Table */}
      <div className="follow-ups-content" style={{ width: '100%', maxWidth: 'none', overflow: 'visible' }}>
        {!Array.isArray(followUps) || followUps.length === 0 ? (
          <div className="empty-state">
            <Target size={48} />
            <h3>No follow-ups found</h3>
            <p>
              {isAdmin && selectedEmployeeId !== 'all'
                ? `${selectedEmployeeName} has no follow-ups matching your current filters.`
                : isAdmin
                ? 'No follow-ups match your current filters.'
                : 'You have no follow-ups assigned to you yet.'
              }
            </p>
            {isAdmin && selectedEmployeeId !== 'all' && (
              <button 
                className="btn btn-outline-primary mt-2"
                onClick={() => {
                  setSelectedEmployeeId('all');
                  setSelectedEmployeeName('All Employees');
                }}
              >
                View All Employees
              </button>
            )}
          </div>
        ) : (
          <div style={{ 
            width: '100%',
            maxWidth: 'calc(100vw - 280px)', // Account for sidebar width
            marginLeft: '0',
            padding: '0',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              margin: '0 auto'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <h6 style={{ margin: 0, fontWeight: '600' }}>
                  Follow-ups List ({totalFollowUps} total)
                </h6>
              </div>
              
              <div style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
                scrollbarWidth: 'thin'
              }}>
                <table style={{
                  width: '100%',
                  minWidth: '1600px', // Reduced from 1800px to fit better
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead style={{ backgroundColor: '#374151', color: 'white' }}>
                    <tr>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '150px', borderRight: '1px solid #4b5563' }}>Client Name</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', borderRight: '1px solid #4b5563' }}>Type</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '130px', borderRight: '1px solid #4b5563' }}>Phone</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '220px', borderRight: '1px solid #4b5563' }}>Email</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '150px', borderRight: '1px solid #4b5563' }}>Location</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', borderRight: '1px solid #4b5563' }}>Agent</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', borderRight: '1px solid #4b5563' }}>Priority</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', borderRight: '1px solid #4b5563' }}>Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '140px', borderRight: '1px solid #4b5563' }}>Created</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '140px', borderRight: '1px solid #4b5563' }}>Next Follow-up</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '200px', borderRight: '1px solid #4b5563' }}>Comment</th>
                      {isAdmin && <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '150px', borderRight: '1px solid #4b5563' }}>Result</th>}
                      <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUps.map((followUp) => {
                      // Validate each followUp object
                      if (!followUp || typeof followUp !== 'object' || typeof followUp._id !== 'string') {
                        console.warn('Invalid followUp object:', followUp);
                        return null;
                      }
                      
                      return (
                        <tr key={followUp._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          {/* Client Name */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            <strong>{followUp.leadData?.clientName || 'N/A'}</strong>
                          </td>

                          {/* Lead Type */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            <span style={getLeadTypeBadge(followUp.leadType)}>
                              {followUp.leadType === 'UserLeadAssignment' ? (
                                <>👤 USER</>
                              ) : (
                                <>📞 ENQUIRY</>
                              )}
                            </span>
                          </td>

                          {/* Phone */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                            {followUp.leadData?.clientPhone || 'N/A'}
                          </td>

                          {/* Email */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            {followUp.leadData?.clientEmail && followUp.leadData.clientEmail !== 'N/A' 
                              ? followUp.leadData.clientEmail 
                              : 'N/A'
                            }
                          </td>

                          {/* Location */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb', color: '#6b7280' }}>
                            {followUp.leadData?.location || 'N/A'}
                          </td>

                          {/* Assigned Agent */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            <span style={{ 
                              backgroundColor: '#6b7280', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px' 
                            }}>
                              {followUp.assignedAgent?.name || 'Unassigned'}
                            </span>
                          </td>

                          {/* Priority */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            {getPriorityBadge(followUp.priority)}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            {getStatusBadge(followUp.caseStatus)}
                          </td>

                          {/* Created Date */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                            {formatDate(followUp.createdAt)}
                          </td>

                          {/* Next Follow-up */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                            {followUp.nextFollowUpDate ? (
                              <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '13px' }}>
                                {formatDate(followUp.nextFollowUpDate)}
                              </span>
                            ) : (
                              <span style={{ color: '#6b7280' }}>-</span>
                            )}
                          </td>

                          {/* Last Comment */}
                          <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                            {followUp.comments && followUp.comments.length > 0 ? (
                              <div title={followUp.comments[followUp.comments.length - 1].text}>
                                {followUp.comments[followUp.comments.length - 1].text}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Result (Admin only) */}
                          {isAdmin && (
                            <td style={{ padding: '12px 8px', borderRight: '1px solid #e5e7eb' }}>
                              <ResultDisplay 
                                result={followUp.result}
                                wordCount={followUp.wordCount}
                                caseStatus={followUp.caseStatus}
                                isCompact={true}
                              />
                            </td>
                          )}

                          {/* Actions */}
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                style={{
                                  border: '1px solid #3b82f6',
                                  backgroundColor: 'transparent',
                                  color: '#3b82f6',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                onClick={() => {
                                  setSelectedFollowUp(followUp);
                                  setShowCommentModal(true);
                                }}
                                title="Add Comment"
                              >
                                💬
                              </button>

                              {followUp.caseStatus === 'open' ? (
                                <button
                                  style={{
                                    border: '1px solid #10b981',
                                    backgroundColor: 'transparent',
                                    color: '#10b981',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  onClick={() => handleCloseFollowUp(followUp)}
                                  title="Close Follow-up"
                                >
                                  ✅
                                </button>
                              ) : (
                                <button
                                  style={{
                                    border: '1px solid #f59e0b',
                                    backgroundColor: 'transparent',
                                    color: '#f59e0b',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  onClick={() => handleStatusUpdate(followUp._id, 'open')}
                                  title="Reopen Follow-up"
                                >
                                  🔄
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(page - 1)} 
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          
          <button 
            onClick={() => setPage(page + 1)} 
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedFollowUp && (
        <div className="modal-overlay">
          <div className="modal-content comment-modal">
            <div className="modal-header">
              <h3>Add Comment - {selectedFollowUp.leadData?.clientName}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Action Taken</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                >
                  {actionTypes.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment here..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCommentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddComment}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Follow-up Modal */}
      {showCloseModal && followUpToClose && (
        <div className="modal-overlay">
          <div className="modal-content close-modal">
            <div className="modal-header">
              <h3>Close Follow-up - {followUpToClose.leadData?.clientName}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCloseModal(false);
                  setFollowUpToClose(null);
                  setCloseResult('');
                  setCloseResultError('');
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Closing Result * 
                  <span className="result-word-count">
                    ({countWords(closeResult)} words)
                  </span>
                </label>
                <textarea
                  value={closeResult}
                  onChange={(e) => {
                    setCloseResult(e.target.value);
                    setCloseResultError('');
                  }}
                  placeholder="Describe the outcome and result of this follow-up (minimum 1 word required)..."
                  rows="4"
                  className={closeResultError ? 'error' : ''}
                />
                {closeResultError && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {closeResultError}
                  </div>
                )}
                <div className="result-hint">
                  <span className={countWords(closeResult) >= 10 ? 'good' : 'needs-improvement'}>
                    {countWords(closeResult) < 10 
                      ? `Add ${10 - countWords(closeResult)} more words for a good result` 
                      : 'Good result length!'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCloseModal(false);
                  setFollowUpToClose(null);
                  setCloseResult('');
                  setCloseResultError('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmClose}
                disabled={!closeResult.trim()}
              >
                Close Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpPage;