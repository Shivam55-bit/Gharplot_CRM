import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaEnvelope } from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const previousNotificationIds = useRef(new Set());
  const notificationRef = useRef(null);

  const handleLogout = () => {
    // Clear all authentication data based on user type
    const isAdmin = localStorage.getItem('adminToken');
    const isEmployee = localStorage.getItem('employeeToken');
    
    // Clear admin-specific data
    if (isAdmin) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    }
    
    // Clear employee-specific data
    if (isEmployee) {
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeData');
    }
    
    // Clear common authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('verificationEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token'); // fallback token
    
    console.log('User logged out - cleared all tokens');
    
    // Navigate to login page
    navigate('/login');
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set up oscillator for a phone-like notification sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notification/list`);
      if (response.data.success) {
        const allNotifications = response.data.data;
        
        // Filter out bad_attendant notifications - those should only show in admin panel
        const filteredNotifications = allNotifications.filter(
          notification => notification.type !== 'bad_attendant'
        );
        
        setNotifications(filteredNotifications);
        const unread = filteredNotifications.filter(notification => !notification.isRead).length;
        setUnreadCount(unread);
        
        // Check for new notifications by comparing IDs
        const newNotificationIds = new Set(filteredNotifications.map(n => n._id));
        const previousIds = previousNotificationIds.current;
        
        // Find newly added notifications
        const newUnreadNotifications = filteredNotifications.filter(
          notification => !notification.isRead && !previousIds.has(notification._id)
        );
        
        // If we have new unread notifications, show the first one
        if (newUnreadNotifications.length > 0) {
          const newestNotification = newUnreadNotifications[0];
          setCurrentNotification(newestNotification);
          setShowNotificationModal(true);
          playNotificationSound();
        }
        
        // Update the previous IDs set
        previousNotificationIds.current = newNotificationIds;
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notification/mark-read/${notificationId}`);
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === notificationId ? { ...notification, isRead: true } : notification
      ));
      setUnreadCount(unreadCount - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notification/${notificationId}`);
      // Update local state
      const updatedNotifications = notifications.filter(notification => notification._id !== notificationId);
      setNotifications(updatedNotifications);
      const unread = updatedNotifications.filter(notification => !notification.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Close notification modal
  const closeNotificationModal = () => {
    setShowNotificationModal(false);
    if (currentNotification) {
      markAsRead(currentNotification._id);
    }
  };

  // Handle clicks outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    // Set up interval to fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="dashboard-header fixed-top d-flex align-items-center justify-content-between px-4">
      {/* Left Section */}
      <div className="header-left d-flex align-items-center">
        <h5 className="fw-semibold mb-0">Dashboard</h5>
        {/* <small className="text-dark ms-2">Friday, 10 Oct 2025</small> */}
      </div>

      {/* Right Section */}
      <div className="header-right d-flex align-items-center gap-3">
        {/* Notifications */}
        <div className="notification-icon position-relative" onClick={() => setShowNotifications(!showNotifications)}>
          <FaBell />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notification-dropdown" ref={notificationRef}>
            <div className="notification-header">
              <h6>Notifications</h6>
              <button className="close-btn" onClick={() => setShowNotifications(false)}>×</button>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">No notifications</div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-content">
                      <h6>{notification.title}</h6>
                      <p>{notification.message}</p>
                      {notification.reminderData && (
                        <>
                          <p className="user-name">{notification.reminderData.name}</p>
                          <p className="user-email">{notification.reminderData.email}</p>
                          <p className="user-phone">{notification.reminderData.phone}</p>
                          <p className="user-location">{notification.reminderData.location}</p>
                        </>
                      )}
                      <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    </div>
                    <div className="notification-actions">
                      {!notification.isRead && (
                        <button 
                          className="mark-read-btn" 
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as read
                        </button>
                      )}
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteNotification(notification._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && currentNotification && (
          <div className="notification-modal-overlay" onClick={closeNotificationModal}>
            <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
              <div className="notification-modal-header">
                <h5>{currentNotification.title}</h5>
                <button className="notification-modal-close" onClick={closeNotificationModal}>×</button>
              </div>
              <div className="notification-modal-body">
                <p>{currentNotification.message}</p>
                
                {currentNotification.reminderData && (
                  <div className="notification-user-details">
                    <h6>User Details</h6>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Name:</span>
                      <span className="user-detail-value">{currentNotification.reminderData.name}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Email:</span>
                      <span className="user-detail-value">{currentNotification.reminderData.email}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Phone:</span>
                      <span className="user-detail-value">{currentNotification.reminderData.phone}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Location:</span>
                      <span className="user-detail-value">{currentNotification.reminderData.location}</span>
                    </div>
                    <div className="user-detail-item">
                      <span className="user-detail-label">Date:</span>
                      <span className="user-detail-value">
                        {new Date(currentNotification.reminderData.reminderTime).toLocaleString()}
                      </span>
                    </div>
                    {currentNotification.reminderData.note && (
                      <div className="user-detail-item">
                        <span className="user-detail-label">Note:</span>
                        <span className="user-detail-value note">{currentNotification.reminderData.note}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <small>Received: {new Date(currentNotification.createdAt).toLocaleString()}</small>
              </div>
              <div className="notification-modal-footer">
                <button className="btn btn-primary" onClick={closeNotificationModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* <div className="icon-wrapper position-relative">
          <FaEnvelope className="fs-5" />
          <span className="icon-badge">5</span>
        </div> */}

        {/* User Dropdown */}
        <div className="dropdown">
          <a
            href="#"
            className="d-flex align-items-center text-decoration-none dropdown-toggle"
            data-bs-toggle="dropdown"
          >
            {/* <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="user"
              className="rounded-circle me-2 header-avatar"
              width="40"
              height="40"
            /> */}
            <div className="d-flex flex-column align-items-start">
              <span className="fw-semibold text-dark">
                {(() => {
                  // Check if admin is logged in
                  const adminData = localStorage.getItem('adminData');
                  if (adminData) {
                    try {
                      const admin = JSON.parse(adminData);
                      return admin.fullName || admin.name || 'Admin';
                    } catch (e) {
                      console.error('Error parsing admin data:', e);
                    }
                  }
                  
                  // Check if employee is logged in
                  const employeeData = localStorage.getItem('employeeData');
                  if (employeeData) {
                    try {
                      const employee = JSON.parse(employeeData);
                      return employee.name || 'Employee';
                    } catch (e) {
                      console.error('Error parsing employee data:', e);
                    }
                  }
                  
                  return 'User';
                })()}
              </span>
              <small className="text-muted">
                {(() => {
                  const isAdmin = localStorage.getItem('adminToken') && localStorage.getItem('adminData');
                  const isEmployee = localStorage.getItem('employeeToken') && localStorage.getItem('employeeData');
                  
                  if (isAdmin) return 'Administrator';
                  if (isEmployee) {
                    try {
                      const employeeData = JSON.parse(localStorage.getItem('employeeData'));
                      return employeeData.role?.name || 'Employee';
                    } catch (e) {
                      return 'Employee';
                    }
                  }
                  return 'User';
                })()}
              </small>
            </div>
          </a>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm">
            {/* <li><a className="dropdown-item" href="#">Profile</a></li> */}
            {/* <li><a className="dropdown-item" href="#">Settings</a></li> */}
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button 
                className="dropdown-item" 
                onClick={handleLogout}
                style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

export default Header;