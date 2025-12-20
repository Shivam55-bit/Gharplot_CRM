import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import "./UserLeadAssignmentsPage.css";

function UserLeadAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    priority: ''
  });
  const [employees, setEmployees] = useState([]);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState(new Set());
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const limit = 10;

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...filters
      });

      const response = await axios.get(
        `${API_BASE_URL}/admin/user-leads/all?${params}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      if (response.data.success) {
        setAssignments(response.data.data.assignments);
        setTotalPages(response.data.data.pagination.totalPages);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for filter
  const fetchEmployees = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_BASE_URL}/admin/user-leads/available-employees`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
  }, [currentPage, filters]);

  // Handle assignment selection
  const handleAssignmentSelection = (assignmentId) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAssignments.size === assignments.length) {
      setSelectedAssignments(new Set());
    } else {
      setSelectedAssignments(new Set(assignments.map(a => a._id)));
    }
  };

  // Handle unassign
  const handleUnassign = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const assignmentIds = Array.from(selectedAssignments);

      const response = await axios.post(
        `${API_BASE_URL}/admin/user-leads/unassign`,
        { assignmentIds },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      if (response.data.success) {
        setModalMessage(`Successfully unassigned ${response.data.data.deletedCount} user(s)`);
        setShowSuccessModal(true);
        setSelectedAssignments(new Set());
        setShowUnassignModal(false);
        fetchAssignments();
      }
    } catch (error) {
      console.error('Error unassigning:', error);
      setModalMessage('Failed to unassign users');
      setShowErrorModal(true);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      status: '',
      priority: ''
    });
    setCurrentPage(1);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning text-dark';
      case 'medium': return 'bg-info';
      case 'low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'completed': return 'bg-primary';
      case 'cancelled': return 'bg-danger';
      case 'on-hold': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="user-lead-assignments-container mt-5">
      <div className="header-section mb-4">
        <h2 className="title">👥 User Lead Assignments</h2>
        <p className="text-muted">Manage user assignments to employees</p>
      </div>

      {/* Filters */}
      <div className="filters-section mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Employee</label>
            <select
              className="form-select"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.role?.name})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {selectedAssignments.size > 0 && (
        <div className="selection-controls mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <span className="badge bg-primary">
              {selectedAssignments.size} selected
            </span>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowUnassignModal(true)}
            >
              Unassign Selected ({selectedAssignments.size})
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="table-responsive">
            <table className="table table-hover assignments-table">
              <thead>
                <tr>
                  <th style={{ width: "3%" }}>
                    <input
                      type="checkbox"
                      checked={selectedAssignments.size === assignments.length && assignments.length > 0}
                      onChange={handleSelectAll}
                      className="form-check-input"
                    />
                  </th>
                  <th style={{ width: "20%", color:'#fff' }}>User Details</th>
                  <th style={{ width: "15%", color:'#fff' }}>Contact</th>
                  <th style={{ width: "15%", color:'#fff' }}>Location</th>
                  <th style={{ width: "15%",color:'#fff' }}>Assigned To</th>
                  <th style={{ width: "8%", color:'#fff' }}>Priority</th>
                  <th style={{ width: "8%",color:'#fff' }}>Status</th>
                  <th style={{ width: "12%",color:'#fff' }}>Assigned Date</th>
                  <th style={{ width: "4%",color:'#fff' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedAssignments.has(assignment._id)}
                          onChange={() => handleAssignmentSelection(assignment._id)}
                          className="form-check-input"
                        />
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold">
                            {assignment.userId?.fullName || 'Unknown User'}
                          </span>
                          <small className="text-muted">
                            {assignment.userId?.email}
                          </small>
                          {assignment.notes && (
                            <small className="text-muted fst-italic mt-1">
                              📝 {assignment.notes}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <small className="text-muted">
                            📞 {assignment.userId?.phone || 'N/A'}
                          </small>
                          {assignment.userId?.isEmailVerified && (
                            <small className="text-success">✓ Email verified</small>
                          )}
                          {assignment.userId?.isPhoneVerified && (
                            <small className="text-success">✓ Phone verified</small>
                          )}
                        </div>
                      </td>
                      <td>
                        {(assignment.userId?.city || assignment.userId?.state) ? (
                          <div className="d-flex flex-column">
                            <small>
                              📍 {[assignment.userId?.city, assignment.userId?.state].filter(Boolean).join(', ')}
                            </small>
                            {assignment.userId?.pinCode && (
                              <small className="text-muted">PIN: {assignment.userId?.pinCode}</small>
                            )}
                          </div>
                        ) : (
                          <small className="text-muted">N/A</small>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-success">
                            ✓ {assignment.employeeId?.name || 'Unknown'}
                          </span>
                          <small className="text-muted">
                            {assignment.employeeId?.email}
                          </small>
                          <small className="text-muted">
                            📞 {assignment.employeeId?.phone || 'N/A'}
                          </small>
                          {assignment.assignedBy?.fullName && (
                            <small className="text-muted fst-italic mt-1">
                              By: {assignment.assignedBy.fullName}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(assignment.priority)}`}>
                          {assignment.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{new Date(assignment.assignedDate).toLocaleDateString()}</span>
                          <small className="text-muted">
                            {new Date(assignment.assignedDate).toLocaleTimeString()}
                          </small>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setSelectedAssignments(new Set([assignment._id]));
                            setShowUnassignModal(true);
                          }}
                          title="Unassign this user"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No assignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ⬅ Previous
              </button>
              <span className="page-info">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next ➡
              </button>
            </div>
          )}
        </>
      )}

      {/* Unassign Confirmation Modal */}
      {showUnassignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Unassign</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to unassign <strong>{selectedAssignments.size}</strong> user(s)?
              </p>
              <p className="text-warning">This will remove the assignment relationship.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowUnassignModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleUnassign}
              >
                Unassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="modal-header">
              <h3>Success</h3>
            </div>
            <div className="modal-body">
              <p>{modalMessage}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-ok"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal-content error-modal">
            <div className="modal-header">
              <h3>Error</h3>
            </div>
            <div className="modal-body">
              <p>{modalMessage}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-ok"
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserLeadAssignmentsPage;
