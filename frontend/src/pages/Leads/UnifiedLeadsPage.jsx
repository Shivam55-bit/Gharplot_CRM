import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Bell, 
  MessageSquare, 
  Star, 
  StarOff, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronDown,
  Building,
  Home,
  Users,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UnifiedLeadsPage.css';

const UnifiedLeadsPage = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, enquiry, client
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed, cancelled
  const [filterPriority, setFilterPriority] = useState('all'); // all, low, medium, high
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from localStorage on initialization
    const savedFavorites = localStorage.getItem('leadFavorites');
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set();
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Ref for rich text editor
  const editorRef = useRef(null);

  // Modal states for reminder and follow-up
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [reminderData, setReminderData] = useState({
    reminderTime: '',
    note: ''
  });
  const [followUpData, setFollowUpData] = useState({
    followUpDate: '',
    notes: '',
    priority: 'medium'
  });

  // Check if user is admin
  const isAdmin = localStorage.getItem('adminToken') && localStorage.getItem('adminData');

  // API Configuration
  const API_BASE = 'https://abc.bhoomitechzone.us';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('adminToken') || 
                  localStorage.getItem('employeeToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch all leads from both sources
  const fetchAllLeads = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Use different endpoints for admin vs employee
      const enquiryEndpoint = isAdmin 
        ? `${API_BASE}/admin/leads/all`
        : `${API_BASE}/employee/leads/my-leads`;
      
      const clientEndpoint = isAdmin 
        ? `${API_BASE}/admin/user-leads/all`
        : `${API_BASE}/employee/user-leads/my-client-leads`;
      
      // Fetch enquiry leads and client leads in parallel
      const [enquiryResponse, clientResponse] = await Promise.all([
        axios.get(enquiryEndpoint, { headers }),
        axios.get(clientEndpoint, { headers })
      ]);

      const enquiryLeads = enquiryResponse.data.success ? enquiryResponse.data.data?.assignments || [] : [];
      const clientLeads = clientResponse.data.success ? clientResponse.data.data?.assignments || [] : [];

      // Transform and combine the data
      const transformedEnquiryLeads = enquiryLeads.map(lead => ({
          ...lead,
          leadType: 'enquiry',
          leadTypeLabel: 'Enquiry Lead',
          employeeName: lead.employeeId?.name || 'N/A',
          employeeEmail: lead.employeeId?.email || 'N/A',
          employeePhone: lead.employeeId?.phone || 'N/A',
          // Try multiple possible paths for client information
          clientName: lead.enquiry?.buyerId?.fullName || 
                     lead.enquiry?.clientName || 
                     lead.enquiry?.fullName ||
                     lead.enquiry?.name ||
                     lead.enquiry?.buyerName || 'N/A',
          clientPhone: lead.enquiry?.buyerId?.phone || 
                      lead.enquiry?.contactNumber || 
                      lead.enquiry?.phone ||
                      lead.enquiry?.phoneNumber ||
                      lead.enquiry?.mobile || 'N/A',
          clientEmail: lead.enquiry?.buyerId?.email || 
                      lead.enquiry?.email ||
                      lead.enquiry?.emailAddress || 'N/A',
          location: lead.enquiry?.propertyId?.propertyLocation || 
                   lead.enquiry?.propertyId?.address ||
                   lead.enquiry?.location || 
                   lead.enquiry?.address ||
                   lead.enquiry?.propertyLocation || 'N/A',
          propertyType: lead.enquiry?.propertyId?.propertyType ||
                       lead.enquiry?.propertyType ||
                       'Enquiry Lead',
          price: lead.enquiry?.propertyId?.price || 
                 lead.enquiry?.budget || 
                 lead.enquiry?.budgetRange || null,
          isEmailVerified: lead.enquiry?.buyerId?.isEmailVerified || false,
          isPhoneVerified: lead.enquiry?.buyerId?.isPhoneVerified || false,
          createdAt: lead.assignedDate || lead.createdAt,
          lastLogin: lead.enquiry?.buyerId?.lastLogin || null
      }));



      const transformedClientLeads = clientLeads.map(lead => ({
        ...lead,
        leadType: 'client',
        leadTypeLabel: 'Client Lead',
        employeeName: lead.employeeId?.name || 'N/A',
        employeeEmail: lead.employeeId?.email || 'N/A',
        employeePhone: lead.employeeId?.phone || 'N/A',
        clientName: lead.userId?.fullName || 
                   lead.clientName || 
                   lead.fullName || 'N/A',
        clientPhone: lead.userId?.phone || 
                    lead.phone || 'N/A',
        clientEmail: lead.userId?.email || 
                    lead.email || 'N/A',
        location: `${lead.userId?.street || ''} ${lead.userId?.city || ''} ${lead.userId?.state || ''}`.trim() || 
                 lead.location || 
                 lead.address || 'N/A',
        propertyType: 'User Lead',
        price: null,
        isEmailVerified: lead.userId?.isEmailVerified || false,
        isPhoneVerified: lead.userId?.isPhoneVerified || false,
        createdAt: lead.assignedDate || lead.createdAt,
        lastLogin: lead.userId?.lastLogin || null
      }));

      // Combine and sort by creation time (most recent first)
      const combinedLeads = [...transformedEnquiryLeads, ...transformedClientLeads];
      combinedLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllLeads(combinedLeads);
      setFilteredLeads(combinedLeads);
      
      // Extract unique employees for admin filtering (admin only)
      if (isAdmin) {
        const uniqueEmployees = [];
        const employeeIds = new Set();
        
        combinedLeads.forEach(lead => {
          if (lead.employeeId && !employeeIds.has(lead.employeeId._id)) {
            employeeIds.add(lead.employeeId._id);
            uniqueEmployees.push({
              id: lead.employeeId._id,
              name: lead.employeeName,
              email: lead.employeeEmail
            });
          }
        });
        
        setEmployees(uniqueEmployees);
      }
      
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allLeads];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.clientName.toLowerCase().includes(searchLower) ||
        lead.clientPhone.toLowerCase().includes(searchLower) ||
        lead.clientEmail.toLowerCase().includes(searchLower) ||
        lead.location.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(lead => lead.leadType === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(lead => lead.priority === filterPriority);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(lead => favorites.has(lead._id));
    }

    // Employee filter (admin only)
    if (selectedEmployee && isAdmin) {
      filtered = filtered.filter(lead => lead.employeeId?._id === selectedEmployee);
    }

    setFilteredLeads(filtered);
  }, [allLeads, searchTerm, filterType, filterStatus, filterPriority, showFavoritesOnly, favorites, selectedEmployee]);

  // Handle table scroll detection
  useEffect(() => {
    const checkTableScroll = () => {
      const tableContainer = document.querySelector('.table-container');
      const tableResponsive = document.querySelector('.table-responsive');
      
      if (tableContainer && tableResponsive) {
        const hasHorizontalScroll = tableResponsive.scrollWidth > tableResponsive.clientWidth;
        
        if (hasHorizontalScroll) {
          tableContainer.classList.add('has-scroll');
        } else {
          tableContainer.classList.remove('has-scroll');
        }
      }
    };

    // Check on mount and when data changes
    checkTableScroll();
    
    // Check on window resize
    const handleResize = () => checkTableScroll();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [filteredLeads]);

  // Toggle favorite
  const toggleFavorite = async (leadId) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(leadId)) {
      newFavorites.delete(leadId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(leadId);
      toast.success('Added to favorites');
    }
    
    // Update state
    setFavorites(newFavorites);
    
    // Save to localStorage for persistence
    localStorage.setItem('leadFavorites', JSON.stringify([...newFavorites]));
  };

  // Update lead status
  const updateLeadStatus = async (leadId, newStatus, leadType) => {
    try {
      const endpoint = leadType === 'enquiry' ? 
        `/employee/leads/status/${leadId}` : 
        `/employee/user-leads/status/${leadId}`;
        
      await axios.put(`${API_BASE}${endpoint}`, 
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      
      // Update local state
      setAllLeads(prev => prev.map(lead => 
        lead._id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle reminder creation
  const handleCreateReminder = (lead) => {
    setSelectedLead(lead);
    setReminderData({
      reminderTime: '',
      note: ''
    });
    setShowReminderModal(true);
  };

  // Handle follow-up creation
  const handleCreateFollowUp = (lead) => {
    setSelectedLead(lead);
    setFollowUpData({
      followUpDate: '',
      notes: '',
      priority: 'medium'
    });
    setShowFollowUpModal(true);
  };

  // Submit reminder
  const handleSubmitReminder = async () => {
    if (!reminderData.reminderTime) {
      toast.error('Please select a reminder time');
      return;
    }

    // Get content directly from editor
    let noteContent = '';
    if (editorRef.current) {
      const editorHTML = editorRef.current.innerHTML;
      const editorText = editorRef.current.textContent?.trim();
      
      // Check if it's just placeholder text
      if (editorText && editorText !== 'Type your reminder note here...') {
        noteContent = editorHTML;
      }
    }

    console.log('🔍 Editor Content:', {
      innerHTML: editorRef.current?.innerHTML,
      textContent: editorRef.current?.textContent,
      finalNote: noteContent
    });

    // Convert datetime-local string to proper timezone-adjusted ISO string
    // datetime-local gives us: "2025-11-26T13:33" (no timezone info)
    const localDatetime = new Date(reminderData.reminderTime);
    
    // Adjust for timezone offset to ensure correct time storage
    const timezoneOffset = localDatetime.getTimezoneOffset();
    const adjustedDate = new Date(localDatetime.getTime() - (timezoneOffset * 60 * 1000));
    const isoString = adjustedDate.toISOString();
    
    console.log('🕐 Reminder Time Conversion:', {
      inputValue: reminderData.reminderTime,
      localDatetime: localDatetime.toString(),
      timezoneOffset: timezoneOffset,
      adjustedDate: adjustedDate.toString(),
      finalISO: isoString,
      willRingAt: localDatetime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('employeeToken');
      console.log('Creating reminder with data:', {
        name: selectedLead.clientName,
        email: selectedLead.clientEmail,
        phone: selectedLead.clientPhone,
        location: selectedLead.location,
        reminderTime: isoString, // Use timezone-adjusted ISO string
        note: noteContent,
        hasToken: !!token
      });
      
      const response = await axios.post(
        `${API_BASE}/employee/reminders/create-from-lead`,
        {
          name: selectedLead.clientName,
          email: selectedLead.clientEmail,
          phone: selectedLead.clientPhone,
          location: selectedLead.location,
          reminderTime: isoString, // Use timezone-adjusted ISO string
          note: noteContent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Reminder created successfully!');
        setShowReminderModal(false);
        setSelectedLead(null);
      } else {
        toast.error('Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      
      // More detailed error messages
      if (error.response) {
        const errorMsg = error.response.data?.message || 'Failed to create reminder';
        console.error('Server error:', error.response.data);
        toast.error(errorMsg);
      } else if (error.request) {
        console.error('Network error:', error.request);
        toast.error('Network error. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        toast.error('Failed to create reminder');
      }
    }
  };

  // Submit follow-up
  const handleSubmitFollowUp = async () => {
    if (!followUpData.followUpDate) {
      toast.error('Please select a follow-up date');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('employeeToken');
      console.log('Creating follow-up with data:', {
        leadType: selectedLead.leadType,
        leadId: selectedLead._id,
        clientName: selectedLead.clientName,
        clientEmail: selectedLead.clientEmail,
        clientPhone: selectedLead.clientPhone,
        followUpDate: followUpData.followUpDate,
        notes: followUpData.notes,
        priority: followUpData.priority,
        hasToken: !!token
      });
      
      const response = await axios.post(
        `${API_BASE}/employee/follow-ups/create-from-lead`,
        {
          leadType: selectedLead.leadType,
          leadId: selectedLead._id,
          clientName: selectedLead.clientName,
          clientEmail: selectedLead.clientEmail,
          clientPhone: selectedLead.clientPhone,
          followUpDate: followUpData.followUpDate,
          notes: followUpData.notes,
          priority: followUpData.priority
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Follow-up scheduled successfully!');
        setShowFollowUpModal(false);
        setSelectedLead(null);
      } else {
        toast.error('Failed to schedule follow-up');
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      
      // More detailed error messages
      if (error.response) {
        const errorMsg = error.response.data?.message || 'Failed to schedule follow-up';
        console.error('Server error:', error.response.data);
        toast.error(errorMsg);
      } else if (error.request) {
        console.error('Network error:', error.request);
        toast.error('Network error. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        toast.error('Failed to schedule follow-up');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Highlight search terms
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="search-highlight">{part}</span> : 
        part
    );
  };

  useEffect(() => {
    fetchAllLeads();
  }, []);

  // Set editor content when modal opens
  useEffect(() => {
    if (showReminderModal && editorRef.current) {
      if (reminderData.note) {
        editorRef.current.innerHTML = reminderData.note;
      } else {
        editorRef.current.innerHTML = '<span style="color: #6c757d; font-style: italic;">Type your reminder note here...</span>';
      }
    }
  }, [showReminderModal]);



  return (
    <div className="unified-leads-page">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Users className="header-icon" />
            <div>
              <h1>All Leads</h1>
              <p>Unified view of all enquiry and client leads</p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{allLeads.length}</span>
              <span className="stat-label">Total Leads</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {allLeads.filter(lead => lead.leadType === 'enquiry').length}
              </span>
              <span className="stat-label">Enquiry Leads</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {allLeads.filter(lead => lead.leadType === 'client').length}
              </span>
              <span className="stat-label">Client Leads</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-and-refresh">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className={`btn-favorites ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title={showFavoritesOnly ? 'Show all leads' : 'Show favorite leads only'}
          >
            <Star className={showFavoritesOnly ? 'filled' : ''} size={18} />
            {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
          </button>
          
          <button 
            className="btn-refresh"
            onClick={fetchAllLeads}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spin' : ''} size={18} />
            Refresh
          </button>
        </div>

        <div className="filter-controls">
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </button>

          {showFilters && (
            <div className="filters-dropdown">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Lead Types</option>
                <option value="enquiry">Enquiry Leads</option>
                <option value="client">Client Leads</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {/* Employee Filter (Admin Only) */}
              {isAdmin && (
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value || null)}
                >
                  <option value="">All Employees</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unified Leads Table */}
      <div className="leads-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p>Loading leads...</p>
          </div>
        ) : filteredLeads.length > 0 ? (
          <div className="leads-display">
            {/* Desktop Table Layout */}
            <div className="card desktop-table-wrapper">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th style={{ width: '50px' }}>
                        <Star size={16} />
                      </th>
                      <th>Lead Type</th>
                      {isAdmin && (
                        <th>
                          <Users size={16} className="me-1" />
                          Employee
                        </th>
                      )}
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
                      <th>Property Type</th>
                      <th>Price</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>
                        <Clock size={16} className="me-1" />
                        Created
                      </th>
                      <th>Last Login</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={`${lead.leadType}-${lead._id}`} className="align-middle">
                        {/* Favorite */}
                        <td>
                          <button
                            className="btn-favorite"
                            onClick={() => toggleFavorite(lead._id)}
                          >
                            {favorites.has(lead._id) ? 
                              <Star size={16} className="text-warning" fill="currentColor" /> : 
                              <StarOff size={16} className="text-muted" />
                            }
                          </button>
                        </td>

                        {/* Lead Type */}
                        <td>
                          <span className={`badge ${lead.leadType === 'enquiry' ? 'bg-info' : 'bg-success'}`} 
                                style={{ fontSize: '11px' }}>
                            {lead.leadType === 'enquiry' ? (
                              <>
                                <Building size={12} className="me-1" />
                                Enquiry Lead
                              </>
                            ) : (
                              <>
                                <User size={12} className="me-1" />
                                Client Lead
                              </>
                            )}
                          </span>
                        </td>

                        {/* Employee (Admin only) */}
                        {isAdmin && (
                          <td>
                            <div 
                              className="employee-info clickable"
                              onClick={() => setSelectedEmployee(selectedEmployee === lead.employeeId?._id ? null : lead.employeeId?._id)}
                              title={`Click to ${selectedEmployee === lead.employeeId?._id ? 'show all leads' : 'filter by this employee'}`}
                            >
                              <div className="fw-semibold text-primary" style={{ cursor: 'pointer' }}>
                                {lead.employeeName}
                              </div>
                              <small className="text-muted">{lead.employeeEmail}</small>
                            </div>
                          </td>
                        )}

                        {/* Client Name */}
                        <td>
                          <div>
                            <strong>
                              {highlightSearchTerm(lead.clientName, searchTerm)}
                            </strong>
                            {(lead.isEmailVerified || lead.isPhoneVerified) && (
                              <>
                                <br />
                                {lead.isEmailVerified && (
                                  <span className="badge bg-success me-1" style={{fontSize: '10px'}}>
                                    ✓ Email
                                  </span>
                                )}
                                {lead.isPhoneVerified && (
                                  <span className="badge bg-success" style={{fontSize: '10px'}}>
                                    ✓ Phone
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Phone */}
                        <td>
                          <span style={{ fontFamily: 'monospace' }}>
                            {highlightSearchTerm(lead.clientPhone, searchTerm)}
                          </span>
                        </td>

                        {/* Email */}
                        <td>
                          <span className="text-break" style={{ fontSize: '0.9em' }}>
                            {highlightSearchTerm(lead.clientEmail, searchTerm)}
                          </span>
                        </td>

                        {/* Location */}
                        <td>
                          <span className="text-muted" style={{ fontSize: '0.9em' }}>
                            {highlightSearchTerm(lead.location, searchTerm)}
                          </span>
                        </td>

                        {/* Property Type */}
                        <td>
                          <span className="badge bg-secondary" style={{ fontSize: '11px' }}>
                            {lead.propertyType}
                          </span>
                        </td>

                        {/* Price */}
                        <td>
                          {lead.price ? (
                            <strong className="text-success">
                              ₹{Number(lead.price).toLocaleString()}
                            </strong>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* Priority */}
                        <td>
                          <span 
                            className="badge"
                            style={{ 
                              backgroundColor: getPriorityColor(lead.priority) + '20',
                              color: getPriorityColor(lead.priority),
                              fontSize: '11px'
                            }}
                          >
                            {lead.priority?.toUpperCase() || 'MEDIUM'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={lead.status || 'active'}
                            onChange={(e) => updateLeadStatus(lead._id, e.target.value, lead.leadType)}
                            style={{ 
                              borderColor: getStatusColor(lead.status),
                              fontSize: '0.85em',
                              minWidth: '100px'
                            }}
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Created */}
                        <td>
                          <div>
                            <small className="text-muted">
                              {formatDate(lead.createdAt)}
                            </small>
                            <br />
                            <small className="text-info">
                              {formatTimeAgo(lead.createdAt)}
                            </small>
                          </div>
                        </td>

                        {/* Last Login */}
                        <td>
                          <small className="text-muted">
                            {lead.lastLogin ? formatTimeAgo(lead.lastLogin) : 'Never'}
                          </small>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-outline-warning btn-sm"
                              onClick={() => handleCreateReminder(lead)}
                              title="Set Reminder"
                            >
                              <Bell size={14} />
                            </button>
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleCreateFollowUp(lead)}
                              title="Add Follow-up"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="mobile-leads-container">
            {filteredLeads.map((lead) => (
              <div key={`mobile-${lead.leadType}-${lead._id}`} className="mobile-lead-card">
                {/* Mobile Card Header */}
                <div className="mobile-lead-header">
                  <div className="mobile-lead-type">
                    <span className={`badge ${lead.leadType === 'enquiry' ? 'bg-info' : 'bg-success'}`} 
                          style={{ fontSize: '11px' }}>
                      {lead.leadType === 'enquiry' ? (
                        <>
                          <Building size={10} className="me-1" />
                          Enquiry Lead
                        </>
                      ) : (
                        <>
                          <User size={10} className="me-1" />
                          Client Lead
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mobile-lead-actions">
                    <button
                      className="btn-favorite"
                      onClick={() => toggleFavorite(lead._id)}
                    >
                      {favorites.has(lead._id) ? 
                        <Star size={16} className="text-warning" fill="currentColor" /> : 
                        <StarOff size={16} className="text-muted" />
                      }
                    </button>
                    <button
                      className="btn btn-outline-warning btn-sm ms-1"
                      onClick={() => handleCreateReminder(lead)}
                      title="Set Reminder"
                    >
                      <Bell size={14} />
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm ms-1"
                      onClick={() => handleCreateFollowUp(lead)}
                      title="Add Follow-up"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>

                {/* Mobile Card Body */}
                <div className="mobile-lead-body">
                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">
                      <User size={14} className="me-1" />
                      Client
                    </div>
                    <div className="mobile-lead-value">
                      <div className="fw-semibold">{lead.clientName}</div>
                      <small className="text-muted d-block">{lead.clientPhone}</small>
                    </div>
                  </div>

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">
                      <Mail size={14} className="me-1" />
                      Email
                    </div>
                    <div className="mobile-lead-value">{lead.clientEmail}</div>
                  </div>

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">
                      <MapPin size={14} className="me-1" />
                      Location
                    </div>
                    <div className="mobile-lead-value">{lead.location}</div>
                  </div>

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">Property</div>
                    <div className="mobile-lead-value">
                      {lead.propertyType}
                      {lead.price && <div className="fw-semibold text-success">₹{lead.price?.toLocaleString()}</div>}
                    </div>
                  </div>

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">Priority</div>
                    <div className="mobile-lead-value">
                      <span className="badge" style={{
                        backgroundColor: getPriorityColor(lead.priority),
                        color: 'white',
                        fontSize: '10px'
                      }}>
                        {lead.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Employee Info (Admin Only) */}
                  {isAdmin && (
                    <div className="mobile-lead-row">
                      <div className="mobile-lead-label">
                        <Users size={14} className="me-1" />
                        Employee
                      </div>
                      <div className="mobile-lead-value">
                        <div 
                          className="mobile-employee-info"
                          onClick={() => setSelectedEmployee(selectedEmployee === lead.employeeId?._id ? null : lead.employeeId?._id)}
                        >
                          <div className="mobile-employee-name">{lead.employeeName}</div>
                          <div className="mobile-employee-email">{lead.employeeEmail}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">Status</div>
                    <div className="mobile-lead-value">
                      <select
                        className="mobile-status-select"
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead._id, e.target.value, lead.leadType)}
                        style={{ borderColor: getStatusColor(lead.status) }}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">
                      <Clock size={14} className="me-1" />
                      Created
                    </div>
                    <div className="mobile-lead-value">
                      <div>{formatDate(lead.createdAt)}</div>
                      <small className="text-muted">{formatTimeAgo(lead.createdAt)}</small>
                    </div>
                  </div>

                  <div className="mobile-lead-row">
                    <div className="mobile-lead-label">Last Login</div>
                    <div className="mobile-lead-value">
                      {lead.lastLogin ? formatTimeAgo(lead.lastLogin) : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={64} />
            <h3>No leads found</h3>
            <p>
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || showFavoritesOnly || selectedEmployee
                ? 'No leads match your current filters. Try adjusting your search criteria.'
                : 'No leads have been assigned to you yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <Bell size={20} className="me-2" />
                  Create Reminder
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowReminderModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Client:</strong> {selectedLead?.clientName}<br />
                  <strong>Phone:</strong> {selectedLead?.clientPhone}<br />
                  <strong>Email:</strong> {selectedLead?.clientEmail}
                </div>
                <div className="mb-3">
                  <label className="form-label">Reminder Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={reminderData.reminderTime}
                    onChange={(e) => setReminderData({...reminderData, reminderTime: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Note</label>
                </div>
                <div className="mb-3">
                  <label className="form-label">Note</label>
                  <div className="alert alert-info" style={{ fontSize: '13px', padding: '8px 12px', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', marginBottom: '8px' }}>
                    <strong>🎨 How to use colors:</strong>
                    <br />
                    1. Type your text in the box below
                    <br />
                    2. Select/highlight the text you want to format
                    <br />
                    3. Click the buttons above to apply formatting and colors
                  </div>
                  
                  {/* Rich Text Toolbar - Now visible */}                  {/* Rich Text Toolbar - Now visible */}
                  <div className="rich-text-toolbar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '10px 15px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ced4da',
                    borderBottom: 'none',
                    borderRadius: '0.375rem 0.375rem 0 0',
                    marginBottom: '0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        const editor = document.querySelector('.reminder-rich-text-editor');
                        if (editor) {
                          editor.focus();
                          document.execCommand('bold', false, null);
                          const content = editor.innerHTML;
                          setReminderData({...reminderData, note: content});
                        }
                      }} 
                      className="toolbar-btn"
                      style={{
                        background: '#fff',
                        border: '2px solid #007bff',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '40px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#007bff'
                      }}
                    >
                      <strong>B</strong>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const editor = document.querySelector('.reminder-rich-text-editor');
                        if (editor) {
                          editor.focus();
                          document.execCommand('italic', false, null);
                          const content = editor.innerHTML;
                          setReminderData({...reminderData, note: content});
                        }
                      }} 
                      className="toolbar-btn"
                      style={{
                        background: '#fff',
                        border: '2px solid #007bff',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '40px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#007bff'
                      }}
                    >
                      <em>I</em>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const editor = document.querySelector('.reminder-rich-text-editor');
                        if (editor) {
                          editor.focus();
                          document.execCommand('underline', false, null);
                          const content = editor.innerHTML;
                          setReminderData({...reminderData, note: content});
                        }
                      }} 
                      className="toolbar-btn"
                      style={{
                        background: '#fff',
                        border: '2px solid #007bff',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '40px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#007bff'
                      }}
                    >
                      <u>U</u>
                    </button>
                    
                    {/* Text Color Picker */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <label style={{
                        fontSize: '11px',
                        margin: '0',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        color: '#495057'
                      }}>Text Color:</label>
                      <input
                        type="color"
                        defaultValue="#000000"
                        onChange={(e) => {
                          const editor = document.querySelector('.reminder-rich-text-editor');
                          if (editor) {
                            editor.focus();
                            document.execCommand('foreColor', false, e.target.value);
                            const content = editor.innerHTML;
                            setReminderData({...reminderData, note: content});
                          }
                        }}
                        style={{
                          width: '50px',
                          height: '40px',
                          border: '3px solid #007bff',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
                        }}
                        title="Click to change text color"
                      />
                    </div>
                    
                    {/* Highlight Color Picker */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <label style={{
                        fontSize: '11px',
                        margin: '0',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        color: '#495057'
                      }}>Highlight:</label>
                      <input
                        type="color"
                        defaultValue="#ffff00"
                        onChange={(e) => {
                          const editor = document.querySelector('.reminder-rich-text-editor');
                          if (editor) {
                            editor.focus();
                            document.execCommand('backColor', false, e.target.value);
                            const content = editor.innerHTML;
                            setReminderData({...reminderData, note: content});
                          }
                        }}
                        style={{
                          width: '50px',
                          height: '40px',
                          border: '3px solid #007bff',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
                        }}
                        title="Click to highlight text background"
                      />
                    </div>
                  </div>

                  {/* Rich Text Editor - ContentEditable with LTR fix */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="reminder-rich-text-editor"
                    dir="ltr"
                    spellCheck="false"
                    onInput={(e) => {
                      const content = e.currentTarget.innerHTML;
                      setReminderData({...reminderData, note: content});
                    }}
                    onFocus={(e) => {
                      // Clear placeholder text on focus
                      if (e.currentTarget.textContent === 'Type your reminder note here...') {
                        e.currentTarget.innerHTML = '';
                      }
                    }}
                    onBlur={(e) => {
                      // Restore placeholder if empty
                      if (!e.currentTarget.textContent.trim()) {
                        e.currentTarget.innerHTML = '<span style="color: #6c757d; font-style: italic;">Type your reminder note here...</span>';
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text/plain');
                      document.execCommand('insertText', false, text);
                    }}
                    onKeyDown={(e) => {
                      // Prevent any RTL shortcuts
                      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
                        e.preventDefault();
                      }
                    }}
                    style={{ 
                      minHeight: '100px', 
                      padding: '10px', 
                      border: '1px solid #ced4da', 
                      borderRadius: '0 0 0.375rem 0.375rem',
                      borderTop: 'none',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      backgroundColor: 'white',
                      outline: 'none',
                      direction: 'ltr',
                      textAlign: 'left'
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowReminderModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={handleSubmitReminder}
                >
                  <Bell size={16} className="me-1" />
                  Create Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <MessageSquare size={20} className="me-2" />
                  Schedule Follow-up
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFollowUpModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Client:</strong> {selectedLead?.clientName}<br />
                  <strong>Phone:</strong> {selectedLead?.clientPhone}<br />
                  <strong>Email:</strong> {selectedLead?.clientEmail}
                </div>
                <div className="mb-3">
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={followUpData.followUpDate}
                    onChange={(e) => setFollowUpData({...followUpData, followUpDate: e.target.value})}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={followUpData.priority}
                    onChange={(e) => setFollowUpData({...followUpData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add notes about this follow-up..."
                    value={followUpData.notes}
                    onChange={(e) => setFollowUpData({...followUpData, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowFollowUpModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSubmitFollowUp}
                >
                  <MessageSquare size={16} className="me-1" />
                  Schedule Follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedLeadsPage;