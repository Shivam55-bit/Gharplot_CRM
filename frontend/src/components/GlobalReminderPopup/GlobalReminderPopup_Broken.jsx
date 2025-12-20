import React, { useState, useEffect, useRef } from 'react';
import { Clock3, X, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import globalReminderService from '../../services/GlobalReminderService';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig.jsx';
import './GlobalReminderPopup.css';

const GlobalReminderPopup = ({ token }) => {
  const [activeReminders, setActiveReminders] = useState([]);
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [completionResponses, setCompletionResponses] = useState({});
  const [isCompleting, setIsCompleting] = useState({});

  const audioRef = useRef(null);
  const textareaRefs = useRef({}); // refs per reminder for autofocus and keyboard

  // Initialize audio for notifications
  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio();
    // Using a data URL for a simple notification beep sound
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiN1e/SeS4FJHLF8OGSQwoUXLLm76tZGAg+ltryxnkpBSl+zPHYizoIGGS57OScTgwOUarm7bpnHgg2jdXuzn0vBSF0xe7glEILElyx5O2uWhkIO5LY8MR9KwUme8rx2Ig8BxJht+zjoEwNDU6r5O6/aB4INozU7tGAMgUfcsLu45ZFDBJYr+XurV4aEzl9xe7glEILElyx5O2uWhkIO5LY8MR9KwUme8rx2Ig8BxJht+zjoEwNDU6r5O6/aB4INozU7tGAMgUfcsLu45ZFDBJYr+XurV4aEz6G0vLEfSsFJnjJ8N2QQAoUXrTp66hVFApGn+DyvmQdBjiN1e/SeS4GJHLF8OGSQwoUXLLm76tZGAg+ltryxnkpBSl+zPHYizoIGGS57OScTgwOUarm7bpnHgg2jdXuzn0vBSF0xe7glEILElyx5O2uWhkIO5LY8MR9KwUme8rx2Ig8BxJht+zjoEwNDU6r5O6/aB4INozU7tGAMgUfcsLu45ZFDBJYr+XurV4aEzl9";
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Set up global reminder service when component mounts
  useEffect(() => {
    console.log('🔄🔄🔄 GlobalReminderPopup MOUNTING ON EVERY PAGE 🔄🔄🔄');
    console.log('🔑 Token provided:', token ? `Yes (${token.substring(0, 10)}...)` : 'No');
    console.log('📍 Current page:', window.location.pathname);
    console.log('🔍 Service status before start:', globalReminderService.getStatus());
    
    // Always set up the callback
    globalReminderService.setReminderCallback(handleReminderDue);
    
    // Start the service (it will handle token detection internally if token is not provided)
    globalReminderService.start(token);
    setIsServiceActive(true);

    // Force a few immediate checks to ensure we catch due reminders quickly
    [800, 2200, 4000].forEach(delay => {
      setTimeout(() => {
        console.log('🔄 Forcing immediate reminder check...');
        globalReminderService.forceCheck();
      }, delay);
    });

    console.log('✅✅✅ Global Reminder Service FULLY ACTIVATED on page:', window.location.pathname);

    // Cleanup when component unmounts
    return () => {
      console.log('🔄 Cleaning up Global Reminder Service on page:', window.location.pathname);
      // Don't stop the service when component unmounts, keep it running globally
      // globalReminderService.stop();
      setIsServiceActive(false);
    };
  }, [token]);

  // Handle when a reminder is due
  const handleReminderDue = (reminder) => {
    console.log('🔔🔔🔔 REMINDER IS DUE - SHOWING POPUP! 🔔🔔🔔');
    console.log('Reminder details:', reminder);
    console.log('Current page:', window.location.pathname);
    
    // Play notification sound
    playNotificationSound();
    
    // Add to active reminders if not already present
    setActiveReminders(prev => {
      const exists = prev.some(r => r._id === reminder._id);
      console.log('Adding reminder to active list. Already exists:', exists);
      if (!exists) {
        const newReminders = [...prev, { ...reminder, showTime: Date.now() }];
        console.log('New active reminders count:', newReminders.length);
        return newReminders;
      }
      return prev;
    });

    // Show browser notification if permission granted
    showBrowserNotification(reminder);
  };

  // When new reminders appear, create refs and autofocus the first reminder textarea
  useEffect(() => {
    if (activeReminders.length === 0) return;

    // Create refs for any new reminders
    activeReminders.forEach(r => {
      if (!(r._id in textareaRefs.current)) {
        textareaRefs.current[r._id] = null;
      }
    });

    // Focus the first reminder textarea if present
    const firstId = activeReminders[0]._id;
    const el = textareaRefs.current[firstId];
    if (el) {
      try { el.focus(); } catch { }
    }
  }, [activeReminders]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.log('Audio play failed:', err.message);
        });
      }
    } catch (error) {
      console.log('Error playing notification sound:', error.message);
    }
  };

  // Show browser notification
  const showBrowserNotification = (reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('CRM Reminder', {
        body: reminder.description || reminder.message || 'You have a reminder',
        icon: '/favicon.ico',
        tag: `reminder-${reminder._id}`
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('CRM Reminder', {
            body: reminder.description || reminder.message || 'You have a reminder',
            icon: '/favicon.ico',
            tag: `reminder-${reminder._id}`
          });
        }
      });
    }
  };

  // Close a specific reminder
  const closeReminder = (reminderId) => {
    setActiveReminders(prev => prev.filter(r => r._id !== reminderId));
  };

  // Complete a reminder with response
  const completeReminder = async (reminderId) => {
    const response = completionResponses[reminderId];
    if (!response || !response.trim()) {
      alert('Please enter a response to complete the reminder');
      return;
    }

    setIsCompleting(prev => ({ ...prev, [reminderId]: true }));
    
    try {
      const authToken = localStorage.getItem('employeeToken') || 
                       localStorage.getItem('adminToken') || 
                       localStorage.getItem('token');
      
      if (!authToken) {
        alert('Authentication required to complete reminder');
        return;
      }

      await axios.put(
        `${API_BASE_URL}/employee/reminders/complete/${reminderId}`,
        { response: response.trim() },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('✅ Reminder completed successfully');
      closeReminder(reminderId);
      
      // Clean up states
      setCompletionResponses(prev => {
        const newResponses = { ...prev };
        delete newResponses[reminderId];
        return newResponses;
      });
      
    } catch (error) {
      console.error('❌ Error completing reminder:', error);
      alert('Failed to complete reminder. Please try again.');
    } finally {
      setIsCompleting(prev => ({ ...prev, [reminderId]: false }));
    }
  };

  // Snooze a reminder
  const snoozeReminder = async (reminderId, minutes) => {
    console.log(`Snoozing reminder ${reminderId} for ${minutes} minutes`);
    
    try {
      const authToken = localStorage.getItem('employeeToken') || 
                       localStorage.getItem('adminToken') || 
                       localStorage.getItem('token');
      
      if (authToken) {
        await axios.put(
          `${API_BASE_URL}/employee/reminders/snooze/${reminderId}`,
          { snoozeMinutes: minutes },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ Reminder snoozed successfully');
      }
    } catch (error) {
      console.error('❌ Error snoozing reminder:', error);
    }
    
    // Close the current popup
    closeReminder(reminderId);
  };

  // Dismiss a reminder
  const dismissReminder = async (reminderId) => {
    try {
      const authToken = localStorage.getItem('employeeToken') || 
                       localStorage.getItem('adminToken') || 
                       localStorage.getItem('token');
      
      if (authToken) {
        await axios.put(
          `${API_BASE_URL}/employee/reminders/dismiss/${reminderId}`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ Reminder dismissed successfully');
      }
    } catch (error) {
      console.error('❌ Error dismissing reminder:', error);
    }
    
    closeReminder(reminderId);
  };

  // Close all reminders
  const closeAllReminders = () => {
    setActiveReminders([]);
  };

  // Format time for display
  const formatTime = (dateTime) => {
    try {
      return new Date(dateTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Now';
    }
  };

  // Get word count for response
  const getWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Get response color class based on word count
  const getResponseColorClass = (wordCount) => {
    if (wordCount < 10) return 'response-red';
    if (wordCount >= 10 && wordCount <= 20) return 'response-yellow';
    return 'response-green';
  };

  // Update completion response
  const updateCompletionResponse = (reminderId, value) => {
    setCompletionResponses(prev => ({
      ...prev,
      [reminderId]: value
    }));
  };

  // Keyboard handler: Ctrl/Cmd + Enter to submit completion
  const handleKeyDown = (e, reminderId) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (completionResponses[reminderId] && completionResponses[reminderId].trim().length > 0) {
        completeReminder(reminderId);
      }
    }
  };



  // Don't render anything if no active reminders
  if (activeReminders.length === 0) {
    return null;
  }

  // Debug logging
  console.log('🔍 GlobalReminderPopup render - Active reminders count:', activeReminders.length);
  console.log('🔍 Service active:', isServiceActive);
  console.log('🔍 Current page:', window.location.pathname);

  return (
    <>
      {/* Service status indicator (always show for debugging) */}
      <div className="reminder-service-status">
        <Bell size={12} />
        <span>{isServiceActive ? 'Active' : 'Inactive'} | {activeReminders.length} reminders</span>
      </div>

      {/* Square Modal for each reminder */}
      {activeReminders.map((reminder, index) => (
        <div key={reminder._id} className="reminder-modal-overlay">
          <div className="reminder-square-modal">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="header-content">
                <div className="bell-icon">
                  <Bell size={28} color="#ff6b6b" />
                </div>
                <h3 className="modal-title">Reminder Alert</h3>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => closeReminder(reminder._id)}
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <div className="reminder-time-display">
                <Clock3 size={18} />
                <span>{formatTime(reminder.reminderDateTime)}</span>
              </div>

              <div className="reminder-content">
                {/* Title Section - Full Width */}
                {reminder.title && (
                  <div className="reminder-title-section modal-content-full">
                    <h4 className="reminder-title">{reminder.title}</h4>
                  </div>
                )}

                {/* Main Description/Comment - Full Width */}
                <div className="main-description modal-content-full">
                  {reminder.comment || reminder.description || reminder.message || 'You have a reminder scheduled for this time.'}
                </div>

                {/* Two Column Grid for Detail Boxes */}
                <div className="modal-content-grid">
                  {/* Reminder Details Box */}
                  <div className="reminder-details-box">
                    <h4>Reminder Details</h4>
                    
                    {/* Assignment context */}
                    {reminder.assignmentType && (
                      <div className="detail-item">
                        <span className="label">Type:</span>
                        <span className="value">
                          {reminder.assignmentType === 'LeadAssignment' ? 'Enquiry Lead' : 'Client Lead'}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    {reminder.status && (
                      <div className="detail-item">
                        <span className="label">Status:</span>
                        <span className={`value status-${reminder.status}`}>
                          {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                        </span>
                      </div>
                    )}

                    {/* Repeat Information */}
                    {reminder.isRepeating && (
                      <div className="detail-item">
                        <span className="label">Repeats:</span>
                        <span className="value">
                          {reminder.repeatType ? reminder.repeatType.charAt(0).toUpperCase() + reminder.repeatType.slice(1) : 'Yes'}
                        </span>
                      </div>
                    )}

                    {/* Snooze Count */}
                    {reminder.snoozeCount > 0 && (
                      <div className="detail-item">
                        <span className="label">Snoozed:</span>
                        <span className="value">{reminder.snoozeCount} time(s)</span>
                      </div>
                    )}

                    {/* Trigger Count */}
                    {reminder.triggerCount > 0 && (
                      <div className="detail-item">
                        <span className="label">Triggered:</span>
                        <span className="value">{reminder.triggerCount} time(s)</span>
                      </div>
                    )}

                    {/* Created Date */}
                    {reminder.createdAt && (
                      <div className="detail-item">
                        <span className="label">Created:</span>
                        <span className="value">{new Date(reminder.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Next Trigger for Repeating */}
                    {reminder.nextTrigger && reminder.isRepeating && (
                      <div className="detail-item">
                        <span className="label">Next:</span>
                        <span className="value">{new Date(reminder.nextTrigger).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Client Details Box - Always show if we have any client information */}
                  {(reminder.clientName || reminder.leadName || reminder.phone || reminder.email || reminder.location) && (
                    <div className="client-details-box">
                      <h4>Client Information</h4>
                      <div className="detail-item">
                        <span className="label">Name:</span>
                        <span className="value">
                          {reminder.clientName || reminder.leadName || 'Not specified'}
                        </span>
                      </div>
                      {reminder.phone && (
                        <div className="detail-item">
                          <span className="label">Phone:</span>
                          <span className="value">{reminder.phone}</span>
                        </div>
                      )}
                      {reminder.email && (
                        <div className="detail-item">
                          <span className="label">Email:</span>
                          <span className="value">{reminder.email}</span>
                        </div>
                      )}
                      {reminder.location && (
                        <div className="detail-item">
                          <span className="label">Location:</span>
                          <span className="value">{reminder.location}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Previous Completion History - Full Width */}
                {reminder.completionResponse && (
                  <div className="completion-history-box modal-content-full">
                    <h4>Previous Response</h4>
                    <div className="detail-item">
                      <span className="label">Completed:</span>
                      <span className="value">
                        {reminder.completedAt ? new Date(reminder.completedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Response:</span>
                      <div className="value response-text">{reminder.completionResponse}</div>
                    </div>
                    <div className="detail-item">
                      <span className="label">Word Count:</span>
                      <span className={`value response-${reminder.responseColor}`}>
                        {reminder.responseWordCount} words
                      </span>
                    </div>
                  </div>
                )}



                {/* Completion Section - Only show for real reminders (not test reminders) */}
                {reminder.assignmentType && (
                  <div className="completion-section">
                    <label className="completion-label">
                      Complete with Response:
                    </label>
                    <textarea
                      className={`completion-textarea ${getResponseColorClass(getWordCount(completionResponses[reminder._id] || ''))}`}
                      value={completionResponses[reminder._id] || ''}
                      onChange={(e) => updateCompletionResponse(reminder._id, e.target.value)}
                      ref={(el) => { textareaRefs.current[reminder._id] = el; }}
                      onKeyDown={(e) => handleKeyDown(e, reminder._id)}
                      placeholder="Enter your response (minimum 10 words recommended)..."
                      rows="3"
                    />
                    <div className={`word-count ${getResponseColorClass(getWordCount(completionResponses[reminder._id] || ''))}`}>
                      Words: {getWordCount(completionResponses[reminder._id] || '')}
                      {getWordCount(completionResponses[reminder._id] || '') < 10 && <span className="word-warning"> (Less than 10 words)</span>}
                      {getWordCount(completionResponses[reminder._id] || '') >= 10 && getWordCount(completionResponses[reminder._id] || '') <= 20 && <span className="word-okay"> (Good length)</span>}
                      {getWordCount(completionResponses[reminder._id] || '') > 20 && <span className="word-excellent"> (Excellent detail)</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              {/* Complete Button - Only show for real reminders */}
              {reminder.assignmentType && (
                <button 
                  className="square-btn complete-btn-primary"
                  onClick={() => completeReminder(reminder._id)}
                  disabled={!completionResponses[reminder._id]?.trim() || isCompleting[reminder._id]}
                >
                  <CheckCircle size={16} />
                  {isCompleting[reminder._id] ? 'Completing...' : 'Complete'}
                </button>
              )}

              <div className="snooze-buttons">
                <button 
                  className="square-btn snooze-btn"
                  onClick={() => snoozeReminder(reminder._id, 15)}
                  title="Snooze for 15 minutes"
                >
                  <Clock3 size={16} />
                  15m
                </button>
                <button 
                  className="square-btn snooze-btn"
                  onClick={() => snoozeReminder(reminder._id, 30)}
                  title="Snooze for 30 minutes"
                >
                  <Clock3 size={16} />
                  30m
                </button>
                <button 
                  className="square-btn snooze-btn"
                  onClick={() => snoozeReminder(reminder._id, 60)}
                  title="Snooze for 1 hour"
                >
                  <Clock3 size={16} />
                  1hr
                </button>
              </div>

              <button 
                className="square-btn dismiss-btn-primary"
                onClick={() => reminder.assignmentType ? dismissReminder(reminder._id) : closeReminder(reminder._id)}
              >
                {reminder.assignmentType ? 'Dismiss' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Close all floating button if multiple reminders */}
      {activeReminders.length > 1 && (
        <div className="floating-close-all">
          <button 
            className="close-all-button"
            onClick={closeAllReminders}
            title="Close all reminders"
          >
            Close All ({activeReminders.length})
          </button>
        </div>
      )}

          <div className="detail-modal full-details-modal">
            <div className="detail-modal-header">
              <h2>🔍 Complete Reminder Details</h2>
              <button className="modal-close-btn" onClick={closeDetailViews}>
                <X size={24} />
              </button>
            </div>
            <div className="detail-modal-body">
              <div className="full-details-content">
                <h3>📝 Reminder Content</h3>
                <p><strong>Title:</strong> {selectedReminder.title || 'No title'}</p>
                <p><strong>Description:</strong> {selectedReminder.description || 'No description'}</p>
                <p><strong>Comment:</strong> {selectedReminder.comment || 'No comment'}</p>

                <h3>⚙️ Technical Details</h3>
                <p><strong>Reminder ID:</strong> <code>{selectedReminder._id}</code></p>
                <p><strong>Assignment ID:</strong> <code>{selectedReminder.assignmentId}</code></p>
                <p><strong>Employee ID:</strong> <code>{selectedReminder.employeeId || 'N/A'}</code></p>

                <h3>🔄 Status & Settings</h3>
                <p><strong>Status:</strong> {selectedReminder.status || 'pending'}</p>
                <p><strong>Is Repeating:</strong> {selectedReminder.isRepeating ? 'Yes' : 'No'}</p>
                <p><strong>Repeat Type:</strong> {selectedReminder.repeatType || 'N/A'}</p>
                <p><strong>Is Active:</strong> {selectedReminder.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Snooze Count:</strong> {selectedReminder.snoozeCount || 0}</p>
                <p><strong>Trigger Count:</strong> {selectedReminder.triggerCount || 0}</p>

                <h3>� Timestamps</h3>
                <p><strong>Created:</strong> {selectedReminder.createdAt ? new Date(selectedReminder.createdAt).toLocaleString() : 'N/A'}</p>
                <p><strong>Due Time:</strong> {selectedReminder.reminderDateTime ? new Date(selectedReminder.reminderDateTime).toLocaleString() : 'N/A'}</p>
                <p><strong>Next Trigger:</strong> {selectedReminder.nextTrigger ? new Date(selectedReminder.nextTrigger).toLocaleString() : 'N/A'}</p>

                <h3>📊 Completion History</h3>
                {selectedReminder.completionResponse ? (
                  <div>
                    <p><strong>Completed At:</strong> {selectedReminder.completedAt ? new Date(selectedReminder.completedAt).toLocaleString() : 'N/A'}</p>
                    <p><strong>Response:</strong> {selectedReminder.completionResponse}</p>
                    <p><strong>Word Count:</strong> {selectedReminder.responseWordCount} words</p>
                  </div>
                ) : (
                  <p>No completion history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalReminderPopup;