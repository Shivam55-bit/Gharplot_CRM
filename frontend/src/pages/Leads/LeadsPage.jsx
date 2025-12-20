import React, { useState, useEffect } from "react";
import { Target, User, Clock, CheckSquare, AlertCircle, MapPin, Phone, Mail, Calendar, RefreshCw, Bell, MessageSquare } from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import ReminderModal from "../../components/ReminderModal/ReminderModal.jsx";
import ReminderPopup from "../../components/ReminderPopup/ReminderPopup.jsx";
import FollowUpModal from "../../components/FollowUpModal/FollowUpModal.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./LeadsPage.css";

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const itemsPerPage = 10;

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

  // Follow-up states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchMyLeads();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [page, filter, selectedEmployeeId]);

  const fetchMyLeads = async () => {
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
        endpoint = `${API_BASE_URL}/admin/leads/all`; // Admin uses single endpoint with query params
      } else {
        endpoint = `${API_BASE_URL}/employee/leads/my-leads`; // Employee sees only their leads
      }

      console.log(`EnquiryLeads - User role: ${userRole}, Using endpoint: ${endpoint}`);
      console.log(`EnquiryLeads - Selected employee filter: ${selectedEmployeeId}`);

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        setLeads(response.data.data.assignments);
        setTotalPages(response.data.data.totalPages);
        setTotalLeads(response.data.data.totalAssignments);
      } else {
        setError(response.data.message || 'Failed to fetch leads');
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError("Failed to fetch leads. Please try again later.");
      setLeads([]);
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
        `${API_BASE_URL}/employee/leads/status/${assignmentId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${employeeToken}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Lead status updated successfully');
        fetchMyLeads(); // Refresh the leads list
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

  const handleCreateReminder = (assignment) => {
    setSelectedAssignment(assignment);
    setShowReminderModal(true);
  };

  const handleReminderSubmit = async (reminderData) => {
    try {
      // Convert datetime-local string to timezone-adjusted ISO string
      let adjustedReminderData = { ...reminderData };
      
      if (reminderData.reminderDateTime || reminderData.reminderTime) {
        const datetimeString = reminderData.reminderDateTime || reminderData.reminderTime;
        const localDatetime = new Date(datetimeString);
        
        // Adjust for timezone offset
        const timezoneOffset = localDatetime.getTimezoneOffset();
        const adjustedDate = new Date(localDatetime.getTime() - (timezoneOffset * 60 * 1000));
        const isoString = adjustedDate.toISOString();
        
        console.log('🕐 LeadsPage Reminder Time Conversion:', {
          input: datetimeString,
          localDatetime: localDatetime.toString(),
          timezoneOffset: timezoneOffset,
          adjustedDate: adjustedDate.toString(),
          finalISO: isoString
        });
        
        adjustedReminderData.reminderDateTime = isoString;
        delete adjustedReminderData.reminderTime; // Remove old field if exists
      }
      
      // Ensure proper title
      if (adjustedReminderData.name && adjustedReminderData.name !== 'N/A') {
        adjustedReminderData.title = adjustedReminderData.title || `Reminder for ${adjustedReminderData.name}`;
      } else {
        adjustedReminderData.title = adjustedReminderData.title || 'Reminder';
      }
      
      const employeeToken = localStorage.getItem('employeeToken');
      const response = await axios.post(
        `${API_BASE_URL}/employee/reminders/create`,
        adjustedReminderData,
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

  const handleCreateFollowUp = (assignment) => {
    // Prepare lead data for follow-up modal
    const leadData = {
      clientName: assignment.enquiry?.buyerId?.fullName || assignment.enquiry?.clientName || 'N/A',
      phone: assignment.enquiry?.buyerId?.phone || assignment.enquiry?.contactNumber || 'N/A',
      email: assignment.enquiry?.buyerId?.email || 'N/A',
      propertyType: assignment.enquiry?.propertyId?.propertyType || assignment.enquiry?.productType || 'N/A',
      location: assignment.enquiry?.propertyId?.propertyLocation || assignment.enquiry?.location || 'N/A'
    };

    setSelectedLead({
      leadId: assignment._id,
      leadType: 'LeadAssignment',
      leadData: leadData,
      assignment: assignment
    });
    setShowFollowUpModal(true);
  };

  const handleFollowUpCreated = (followUpData) => {
    toast.success('Follow-up created successfully!');
    // Optionally refresh leads or update UI
    fetchMyLeads();
  };

  const activeLeads = leads.filter(lead => lead.status === 'active');
  const completedLeads = leads.filter(lead => lead.status === 'completed');
  const cancelledLeads = leads.filter(lead => lead.status === 'cancelled');

  if (loading) {
    return (
      <div className="leads-page">
        <ToastContainer />
        <div className="container-fluid">
          <div className="leads-header mb-4">
            <h2 className="mb-0">
              <Target size={24} className="me-2" />
              Enquiry Leads
            </h2>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <RefreshCw size={48} className="text-muted mb-3 spin" />
              <p>Loading your assigned leads...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leads-page">
        <ToastContainer />
        <div className="container-fluid">
          <div className="leads-header mb-4">
            <h2 className="mb-0">
              <Target size={24} className="me-2" />
              Enquiry Leads
            </h2>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <AlertCircle size={48} className="text-danger mb-3" />
              <p className="text-danger">{error}</p>
              <button className="btn btn-primary" onClick={fetchMyLeads}>
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
    <div className="leads-page">
      <ToastContainer />
      <div className="container-fluid">
        <div className="leads-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <Target size={24} className="me-2 text-primary" />
              <div>
                <h2 className="mb-0">
                  Enquiry Leads
                  {isAdmin && selectedEmployeeId !== 'all' && (
                    <span className="text-muted fs-6 ms-2">- {selectedEmployeeName}</span>
                  )}
                </h2>
                <small className="text-muted">
                  {isAdmin 
                    ? (selectedEmployeeId === 'all' 
                        ? 'Manage all team enquiry leads' 
                        : `Viewing enquiry leads assigned to ${selectedEmployeeName}`)
                    : 'Manage your assigned enquiry leads'
                  }
                </small>
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span className="badge bg-primary fs-6">
                Total: {totalLeads}
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
              <button className="btn btn-outline-primary btn-sm" onClick={fetchMyLeads}>
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
              <span className="fw-semibold">View Enquiry Leads for:</span>
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

        {/* Filter Options */}
        <div className="row mb-4">
          <div className="col-md-6">
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
        </div>

        {/* Enquiry Leads Table */}
        {leads.length > 0 ? (
          <>
            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
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
                          Property Location
                        </th>
                        <th>Property Type</th>
                        <th>Price</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>
                          <Calendar size={16} className="me-1" />
                          Assigned Date
                        </th>
                        <th>Notes</th>
                        <th style={{ width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((assignment) => (
                        <tr key={assignment._id} className="align-middle">
                          {/* Client Name */}
                          <td>
                            <div>
                              <strong>
                                {assignment.enquiry?.buyerId?.fullName || 
                                 assignment.enquiry?.clientName || 
                                 assignment.enquiry?.fullName ||
                                 'N/A'}
                              </strong>
                              {assignment.enquiry?.buyerId?.isEmailVerified && (
                                <>
                                  <br />
                                  <span className="badge bg-success" style={{fontSize: '10px'}}>
                                    ✓ Email Verified
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Phone */}
                          <td>
                            <span style={{ fontFamily: 'monospace' }}>
                              {assignment.enquiry?.buyerId?.phone || 
                               assignment.enquiry?.contactNumber ||
                               assignment.enquiry?.phone ||
                               'N/A'}
                            </span>
                            {assignment.enquiry?.buyerId?.isPhoneVerified && (
                              <>
                                <br />
                                <span className="badge bg-success" style={{fontSize: '10px'}}>
                                  ✓ Verified
                                </span>
                              </>
                            )}
                          </td>

                          {/* Email */}
                          <td>
                            <span className="text-break" style={{ fontSize: '0.9em' }}>
                              {assignment.enquiry?.buyerId?.email || 
                               assignment.enquiry?.email ||
                               'N/A'}
                            </span>
                          </td>

                          {/* Property Location */}
                          <td>
                            <span className="text-muted" style={{ fontSize: '0.9em' }}>
                              {assignment.enquiry?.propertyId?.propertyLocation || 
                               assignment.enquiry?.location ||
                               assignment.enquiry?.address ||
                               'N/A'}
                            </span>
                          </td>

                          {/* Property Type */}
                          <td>
                            <span className="badge bg-info" style={{ fontSize: '11px' }}>
                              {assignment.enquiry?.propertyId?.propertyType || 
                               assignment.enquiry?.productType ||
                               'N/A'}
                            </span>
                          </td>

                          {/* Price */}
                          <td>
                            <strong className="text-success">
                              {assignment.enquiry?.propertyId?.price 
                                ? `₹${Number(assignment.enquiry.propertyId.price).toLocaleString()}`
                                : assignment.enquiry?.budget
                                ? `₹${Number(assignment.enquiry.budget).toLocaleString()}`
                                : 'N/A'}
                            </strong>
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

                          {/* Notes */}
                          <td>
                            {assignment.note ? (
                              <span 
                                className="text-muted" 
                                style={{ fontSize: '0.85em' }}
                                title={assignment.note}
                              >
                                {assignment.note.length > 30 
                                  ? `${assignment.note.substring(0, 30)}...` 
                                  : assignment.note
                                }
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="d-flex gap-1">
                              <button 
                                className="btn btn-outline-warning btn-sm"
                                onClick={() => handleCreateReminder(assignment)}
                                title="Set Reminder"
                              >
                                <Bell size={14} />
                              </button>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleCreateFollowUp(assignment)}
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

            {/* Pagination */}
            {totalPages > 1 && (
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
              <Target size={64} className="text-muted mb-3" />
              <h5>
                {isAdmin && selectedEmployeeId !== 'all'
                  ? `No Enquiry Leads for ${selectedEmployeeName}`
                  : 'No Leads Assigned'
                }
              </h5>
              <p className="text-muted">
                {isAdmin && selectedEmployeeId !== 'all'
                  ? `${selectedEmployeeName} has no enquiry leads assigned yet.`
                  : isAdmin
                  ? 'No enquiry leads found with the current filters.'
                  : 'You don\'t have any leads assigned to you yet. Check back later or contact your admin.'
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
          assignmentType="LeadAssignment"
          leadTitle={
            selectedAssignment?.enquiry?.propertyId?.title || 
            selectedAssignment?.enquiry?.title ||
            `Lead for ${selectedAssignment?.enquiry?.buyerId?.fullName || selectedAssignment?.enquiry?.clientName || 'Client'}`
          }
        />

        {/* Follow-up Modal */}
        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => {
            setShowFollowUpModal(false);
            setSelectedLead(null);
          }}
          leadData={selectedLead?.leadData}
          leadType={selectedLead?.leadType}
          leadId={selectedLead?.leadId}
          onFollowUpCreated={handleFollowUpCreated}
        />

        {/* Reminder Popup */}
        <ReminderPopup />
      </div>
    </div>
  );
};

export default LeadsPage;