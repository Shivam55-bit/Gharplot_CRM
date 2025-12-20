import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  User, 
  Clock, 
  MessageSquare, 
  Eye,
  CheckCircle,
  RefreshCw,
  Filter,
  Bell,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import './BadAttendantNotifications.css';

const BadAttendantNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const API_BASE = 'https://abc.bhoomitechzone.us';

  // Check if user is admin
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      // Redirect to login or show unauthorized message
      window.location.href = '/admin-login';
    } else {
      setIsAdmin(true);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_BASE}/admin/notifications/bad-attendant/list?unreadOnly=${filter === 'unread'}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_BASE}/admin/notifications/bad-attendant/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_BASE}/admin/notifications/read/${notificationId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      
      if (selectedNotification?._id === notificationId) {
        setSelectedNotification(prev => ({ ...prev, read: true }));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // View details
  const viewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    
    if (!notification.read) {
      markAsRead(notification._id);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
      fetchStats();
    }
  }, [filter, isAdmin]);

  // Auto-refresh every 5 minutes (reduced from 30 seconds to avoid spam)
  useEffect(() => {
    if (!isAdmin) return;
    
    const interval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [filter, isAdmin]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Don't render anything until admin check is complete
  if (!isAdmin) {
    return (
      <div className="bad-attendant-page">
        <div className="loading-state">
          <RefreshCw className="spin" size={48} />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bad-attendant-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <AlertTriangle className="title-icon red-zone" />
            Bad Attendant Alerts
            <span className="red-zone-badge">RED ZONE</span>
          </h1>
          <p className="page-subtitle">
            Monitor employees who provide insufficient reminder responses (&lt;10 words)
          </p>
        </div>

        <button className="btn-refresh" onClick={() => {
          fetchNotifications();
          fetchStats();
        }}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.total || 0}</span>
            <span className="stat-label">Total Alerts (7 Days)</span>
          </div>
        </div>

        <div className="stat-card unread">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {notifications.filter(n => !n.read).length}
            </span>
            <span className="stat-label">Unread Alerts</span>
          </div>
        </div>

        <div className="stat-card employees">
          <div className="stat-icon">
            <User size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {stats.byEmployee?.length || 0}
            </span>
            <span className="stat-label">Employees Flagged</span>
          </div>
        </div>
      </div>

      {/* Top Offenders */}
      {stats.byEmployee && stats.byEmployee.length > 0 && (
        <div className="top-offenders-section">
          <h2>Top Offenders (Last 7 Days)</h2>
          <div className="offenders-grid">
            {stats.byEmployee.slice(0, 5).map((employee, index) => (
              <div key={employee._id} className="offender-card">
                <div className="rank-badge">{index + 1}</div>
                <div className="offender-info">
                  <h3>{employee.employeeName}</h3>
                  <div className="offender-stats">
                    <span className="offense-count">{employee.count} violations</span>
                    <span className="avg-words">Avg: {Math.round(employee.avgWordCount)} words</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={40} />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map(notification => {
              const { date, time } = formatDate(notification.createdAt);
              return (
                <div 
                  key={notification._id} 
                  className={`notification-card ${!notification.read ? 'unread' : ''}`}
                  onClick={() => viewDetails(notification)}
                >
                  <div className="notification-header">
                    <div className="notification-icon red-zone">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="notification-title">
                      <h3>{notification.title}</h3>
                      <span className="red-zone-tag">RED ZONE</span>
                    </div>
                    {!notification.read && (
                      <span className="unread-indicator">NEW</span>
                    )}
                  </div>

                  <div className="notification-body">
                    <p className="notification-message">{notification.message}</p>
                    
                    <div className="notification-details">
                      <div className="detail-item">
                        <User size={14} />
                        <span>{notification.metadata?.employeeDetails?.name || notification.metadata?.employeeName || 'Unknown Employee'}</span>
                      </div>
                      {notification.metadata?.employeeDetails?.email && (
                        <div className="detail-item">
                          <span>📧 {notification.metadata.employeeDetails.email}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <MessageSquare size={14} />
                        <span>{notification.metadata?.wordCount} words</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={14} />
                        <span>{date} at {time}</span>
                      </div>
                    </div>

                    {notification.metadata?.reminderTitle && (
                      <div className="reminder-info">
                        <strong>Reminder:</strong> {notification.metadata.reminderTitle}
                        {notification.metadata?.clientName && (
                          <span className="client-name"> - Client: {notification.metadata.clientName}</span>
                        )}
                      </div>
                    )}

                    {notification.metadata?.response && (
                      <div className="response-preview">
                        <strong>Response:</strong> "{notification.metadata.response}"
                      </div>
                    )}
                  </div>

                  <div className="notification-footer">
                    <button 
                      className="btn-view-details"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewDetails(notification);
                      }}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    
                    {!notification.read && (
                      <button 
                        className="btn-mark-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                      >
                        <CheckCircle size={16} />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Bell size={64} />
            <h3>No Bad Attendant Alerts</h3>
            <p>
              {filter === 'unread' 
                ? 'No unread alerts at this time.' 
                : 'No alerts found in the last 7 days. Great job!'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header red-zone-header">
              <h2>
                <AlertTriangle size={24} />
                Bad Attendant Alert Details
              </h2>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="alert-severity">
                <span className="severity-badge high">HIGH SEVERITY</span>
                <span className="zone-badge red">RED ZONE</span>
              </div>

              <div className="detail-section">
                <h3>Employee Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Name:</strong>
                    <span>{selectedNotification.metadata?.employeeDetails?.name || selectedNotification.metadata?.employeeName || 'Unknown Employee'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong>
                    <span>{selectedNotification.metadata?.employeeDetails?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong>
                    <span>{selectedNotification.metadata?.employeeDetails?.phone || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Employee ID:</strong>
                    <span className="monospace">{selectedNotification.metadata?.employeeId || 'N/A'}</span>
                  </div>
                  {selectedNotification.metadata?.employeeDetails?.designation && (
                    <div className="info-item">
                      <strong>Designation:</strong>
                      <span>{selectedNotification.metadata.employeeDetails.designation}</span>
                    </div>
                  )}
                  {selectedNotification.metadata?.employeeDetails?.department && (
                    <div className="info-item">
                      <strong>Department:</strong>
                      <span>{selectedNotification.metadata.employeeDetails.department}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Violation Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Reminder:</strong>
                    <span>{selectedNotification.metadata?.reminderTitle || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Client:</strong>
                    <span>{selectedNotification.metadata?.clientName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Word Count:</strong>
                    <span className="word-count-badge">
                      {selectedNotification.metadata?.wordCount || 0} words (Required: 10)
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Timestamp:</strong>
                    <span>{formatDate(selectedNotification.createdAt).date} at {formatDate(selectedNotification.createdAt).time}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Employee Response</h3>
                <div className="response-box">
                  {selectedNotification.metadata?.response || 'No response provided'}
                </div>
              </div>

              <div className="detail-section">
                <h3>Violation Message</h3>
                <p className="violation-message">{selectedNotification.message}</p>
              </div>
            </div>

            <div className="modal-footer">
              {!selectedNotification.read && (
                <button 
                  className="btn-mark-read-modal"
                  onClick={() => {
                    markAsRead(selectedNotification._id);
                    setShowDetailModal(false);
                  }}
                >
                  <CheckCircle size={16} />
                  Mark as Read & Close
                </button>
              )}
              <button 
                className="btn-close-modal"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadAttendantNotifications;
