import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Pause, 
  RefreshCw, 
  Filter, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Bell,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MessageSquare,
  Timer,
  RotateCcw,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiClient from '../../utils/axiosConfig';
import './RemindersPage.css';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    status: '',
    assignmentType: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const itemsPerPage = 10;

  // API configuration
  const API_BASE = 'https://abc.bhoomitechzone.us';

  // Fetch reminders
  const fetchReminders = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(filters.status && { status: filters.status }),
        ...(filters.assignmentType && { assignmentType: filters.assignmentType })
      });

      const response = await apiClient.get(`/employee/reminders/list?${params}`);

      if (response.data.success) {
        setReminders(response.data.data.reminders || []);
        setPagination(response.data.data.pagination || {});
      } else {
        setError(response.data.message || 'Failed to fetch reminders');
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError(err.response?.data?.message || 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reminder statistics
  const fetchStats = async () => {
    try {
      console.log('📊 Fetching reminder stats...');
      const response = await apiClient.get('/employee/reminders/stats');

      console.log('📊 Stats response:', response.data);

      if (response.data.success) {
        console.log('📊 Setting stats:', response.data.data);
        setStats(response.data.data);
      } else {
        console.error('📊 Stats fetch failed:', response.data.message);
        // Set default stats if API fails
        setStats({
          total: 0,
          pending: 0,
          completed: 0,
          snoozed: 0,
          dismissed: 0,
          due: 0
        });
      }
    } catch (err) {
      console.error('📊 Error fetching stats:', err);
      // Set default stats if API call fails
      setStats({
        total: 0,
        pending: 0,
        completed: 0,
        snoozed: 0,
        dismissed: 0,
        due: 0
      });
    }
  };

  // Complete reminder
  const completeReminder = async (reminderId, response) => {
    try {
      const result = await apiClient.put(`/employee/reminders/complete/${reminderId}`, {
        response
      });

      if (result.data.success) {
        fetchReminders();
        fetchStats();
        setShowDetailModal(false);
        // Show success message
      }
    } catch (err) {
      console.error('Error completing reminder:', err);
      setError(err.response?.data?.message || 'Failed to complete reminder');
    }
  };

  // Snooze reminder
  const snoozeReminder = async (reminderId, minutes) => {
    try {
      await apiClient.put(`/employee/reminders/snooze/${reminderId}`, {
        snoozeMinutes: minutes
      });

      fetchReminders();
      fetchStats();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error snoozing reminder:', err);
      setError(err.response?.data?.message || 'Failed to snooze reminder');
    }
  };

  // Dismiss reminder
  const dismissReminder = async (reminderId) => {
    try {
      await apiClient.put(`/employee/reminders/dismiss/${reminderId}`, {});

      fetchReminders();
      fetchStats();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error dismissing reminder:', err);
      setError(err.response?.data?.message || 'Failed to dismiss reminder');
    }
  };

  // Delete reminder
  const deleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await apiClient.delete(`/employee/reminders/delete/${reminderId}`);

        fetchReminders();
        fetchStats();
        setShowDetailModal(false);
      } catch (err) {
        console.error('Error deleting reminder:', err);
        setError(err.response?.data?.message || 'Failed to delete reminder');
      }
    }
  };

  // Format date and time - treat as local time, not UTC
  const formatDateTime = (dateString) => {
    // Parse the ISO string and extract components directly
    // Format: "2025-11-28T09:55:00.000Z" should display as 09:55, not converted
    const isoDate = new Date(dateString);
    
    // Extract UTC components to display them as local
    const year = isoDate.getUTCFullYear();
    const month = isoDate.getUTCMonth();
    const day = isoDate.getUTCDate();
    const hours = isoDate.getUTCHours();
    const minutes = isoDate.getUTCMinutes();
    
    // Create display strings
    const dateObj = new Date(year, month, day);
    const formattedDate = dateObj.toLocaleDateString();
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    return {
      date: formattedDate,
      time: formattedTime
    };
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'orange', text: 'Pending' },
      completed: { icon: CheckCircle, color: 'green', text: 'Completed' },
      snoozed: { icon: Pause, color: 'blue', text: 'Snoozed' },
      dismissed: { icon: XCircle, color: 'gray', text: 'Dismissed' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`status-badge status-${badge.color}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  // Get priority indicator
  const getPriorityIndicator = (reminderDateTime) => {
    const now = new Date();
    const reminderTime = new Date(reminderDateTime);
    const timeDiff = reminderTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 0) {
      return <span className="priority-indicator overdue">Overdue</span>;
    } else if (hoursDiff < 1) {
      return <span className="priority-indicator urgent">Due Soon</span>;
    } else if (hoursDiff < 24) {
      return <span className="priority-indicator today">Today</span>;
    } else {
      return <span className="priority-indicator upcoming">Upcoming</span>;
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  // View reminder details
  const viewReminderDetails = (reminder) => {
    setSelectedReminder(reminder);
    setShowDetailModal(true);
  };

  useEffect(() => {
    fetchReminders();
    fetchStats();
  }, [currentPage, filters.status, filters.assignmentType]);

  // Debug stats changes
  useEffect(() => {
    console.log('📊 Stats updated:', stats);
    console.log('📊 Stats keys:', Object.keys(stats));
    console.log('📊 Stats values:', Object.values(stats));
    if (stats.total !== undefined) {
      console.log('📊 Total type:', typeof stats.total, 'Value:', stats.total);
    }
  }, [stats]);

  // Filter reminders by search term
  const filteredReminders = reminders.filter(reminder => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      reminder.title?.toLowerCase().includes(searchLower) ||
      reminder.comment?.toLowerCase().includes(searchLower) ||
      reminder.assignmentType?.toLowerCase().includes(searchLower) ||
      reminder.status?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="reminders-page mt-5">
      {/* Page Header */}
      <div className="reminders-header">
        <div className="header-content">
          <h1 className="page-title">
            <Bell className="title-icon" />
            My Reminders
          </h1>
          <p className="page-subtitle">
            Manage and track all your assigned reminders
          </p>
        </div>
        
      </div>

      {/* Statistics Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{Number(stats.total || 0)}</span>
              <span className="stat-label">Total Reminders</span>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{Number(stats.pending || 0)}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          
          <div className="stat-card due">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{Number(stats.due || 0)}</span>
              <span className="stat-label">Due Now</span>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{Number(stats.completed || 0)}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search reminders..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="snoozed">Snoozed</option>
              <option value="dismissed">Dismissed</option>
            </select>
            
            <select
              value={filters.assignmentType}
              onChange={(e) => handleFilterChange('assignmentType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="LeadAssignment">Lead Assignment</option>
              <option value="UserLeadAssignment">User Lead Assignment</option>
            </select>
          </div>
          
          <button 
            className="btn-refresh"
            onClick={() => {
              fetchReminders();
              fetchStats();
            }}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Reminders Table */}
      <div className="reminders-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p>Loading reminders...</p>
          </div>
        ) : filteredReminders.length > 0 ? (
          <>
            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th style={{ width: '15%' }}>Title & Client</th>
                        <th style={{ width: '45%', textAlign: 'center' }}>
                          <MessageSquare size={16} className="me-1" />
                          Note/Comment
                        </th>
                        <th style={{ width: '15%' }}>
                          <Calendar size={16} className="me-1" />
                          Due Date
                        </th>
                        <th style={{ width: '10%' }}>Status</th>
                        <th style={{ width: '15%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReminders.map(reminder => {
                        const { date, time } = formatDateTime(reminder.reminderDateTime);
                        
                        return (
                          <tr key={reminder._id} className="align-middle">
                            {/* Title & Client */}
                            <td style={{ width: '15%' }}>
                              <div>
                                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                                  {reminder.title || 'Untitled Reminder'}
                                </strong>
                                {reminder.clientName && (
                                  <span className="text-muted" style={{ fontSize: '13px' }}>
                                    {reminder.clientName}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Note/Comment - Center Column */}
                            <td style={{ width: '45%', textAlign: 'center' }}>
                              {reminder.comment ? (
                                <div 
                                  style={{ 
                                    fontSize: '14px',
                                    padding: '8px 12px',
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    margin: '0 auto',
                                    maxWidth: '95%',
                                    wordWrap: 'break-word',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  dangerouslySetInnerHTML={{ 
                                    __html: reminder.comment.length > 150 
                                      ? `${reminder.comment.substring(0, 150)}...` 
                                      : reminder.comment
                                  }}
                                />
                              ) : (
                                <span className="text-muted" style={{ fontStyle: 'italic' }}>No note</span>
                              )}
                            </td>

                            {/* Due Date & Time */}
                            <td style={{ width: '15%' }}>
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '13px' }}>{date}</div>
                                <small className="text-muted" style={{ fontSize: '12px' }}>{time}</small>
                                <div style={{ marginTop: '4px' }}>
                                  {getPriorityIndicator(reminder.reminderDateTime)}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td style={{ width: '10%' }}>
                              {getStatusBadge(reminder.status)}
                            </td>

                            {/* Actions */}
                            <td style={{ width: '15%' }}>
                              <div className="d-flex gap-1">
                                <button 
                                  className="btn btn-outline-info btn-sm"
                                  onClick={() => viewReminderDetails(reminder)}
                                  title="View Full Details"
                                >
                                  <Eye size={14} />
                                </button>
                                
                                {reminder.status === 'pending' && (
                                  <>
                                    <button 
                                      className="btn btn-outline-warning btn-sm"
                                      onClick={() => snoozeReminder(reminder._id, 15)}
                                      title="Snooze 15 min"
                                    >
                                      <Timer size={14} />
                                    </button>
                                    
                                    <button 
                                      className="btn btn-outline-success btn-sm"
                                      onClick={() => viewReminderDetails(reminder)}
                                      title="Complete"
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                  </>
                                )}
                                
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => deleteReminder(reminder._id)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-page"
                  disabled={!pagination.hasPrev}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                
                <span className="page-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  <small>({pagination.total} total)</small>
                </span>
                
                <button
                  className="btn-page"
                  disabled={!pagination.hasNext}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Bell size={64} />
            <h3>No Reminders Found</h3>
            <p>
              {filters.search || filters.status || filters.assignmentType
                ? 'No reminders match your current filters. Try adjusting your search criteria or clearing the filters.'
                : 'You don\'t have any reminders yet. Reminders will be created automatically when you set follow-up dates for your leads, or create them manually.'
              }
            </p>
            {(filters.search || filters.status || filters.assignmentType) && (
              <button 
                className="btn-clear-filters"
                onClick={() => {
                  setFilters({ status: '', assignmentType: '', search: '' });
                  setCurrentPage(1);
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reminder Detail Modal */}
      {showDetailModal && selectedReminder && (
        <ReminderDetailModal
          reminder={selectedReminder}
          onClose={() => setShowDetailModal(false)}
          onComplete={completeReminder}
          onSnooze={snoozeReminder}
          onDismiss={dismissReminder}
          onDelete={deleteReminder}
        />
      )}
    </div>
  );
};

// Reminder Detail Modal Component
const ReminderDetailModal = ({ 
  reminder, 
  onClose, 
  onComplete, 
  onSnooze, 
  onDismiss, 
  onDelete 
}) => {
  const [response, setResponse] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!response.trim()) {
      alert('Please provide a response before completing the reminder.');
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete(reminder._id, response);
    } finally {
      setIsCompleting(false);
    }
  };

  const { date, time } = formatDateTime(reminder.reminderDateTime);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reminder-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reminder Details</h2>
          <button className="btn-close" onClick={onClose}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="reminder-info">
            <h3>{reminder.title}</h3>
            
            <div className="info-grid">
              <div className="info-item">
                <Calendar size={18} />
                <div>
                  <strong>Scheduled</strong>
                  <span>{date} at {time}</span>
                </div>
              </div>

              <div className="info-item">
                <span className={`status-badge status-${reminder.status === 'pending' ? 'orange' : reminder.status === 'completed' ? 'green' : reminder.status === 'snoozed' ? 'blue' : 'gray'}`}>
                  {reminder.status.toUpperCase()}
                </span>
              </div>

              {reminder.assignmentId && (
                <div className="info-item">
                  <Target size={18} />
                  <div>
                    <strong>Assignment</strong>
                    <span>{reminder.assignmentType} - {reminder.assignmentId._id || reminder.assignmentId}</span>
                  </div>
                </div>
              )}

              {reminder.employeeId && (
                <div className="info-item">
                  <User size={18} />
                  <div>
                    <strong>Assigned To</strong>
                    <span>{reminder.employeeId.name || reminder.employeeId.email || 'Employee'}</span>
                  </div>
                </div>
              )}

              {reminder.isRepeating && (
                <div className="info-item">
                  <RotateCcw size={18} />
                  <div>
                    <strong>Repeat</strong>
                    <span>{reminder.repeatType}</span>
                  </div>
                </div>
              )}
            </div>

            {reminder.comment && (
              <div className="reminder-comment">
                <h4>Note/Comment</h4>
                <div 
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '1.6',
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}
                  dangerouslySetInnerHTML={{ __html: reminder.comment }}
                />
              </div>
            )}

            {reminder.completionResponse && (
              <div className="completion-response">
                <h4>Previous Response</h4>
                <p>{reminder.completionResponse}</p>
                <small>
                  Completed on {formatDateTime(reminder.completedAt).date} at {formatDateTime(reminder.completedAt).time}
                  - {reminder.responseWordCount} words
                </small>
              </div>
            )}
          </div>

          {reminder.status === 'pending' && (
            <div className="completion-section">
              <h4>Complete Reminder</h4>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter your response or completion notes..."
                rows={4}
              />
              <small>{response.trim().split(/\s+/).filter(word => word.length > 0).length} words</small>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {reminder.status === 'pending' && (
            <div className="action-buttons">
              <button 
                className="btn-snooze"
                onClick={() => onSnooze(reminder._id, 15)}
              >
                <Timer size={16} />
                Snooze 15m
              </button>
              
              <button 
                className="btn-snooze"
                onClick={() => onSnooze(reminder._id, 60)}
              >
                <Timer size={16} />
                Snooze 1h
              </button>
              
              <button 
                className="btn-dismiss"
                onClick={() => onDismiss(reminder._id)}
              >
                <XCircle size={16} />
                Dismiss
              </button>
              
              <button 
                className="btn-complete"
                onClick={handleComplete}
                disabled={isCompleting || !response.trim()}
              >
                <CheckCircle size={16} />
                {isCompleting ? 'Completing...' : 'Complete'}
              </button>
            </div>
          )}
          
          <button 
            className="btn-delete"
            onClick={() => onDelete(reminder._id)}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

export default RemindersPage;