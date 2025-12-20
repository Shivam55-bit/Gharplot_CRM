import React, { useState, useEffect } from "react";
import { Users, User, Clock, CheckSquare, AlertCircle, MapPin, Phone, Mail, Calendar, RefreshCw, Bell, FileText, Star, Search, X } from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import ReminderModal from "../../components/ReminderModal/ReminderModal.jsx";
import ReminderPopup from "../../components/ReminderPopup/ReminderPopup.jsx";
import FollowUpModal from "../../components/FollowUpModal/FollowUpModal.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./ClientLeadsPage.css";

const ClientLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const itemsPerPage = 10;

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [allLeads, setAllLeads] = useState([]); // Store all leads for client-side filtering
  const [filteredLeads, setFilteredLeads] = useState([]);

  // Favorite functionality
  const [favoriteLeads, setFavoriteLeads] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Employee filter states (for admin)
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('All Employees');

  // Detect user role
  const detectUserRole = () => {
    const storedRole = localStorage.getItem('userRole');
    const adminToken = localStorage.getItem('adminToken');
    const employeeToken = localStorage.getItem('employeeToken');
    
    if (storedRole) return storedRole;
    if (adminToken) return 'admin';
    if (employeeToken) return 'employee';
    return 'employee';
  };

  const userRole = detectUserRole();
  const isAdmin = userRole === 'admin' || userRole === 'manager';

  // Reminder states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // FollowUp states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchMyClientLeads();
    loadFavorites();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [page, filter, selectedEmployeeId]);

  // Filter leads based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLeads(allLeads);
    } else {
      const filtered = allLeads.filter(assignment => {
        const phone = assignment.userId?.phone || '';
        const name = assignment.userId?.fullName || '';
        const email = assignment.userId?.email || '';
        
        // Search by phone number (primary), name, or email
        return phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
               name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               email.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredLeads(filtered);
    }
  }, [searchQuery, allLeads, favoriteLeads, showFavoritesOnly]);

  // Favorite functionality - Using localStorage for now
  const toggleFavorite = (assignmentId) => {
    try {
      const isFavorite = favoriteLeads.has(assignmentId);
      
      // Update favorites set
      const newFavorites = new Set(favoriteLeads);
      if (isFavorite) {
        newFavorites.delete(assignmentId);
      } else {
        newFavorites.add(assignmentId);
      }
      setFavoriteLeads(newFavorites);

      // Save to localStorage
      const favoritesArray = Array.from(newFavorites);
      localStorage.setItem('clientLeadsFavorites', JSON.stringify(favoritesArray));

      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const loadFavorites = () => {
    try {
      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('clientLeadsFavorites');
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites);
        const favoriteIds = new Set(favoritesArray);
        setFavoriteLeads(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Reset to empty favorites on error
      setFavoriteLeads(new Set());
    }
  };

  // Filter leads based on search query and favorites
  useEffect(() => {
    let filtered = allLeads;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(assignment => {
        const phone = assignment.userId?.phone || '';
        const name = assignment.userId?.fullName || '';
        const email = assignment.userId?.email || '';
        
        return phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
               name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               email.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(assignment => favoriteLeads.has(assignment._id));
    }
    
    setFilteredLeads(filtered);
  }, [searchQuery, allLeads, favoriteLeads, showFavoritesOnly]);

  const fetchMyClientLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use role-appropriate token
      let token;
      if (isAdmin) {
        token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      } else {
        token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
      }
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const params = {
        page,
        limit: itemsPerPage,
        ...(filter !== 'all' && { status: filter })
      };

      // If admin selected a specific employee, add employee filter
      if (isAdmin && selectedEmployeeId !== 'all') {
        params.employeeId = selectedEmployeeId;
      }

      // Use different endpoints for admin vs employee
      let endpoint;
      if (isAdmin) {
        endpoint = `${API_BASE_URL}/admin/user-leads/all`; // Admin uses single endpoint with query params
      } else {
        endpoint = `${API_BASE_URL}/employee/user-leads/my-client-leads`; // Employee sees only their leads
      }

      console.log(`ClientLeads - User role: ${userRole}, Using endpoint: ${endpoint}`);
      console.log(`ClientLeads - Selected employee filter: ${selectedEmployeeId}`);

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        console.log('📋 API Response:', response.data);
        const assignments = response.data.data?.assignments;
        
        // Ensure assignments is an array
        if (Array.isArray(assignments)) {
          // Double-check each assignment has proper structure
          const validAssignments = assignments.filter(assignment => 
            assignment && 
            typeof assignment === 'object' && 
            assignment._id && 
            !Array.isArray(assignment) // Make sure it's not an array mistakenly
          );
          console.log('✅ Valid assignments:', validAssignments.length, 'out of', assignments.length);
          setLeads(validAssignments);
          setAllLeads(validAssignments); // Store all leads for search functionality
          setFilteredLeads(validAssignments); // Initialize filtered leads
        } else {
          console.error('❌ Assignments is not an array:', assignments, 'Type:', typeof assignments);
          setLeads([]);
          setAllLeads([]);
          setFilteredLeads([]);
        }
        
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        setTotalLeads(response.data.data.pagination?.total || 0);
      } else {
        setError(response.data.message || 'Failed to fetch client leads');
      }
    } catch (err) {
      console.error("Error fetching client leads:", err);
      setError("Failed to fetch client leads. Please try again later.");
      setLeads([]);
      setAllLeads([]);
      setFilteredLeads([]);
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
      setEmployees([]);
    }
  };

  const updateLeadStatus = async (assignmentId, newStatus) => {
    try {
      const employeeToken = localStorage.getItem('employeeToken');
      if (!employeeToken) {
        toast.error('Employee authentication required');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/employee/user-leads/status/${assignmentId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${employeeToken}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Client lead status updated successfully');
        fetchMyClientLeads(); // Refresh the leads list
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#059669';
      case 'completed': return '#0d9488';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to highlight search matches
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span style={{ backgroundColor: '#fff3cd', fontWeight: 'bold', padding: '1px 3px', borderRadius: '3px' }}>
          {text.substring(index, index + searchTerm.length)}
        </span>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  const handleCreateReminder = (assignment) => {
    setSelectedAssignment(assignment);
    setShowReminderModal(true);
  };

  const handleFollowUp = (assignment) => {
    // Create lead object with proper client information
    const leadData = {
      _id: assignment._id,
      userId: assignment.userId,
      assignmentType: 'UserLeadAssignment',
      // Add client information for FollowUpModal display
      clientName: assignment.userId?.fullName,
      fullName: assignment.userId?.fullName,
      phone: assignment.userId?.phone,
      email: assignment.userId?.email,
      location: [
        assignment.userId?.street,
        assignment.userId?.city,
        assignment.userId?.state,
        assignment.userId?.pinCode
      ].filter(Boolean).join(', ') || assignment.userId?.city || assignment.userId?.state
    };
    setSelectedLead(leadData);
    setShowFollowUpModal(true);
  };



  const handleReminderSubmit = async (reminderData) => {
    try {
      const employeeToken = localStorage.getItem('employeeToken');
      
      // Add client information to reminder data
      const enhancedReminderData = {
        ...reminderData,
        clientName: selectedAssignment?.userId?.fullName || 'Client Lead',
        name: selectedAssignment?.userId?.fullName || 'Client Lead',
        phone: selectedAssignment?.userId?.phone,
        email: selectedAssignment?.userId?.email,
        location: [
          selectedAssignment?.userId?.street,
          selectedAssignment?.userId?.city,
          selectedAssignment?.userId?.state
        ].filter(Boolean).join(', ') || selectedAssignment?.userId?.city
      };
      
      // Convert datetime-local string to timezone-adjusted ISO string
      if (enhancedReminderData.reminderDateTime || enhancedReminderData.reminderTime) {
        const datetimeString = enhancedReminderData.reminderDateTime || enhancedReminderData.reminderTime;
        const localDatetime = new Date(datetimeString);
        
        // Adjust for timezone offset
        const timezoneOffset = localDatetime.getTimezoneOffset();
        const adjustedDate = new Date(localDatetime.getTime() - (timezoneOffset * 60 * 1000));
        const isoString = adjustedDate.toISOString();
        
        console.log('🕐 ClientLeadsPage Reminder Time Conversion:', {
          input: datetimeString,
          localDatetime: localDatetime.toString(),
          timezoneOffset: timezoneOffset,
          adjustedDate: adjustedDate.toString(),
          finalISO: isoString
        });
        
        enhancedReminderData.reminderDateTime = isoString;
        delete enhancedReminderData.reminderTime; // Remove old field if exists
      }
      
      // Ensure proper title
      const clientName = enhancedReminderData.name && enhancedReminderData.name !== 'N/A' 
        ? enhancedReminderData.name 
        : 'Client';
      enhancedReminderData.title = enhancedReminderData.title || `Reminder for ${clientName}`;

      const response = await axios.post(
        `${API_BASE_URL}/employee/reminders/create`,
        enhancedReminderData,
        {
          headers: { Authorization: `Bearer ${employeeToken}` }
        }
      );

      if (response.data.success) {
        toast.success('Reminder created successfully!');
        setShowReminderModal(false);
        setSelectedAssignment(null);
      } else {
        toast.error(response.data.message || 'Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder. Please try again.');
    }
  };

  // Use filtered leads for display
  const displayLeads = Array.isArray(filteredLeads) ? filteredLeads : [];
  
  // Calculate statistics from current displayed leads
  const activeLeads = displayLeads.filter(lead => lead.status === 'active');
  const completedLeads = displayLeads.filter(lead => lead.status === 'completed');
  const cancelledLeads = displayLeads.filter(lead => lead.status === 'cancelled');

  if (loading) {
    return (
      <div className="client-leads-page">
        <ToastContainer />
        <div className="container-fluid">
          <div className="leads-header mb-4">
            <h2 className="mb-0">
              <Users size={24} className="me-2" />
              Client Leads
            </h2>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <RefreshCw size={48} className="text-muted mb-3 spin" />
              <p>Loading your assigned client leads...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-leads-page">
        <ToastContainer />
        <div className="container-fluid">
          <div className="leads-header mb-4">
            <h2 className="mb-0">
              <Users size={24} className="me-2" />
              Client Leads
            </h2>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <AlertCircle size={48} className="text-danger mb-3" />
              <p className="text-danger">{error}</p>
              <button className="btn btn-primary" onClick={fetchMyClientLeads}>
                <RefreshCw size={16} className="me-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-leads-page">
      <ToastContainer />
      <div className="container-fluid">
        <div className="leads-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <Users size={24} className="me-2 text-primary" />
              <div>
                <h2 className="mb-0">
                  Client Leads
                  {isAdmin && selectedEmployeeId !== 'all' && (
                    <span className="text-muted fs-6 ms-2">- {selectedEmployeeName}</span>
                  )}
                </h2>
                <small className="text-muted">
                  {isAdmin 
                    ? (selectedEmployeeId === 'all' 
                        ? 'Manage all team client leads' 
                        : `Viewing client leads assigned to ${selectedEmployeeName}`)
                    : 'Manage your assigned client leads'
                  }
                </small>
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span className="badge bg-primary fs-6">
                Total: {searchQuery ? filteredLeads.length : totalLeads}
              </span>
              <span className="badge bg-success fs-6">
                Active: {activeLeads.length}
              </span>
              <span className="badge bg-info fs-6">
                Completed: {completedLeads.length}
              </span>
              <span className="badge bg-danger fs-6">
                Cancelled: {cancelledLeads.length}
              </span>
              {searchQuery && (
                <span className="badge bg-warning fs-6">
                  Search: "{searchQuery}"
                </span>
              )}
              <button className="btn btn-outline-primary btn-sm" onClick={fetchMyClientLeads}>
                <RefreshCw size={16} className="me-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Employee Filter for Admin */}
        {isAdmin && (
          <div className="employee-filter-section mb-4 p-3 border rounded bg-light">
            <div className="d-flex align-items-center gap-3">
              <span className="fw-semibold">View Client Leads for:</span>
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

        {/* Filter and Search Options */}
        <div className="row mb-4">
          <div className="col-md-4">
            <select 
              className="form-select"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Leads</option>
              <option value="active">Active Leads</option>
              <option value="completed">Completed Leads</option>
              <option value="cancelled">Cancelled Leads</option>
            </select>
          </div>
          <div className="col-md-3">
            <button
              className={`btn ${showFavoritesOnly ? 'btn-warning' : 'btn-outline-warning'} w-100`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title={showFavoritesOnly ? "Show all leads" : "Show only favorite leads"}
            >
              <Star 
                size={16} 
                className="me-2" 
                fill={showFavoritesOnly ? '#fff' : 'none'}
              />
              {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
            </button>
          </div>
          <div className="col-md-5">
            <div className="search-input-container position-relative">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by phone number, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                  e.target.style.boxShadow = '0 0 0 0.2rem rgba(0,123,255,.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9ecef';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <Phone 
                size={16} 
                className="position-absolute text-muted"
                style={{
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              {searchQuery && (
                <button
                  className="btn btn-sm position-absolute"
                  style={{
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    color: '#6c757d',
                    padding: '2px 6px'
                  }}
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <small className="text-muted mt-1 d-block">
                Showing {filteredLeads.length} result{filteredLeads.length !== 1 ? 's' : ''} for "{searchQuery}"
              </small>
            )}
          </div>
        </div>

        {/* Client Leads Table */}
        {displayLeads.length > 0 ? (
          <>
            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th style={{ width: '50px' }}>
                          <Star size={16} className="text-warning" />
                        </th>
                        <th style={{ width: '60px' }}>Avatar</th>
                        <th>Client Name</th>
                        <th>
                          <Phone size={16} className="me-1" />
                          Phone
                        </th>
                        <th>
                          <Mail size={16} className="me-1" />
                          Email
                        </th>
                        <th>
                          <MapPin size={16} className="me-1" />
                          Location
                        </th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>
                          <Calendar size={16} className="me-1" />
                          Assigned Date
                        </th>
                        <th>
                          <Clock size={16} className="me-1" />
                          Last Login
                        </th>
                        <th style={{ width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayLeads.map((assignment) => {
                        // Debug: Check if assignment has proper structure
                        if (!assignment || typeof assignment !== 'object' || Array.isArray(assignment)) {
                          console.error('❌ Invalid assignment object:', assignment);
                          return null;
                        }
                        
                        return (
                          <tr key={assignment._id} className="align-middle">
                            {/* Favorite Star */}
                            <td>
                              <button 
                                className="btn btn-link p-0"
                                onClick={() => toggleFavorite(assignment._id)}
                                title={favoriteLeads.has(assignment._id) ? "Remove from favorites" : "Add to favorites"}
                                style={{ border: 'none' }}
                              >
                                <Star 
                                  size={18} 
                                  fill={favoriteLeads.has(assignment._id) ? '#fbbf24' : 'none'}
                                  color={favoriteLeads.has(assignment._id) ? '#fbbf24' : '#6c757d'}
                                  className="cursor-pointer"
                                />
                              </button>
                            </td>

                            {/* Avatar */}
                            <td>
                              <div className="text-center">
                                {assignment.userId?.avatar ? (
                                  <img 
                                    src={assignment.userId.avatar} 
                                    alt={assignment.userId?.fullName || 'Client'} 
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '2px solid #007bff'
                                    }}
                                    onError={(e) => {
                                      e.target.src = 'https://abc.ridealmobility.com/uploads/default-avatar.jpg';
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                                    style={{ width: '40px', height: '40px', fontSize: '16px' }}
                                  >
                                    {assignment.userId?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Client Name */}
                            <td>
                              <div>
                                <strong>
                                  {searchQuery 
                                    ? highlightMatch(assignment.userId?.fullName || 'N/A', searchQuery)
                                    : assignment.userId?.fullName || 'N/A'
                                  }
                                </strong>
                                <br />
                                <div className="d-flex gap-1 mt-1">
                                  {assignment.userId?.isEmailVerified && (
                                    <span className="badge bg-success" style={{fontSize: '10px'}}>
                                      ✓ Email
                                    </span>
                                  )}
                                  {assignment.userId?.isPhoneVerified && (
                                    <span className="badge bg-success" style={{fontSize: '10px'}}>
                                      ✓ Phone
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Phone */}
                            <td>
                              <span style={{ 
                                fontFamily: 'monospace',
                                fontWeight: searchQuery && assignment.userId?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bold' : 'normal' 
                              }}>
                                {searchQuery 
                                  ? highlightMatch(assignment.userId?.phone || 'N/A', searchQuery)
                                  : assignment.userId?.phone || 'N/A'
                                }
                              </span>
                            </td>

                            {/* Email */}
                            <td>
                              <span className="text-break" style={{ fontSize: '0.9em' }}>
                                {searchQuery 
                                  ? highlightMatch(assignment.userId?.email || 'N/A', searchQuery)
                                  : assignment.userId?.email || 'N/A'
                                }
                              </span>
                            </td>

                            {/* Location */}
                            <td>
                              <span className="text-muted" style={{ fontSize: '0.9em' }}>
                                {[
                                  assignment.userId?.city,
                                  assignment.userId?.state
                                ].filter(Boolean).join(', ') || 'N/A'}
                              </span>
                            </td>

                            {/* Priority */}
                            <td>
                              <span 
                                className="badge"
                                style={{ 
                                  backgroundColor: getPriorityColor(assignment.priority),
                                  color: 'white',
                                  fontSize: '11px'
                                }}
                              >
                                {assignment.priority.toUpperCase()}
                              </span>
                            </td>

                            {/* Status */}
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={assignment.status}
                                onChange={(e) => updateLeadStatus(assignment._id, e.target.value)}
                                style={{ 
                                  borderColor: getStatusColor(assignment.status),
                                  fontSize: '0.85em',
                                  minWidth: '100px'
                                }}
                              >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* Assigned Date */}
                            <td>
                              <small className="text-muted">
                                {formatDate(assignment.assignedDate)}
                              </small>
                            </td>

                            {/* Last Login */}
                            <td>
                              <div>
                                {assignment.userId?.lastLogin ? (
                                  <>
                                    <small className="text-muted">
                                      {formatDate(assignment.userId.lastLogin)}
                                    </small>
                                    <br />
                                    <span className={`badge ${
                                      new Date(assignment.userId.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                        ? 'bg-success' 
                                        : 'bg-warning'
                                    }`} style={{ fontSize: '10px' }}>
                                      {new Date(assignment.userId.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                        ? 'Active' 
                                        : 'Inactive'}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-muted">Never</span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                <button 
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => handleCreateReminder(assignment)}
                                  title="Set Reminder"
                                >
                                  <Bell size={14} />
                                </button>
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleFollowUp(assignment)}
                                  title="Add Follow-up"
                                >
                                  <FileText size={14} />
                                </button>
                                {assignment.userId?.photosAndVideo && 
                                 Array.isArray(assignment.userId.photosAndVideo) && 
                                 assignment.userId.photosAndVideo.length > 0 && (
                                  <span className="badge bg-info" title={`${assignment.userId.photosAndVideo.length} photos`}>
                                    📷 {assignment.userId.photosAndVideo.length}
                                  </span>
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

            {/* Pagination - Hide when searching */}
            {!searchQuery && totalPages > 1 && (
              <div className="pagination-wrapper mt-4">
                <div className="pagination-container">
                  <div className="pagination-info">
                    <span>
                      Page {page} of {totalPages} ({totalLeads} total leads)
                    </span>
                  </div>
                  <div className="pagination-nav">
                    <button
                      className="pagination-btn"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="card-body text-center py-5">
              {searchQuery ? (
                <>
                  <Phone size={64} className="text-muted mb-3" />
                  <h5>No Results Found</h5>
                  <p className="text-muted">
                    No client leads found matching "{searchQuery}".
                    <br />
                    Try searching with a different phone number, name, or email.
                  </p>
                  <button 
                    className="btn btn-outline-primary mt-2"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <Users size={64} className="text-muted mb-3" />
                  <h5>
                    {isAdmin && selectedEmployeeId !== 'all'
                      ? `No Client Leads for ${selectedEmployeeName}`
                      : 'No Client Leads Assigned'
                    }
                  </h5>
                  <p className="text-muted">
                    {isAdmin && selectedEmployeeId !== 'all'
                      ? `${selectedEmployeeName} has no client leads assigned yet.`
                      : isAdmin
                      ? 'No client leads found with the current filters.'
                      : 'You don\'t have any client leads assigned to you yet. Check back later or contact your admin.'
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
                </>
              )}
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        <ReminderModal
          isOpen={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={handleReminderSubmit}
          assignmentId={selectedAssignment?._id}
          assignmentType="UserLeadAssignment"
          leadTitle={
            selectedAssignment?.userId?.fullName 
              ? `Client Lead for ${selectedAssignment.userId.fullName}${
                  selectedAssignment.userId?.phone 
                    ? ` (${selectedAssignment.userId.phone})` 
                    : ''
                }${
                  selectedAssignment.userId?.email 
                    ? ` - ${selectedAssignment.userId.email}` 
                    : ''
                }`
              : 'Client Lead'
          }
        />

        {/* FollowUp Modal */}
        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => {
            setShowFollowUpModal(false);
            setSelectedLead(null);
          }}
          onFollowUpCreated={(newFollowUp) => {
            // Optionally refresh the leads or show success message
            console.log('Follow-up created:', newFollowUp);
          }}
          leadData={selectedLead}
          leadId={selectedLead?._id}
          leadType="UserLeadAssignment"
        />

        {/* Reminder Popup */}
        <ReminderPopup />
      </div>
    </div>
  );
};

export default ClientLeadsPage;