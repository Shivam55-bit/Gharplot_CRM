import React, { useState, useEffect } from 'react';
import './Report&Complaint.css';

// Sample data - replace with API calls
const sampleComplaints = [
  {
    id: 'RC001',
    category: 'Property',
    relatedId: 'PROP001',
    reportedBy: 'John Doe',
    reportedByEmail: 'john.doe@email.com',
    against: 'ABC Real Estate',
    againstEmail: 'contact@abcrealestate.com',
    description: 'Property listing contains false information about square footage and amenities.',
    status: 'Pending',
    priority: 'High',
    createdAt: '2024-10-10T10:30:00Z',
    updatedAt: '2024-10-10T10:30:00Z',
    adminNotes: '',
    attachments: ['screenshot1.jpg', 'floor_plan.pdf']
  },
  {
    id: 'RC002',
    category: 'Service',
    relatedId: 'SERV001',
    reportedBy: 'Jane Smith',
    reportedByEmail: 'jane.smith@email.com',
    against: 'CleanPro Services',
    againstEmail: 'support@cleanpro.com',
    description: 'House cleaning service was incomplete and several rooms were not cleaned properly.',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2024-10-09T14:15:00Z',
    updatedAt: '2024-10-12T09:20:00Z',
    adminNotes: 'Contacted service provider for clarification.',
    attachments: []
  },
  {
    id: 'RC003',
    category: 'Property',
    relatedId: 'PROP002',
    reportedBy: 'Mike Johnson',
    reportedByEmail: 'mike.johnson@email.com',
    against: 'XYZ Property Management',
    againstEmail: 'info@xyzpm.com',
    description: 'Rental agreement terms were changed without proper notice.',
    status: 'Escalated',
    priority: 'High',
    createdAt: '2024-10-08T16:45:00Z',
    updatedAt: '2024-10-11T11:30:00Z',
    adminNotes: 'Escalated to legal team for review.',
    attachments: ['contract_original.pdf', 'contract_modified.pdf']
  },
  {
    id: 'RC004',
    category: 'Service',
    relatedId: 'SERV002',
    reportedBy: 'Sarah Wilson',
    reportedByEmail: 'sarah.wilson@email.com',
    against: 'FixIt Plumbing',
    againstEmail: 'hello@fixitplumbing.com',
    description: 'Plumber arrived 3 hours late and left without completing the work.',
    status: 'Resolved',
    priority: 'Medium',
    createdAt: '2024-10-07T08:20:00Z',
    updatedAt: '2024-10-13T15:45:00Z',
    adminNotes: 'Issue resolved. Refund processed and new plumber assigned.',
    attachments: ['work_order.pdf']
  }
];

const ReportsComplaints = () => {
  // State management
  const [complaints, setComplaints] = useState(sampleComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(sampleComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
//   const [loading, setLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Calculate statistics
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => c.status === 'Escalated').length
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Apply filters
  useEffect(() => {
    let filtered = complaints.filter(complaint => {
      const matchesSearch = complaint.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                           complaint.reportedBy.toLowerCase().includes(filters.search.toLowerCase()) ||
                           complaint.against.toLowerCase().includes(filters.search.toLowerCase()) ||
                           complaint.id.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCategory = !filters.category || complaint.category === filters.category;
      const matchesStatus = !filters.status || complaint.status === filters.status;
      const matchesPriority = !filters.priority || complaint.priority === filters.priority;
      
      const complaintDate = new Date(complaint.createdAt);
      const matchesDateFrom = !filters.dateFrom || complaintDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || complaintDate <= new Date(filters.dateTo);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriority && matchesDateFrom && matchesDateTo;
    });
    
    setFilteredComplaints(filtered);
    setCurrentPage(1);
  }, [filters, complaints]);
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      priority: '',
      dateFrom: '',
      dateTo: ''
    });
  };
  
  // Handle complaint actions
  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };
  
  const handleUpdateComplaint = (updatedComplaint) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === updatedComplaint.id ? updatedComplaint : complaint
      )
    );
    setShowModal(false);
    setSelectedComplaint(null);
  };
  
  const handleDeleteComplaint = (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      setComplaints(prev => prev.filter(complaint => complaint.id !== complaintId));
    }
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-badge status-pending';
      case 'In Progress': return 'status-badge status-in-progress';
      case 'Resolved': return 'status-badge status-resolved';
      case 'Escalated': return 'status-badge status-escalated';
      default: return 'status-badge';
    }
  };
  
  // Get category badge class
  const getCategoryBadgeClass = (category) => {
    return category === 'Property' ? 'category-badge category-property' : 'category-badge category-service';
  };
  
  // Get priority class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="reports-complaints-container mt-5">
      {/* Header Section */}
      <div className="rc-header">
        <div>
          <h1 className="rc-title">Reports & Complaints</h1>
          <p className="rc-subtitle">Manage and track all property and service complaints</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <i className="fas fa-download"></i>
            Export Data
          </button>
          <button className="btn-primary">
            <i className="fas fa-plus"></i>
            Add New Report
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Total Complaints</h3>
              <div className="card-value">{stats.total}</div>
            </div>
            <div className="card-icon total">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <div className="card-change neutral">
            <i className="fas fa-chart-line"></i>
            All time records
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Pending</h3>
              <div className="card-value">{stats.pending}</div>
            </div>
            <div className="card-icon pending">
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <div className="card-change negative">
            <i className="fas fa-arrow-up"></i>
            Needs attention
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Resolved</h3>
              <div className="card-value">{stats.resolved}</div>
            </div>
            <div className="card-icon resolved">
              <i className="fas fa-check-circle"></i>
            </div>
          </div>
          <div className="card-change positive">
            <i className="fas fa-arrow-up"></i>
            Great progress
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Escalated</h3>
              <div className="card-value">{stats.escalated}</div>
            </div>
            <div className="card-icon escalated">
              <i className="fas fa-exclamation"></i>
            </div>
          </div>
          <div className="card-change negative">
            <i className="fas fa-arrow-up"></i>
            Urgent review
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3 className="filters-title">Filter & Search</h3>
          <div className="filter-actions">
            <button className="btn-filter btn-apply" onClick={() => {}}>
              <i className="fas fa-search"></i>
              Apply Filters
            </button>
            <button className="btn-filter btn-reset" onClick={resetFilters}>
              <i className="fas fa-undo"></i>
              Reset
            </button>
          </div>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-input">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                className="filter-input"
                placeholder="Search by ID, description, reporter..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
              className="filter-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Property">Property</option>
              <option value="Service">Service</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Priority</label>
            <select
              className="filter-select"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Date From</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="table-container">
        <div className="table-header">
          <div>
            <h3 className="table-title">Complaints Overview</h3>
            <p className="table-meta">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} complaints
            </p>
          </div>
        </div>
        
        <div className="table-wrapper">
          {filteredComplaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-search"></i>
              </div>
              <h4 className="empty-title">No complaints found</h4>
              <p className="empty-description">
                Try adjusting your search criteria or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Reported By</th>
                  <th>Against</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComplaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td data-label="ID">
                      <strong>{complaint.id}</strong>
                    </td>
                    <td data-label="Category">
                      <span className={getCategoryBadgeClass(complaint.category)}>
                        {complaint.category}
                      </span>
                    </td>
                    <td data-label="Reported By">
                      {complaint.reportedBy}
                    </td>
                    <td data-label="Against">
                      {complaint.against}
                    </td>
                    <td data-label="Description">
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.description}
                      </div>
                    </td>
                    <td data-label="Priority">
                      <span className={getPriorityClass(complaint.priority)}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={getStatusBadgeClass(complaint.status)}>
                        {complaint.status}
                      </span>
                    </td>
                    <td data-label="Date">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleViewComplaint(complaint)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleViewComplaint(complaint)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteComplaint(complaint.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} complaints
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {showModal && selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() => {
            setShowModal(false);
            setSelectedComplaint(null);
          }}
          onUpdate={handleUpdateComplaint}
        />
      )}
      
      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Complaints by Category</h3>
          </div>
          <div className="chart-content">
            <ComplaintsPieChart data={complaints} />
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Monthly Trends</h3>
          </div>
          <div className="chart-content">
            <ComplaintsBarChart data={complaints} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Complaint Modal Component
const ComplaintModal = ({ complaint, onClose, onUpdate }) => {
  const [status, setStatus] = useState(complaint.status);
  const [adminNotes, setAdminNotes] = useState(complaint.adminNotes);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedComplaint = {
        ...complaint,
        status,
        adminNotes,
        updatedAt: new Date().toISOString()
      };
      
      onUpdate(updatedComplaint);
      setLoading(false);
    }, 1000);
  };

  const handleSendEmail = (recipient) => {
    // Simulate email sending
    alert(`Email sent to ${recipient}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Complaint Details - {complaint.id}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="complaint-details">
            {/* Basic Information */}
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-info-circle"></i>
                Basic Information
              </h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Complaint ID</span>
                  <span className="detail-value">{complaint.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">{complaint.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className="detail-value">{complaint.priority}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created Date</span>
                  <span className="detail-value">
                    {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Reporter Information */}
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-user"></i>
                Reporter Information
              </h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{complaint.reportedBy}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{complaint.reportedByEmail}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleSendEmail(complaint.reportedByEmail)}
                  >
                    <i className="fas fa-envelope"></i>
                    Send Email to Reporter
                  </button>
                </div>
              </div>
            </div>

            {/* Against Information */}
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-building"></i>
                Complaint Against
              </h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Company/Service</span>
                  <span className="detail-value">{complaint.against}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{complaint.againstEmail}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleSendEmail(complaint.againstEmail)}
                  >
                    <i className="fas fa-envelope"></i>
                    Send Email to Provider
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-file-text"></i>
                Complaint Description
              </h4>
              <div className="description-text">
                {complaint.description}
              </div>
            </div>

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="detail-section">
                <h4 className="section-title">
                  <i className="fas fa-paperclip"></i>
                  Attachments
                </h4>
                <div className="detail-grid">
                  {complaint.attachments.map((attachment, index) => (
                    <div key={index} className="detail-item">
                      <button className="btn-secondary">
                        <i className="fas fa-download"></i>
                        {attachment}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="detail-section">
              <h4 className="section-title">
                <i className="fas fa-cog"></i>
                Status Management
              </h4>
              <div className="status-update">
                <div className="filter-group">
                  <label className="filter-label">Update Status</label>
                  <select
                    className="status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="detail-section admin-notes">
              <h4 className="section-title">
                <i className="fas fa-sticky-note"></i>
                Admin Notes
              </h4>
              <textarea
                className="notes-textarea"
                placeholder="Add internal notes about this complaint..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Pie Chart Component (placeholder - replace with actual chart library)
const ComplaintsPieChart = ({ data }) => {
  const categoryStats = data.reduce((acc, complaint) => {
    acc[complaint.category] = (acc[complaint.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
      <div>
        {Object.entries(categoryStats).map(([category, count]) => (
          <div key={category} style={{ margin: '10px 0' }}>
            <strong>{category}:</strong> {count} complaints
          </div>
        ))}
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '20px' }}>
        Install Chart.js or Recharts for interactive charts
      </p>
    </div>
  );
};

// Simple Bar Chart Component (placeholder - replace with actual chart library)
const ComplaintsBarChart = ({ data }) => {
  const monthlyStats = data.reduce((acc, complaint) => {
    const month = new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📈</div>
      <div>
        {Object.entries(monthlyStats).map(([month, count]) => (
          <div key={month} style={{ margin: '10px 0' }}>
            <strong>{month}:</strong> {count} complaints
          </div>
        ))}
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '20px' }}>
        Install Chart.js or Recharts for interactive charts
      </p>
    </div>
  );
};

export default ReportsComplaints;
