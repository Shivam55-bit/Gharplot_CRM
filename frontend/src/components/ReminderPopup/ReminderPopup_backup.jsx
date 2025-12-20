import React, { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, X, Clock3, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig.jsx';
import HTMLRenderer from '../HTMLRenderer/HTMLRenderer.jsx';
import './ReminderPopup.css';

const ReminderPopup = () => {
  const [dueReminders, setDueReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [completionResponse, setCompletionResponse] = useState('');
  const [responseColor, setResponseColor] = useState('red');
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Check for due reminders frequently for immediate response
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const token = localStorage.getItem('employeeToken');
        if (!token) {
          console.log('⚠️ No employee token found - skipping reminder check');
          return;
        }

        const checkTime = new Date();
        console.log('🔍 Checking for due reminders at:', checkTime.toLocaleTimeString());
        setLastCheckTime(checkTime);
        
        const response = await axios.get(`${API_BASE_URL}/employee/reminders/due`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('🔍 API RESPONSE:', response.data);
        
        if (response.data.success && response.data.data.length > 0) {
          console.log('📋 DUE REMINDERS RECEIVED:', response.data.data.length);
          console.log('📋 FIRST REMINDER DETAILS:', JSON.stringify(response.data.data[0], null, 2));
          console.log('📋 COMMENT FIELD IN FIRST REMINDER:', response.data.data[0].comment);
          
          setDueReminders(response.data.data);
          
          // Show first reminder if none is currently active
          if (!activeReminder && response.data.data.length > 0) {
            console.log('✅ Setting active reminder:', response.data.data[0].title);
            setActiveReminder(response.data.data[0]);
          }
        } else {
          console.log('📋 NO DUE REMINDERS OR API FAILED:', response.data);
          // Clear active reminder if no due reminders
          if (dueReminders.length === 0 && activeReminder) {
            setActiveReminder(null);
          }
        }
      } catch (error) {
        console.error('❌ Error checking reminders:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
      }
    };

    // Initial check immediately
    checkReminders();

    // Set up interval to check every 5 seconds for immediate response
    const interval = setInterval(checkReminders, 5000);

    return () => clearInterval(interval);
  }, [activeReminder]);

  // Update response color based on word count
  useEffect(() => {
    const words = completionResponse.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    if (wordCount < 10) {
      setResponseColor('red');
    } else if (wordCount >= 10 && wordCount <= 20) {
      setResponseColor('yellow');
    } else {
      setResponseColor('green');
    }
  }, [completionResponse]);

  const handleCompleteReminder = async () => {
    if (!activeReminder || !completionResponse.trim()) return;

    setIsCompleting(true);
    try {
      const token = localStorage.getItem('employeeToken');
      await axios.put(
        `${API_BASE_URL}/employee/reminders/complete/${activeReminder._id}`,
        { response: completionResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove completed reminder from due list
      setDueReminders(prev => prev.filter(r => r._id !== activeReminder._id));
      
      // Show next reminder or close popup
      const nextReminder = dueReminders.find(r => r._id !== activeReminder._id);
      if (nextReminder) {
        setActiveReminder(nextReminder);
        setCompletionResponse('');
      } else {
        setActiveReminder(null);
        setCompletionResponse('');
      }

    } catch (error) {
      console.error('Error completing reminder:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSnoozeReminder = async (minutes = 15) => {
    if (!activeReminder) return;

    try {
      const token = localStorage.getItem('employeeToken');
      await axios.put(
        `${API_BASE_URL}/employee/reminders/snooze/${activeReminder._id}`,
        { snoozeMinutes: minutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove snoozed reminder from due list
      setDueReminders(prev => prev.filter(r => r._id !== activeReminder._id));
      
      // Show next reminder or close popup
      const nextReminder = dueReminders.find(r => r._id !== activeReminder._id);
      if (nextReminder) {
        setActiveReminder(nextReminder);
      } else {
        setActiveReminder(null);
      }

    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const handleDismissReminder = async () => {
    if (!activeReminder) return;

    try {
      const token = localStorage.getItem('employeeToken');
      await axios.put(
        `${API_BASE_URL}/employee/reminders/dismiss/${activeReminder._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove dismissed reminder from due list
      setDueReminders(prev => prev.filter(r => r._id !== activeReminder._id));
      
      // Show next reminder or close popup
      const nextReminder = dueReminders.find(r => r._id !== activeReminder._id);
      if (nextReminder) {
        setActiveReminder(nextReminder);
      } else {
        setActiveReminder(null);
      }

    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWordCount = () => {
    return completionResponse.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getResponseColorClass = () => {
    const wordCount = getWordCount();
    if (wordCount < 10) return 'response-red';
    if (wordCount >= 10 && wordCount <= 20) return 'response-yellow';
    return 'response-green';
  };

  // Debug panel (remove in production)
  if (!activeReminder) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        🔔 Reminder System Active<br/>
        Last Check: {lastCheckTime ? lastCheckTime.toLocaleTimeString() : 'Not yet'}<br/>
        Due Reminders: {dueReminders.length}<br/>
        Status: Monitoring...
      </div>
    );
  }

  console.log('🔔 ACTIVE REMINDER DATA:', JSON.stringify(activeReminder, null, 2));
  console.log('🔔 COMMENT FIELD:', activeReminder.comment);
  console.log('🔔 NOTE FIELD:', activeReminder.note);
  console.log('🔔 INSTRUCTIONS FIELD:', activeReminder.instructions);
  console.log('🔔 ALL POSSIBLE TEXT FIELDS:', {
    comment: activeReminder.comment,
    title: activeReminder.title,
    description: activeReminder.description,
    note: activeReminder.note,
    details: activeReminder.details,
    instructions: activeReminder.instructions,
    content: activeReminder.content
  });
  console.log('🔔 CLIENT FIELDS:', {
    clientName: activeReminder.clientName,
    phone: activeReminder.phone, 
    email: activeReminder.email,
    location: activeReminder.location,
    assignmentId: activeReminder.assignmentId,
    assignmentType: activeReminder.assignmentType
  });

  return (
    <div className="reminder-popup-overlay">
      <div className="reminder-popup">
        <div className="reminder-header">
          <div className="reminder-title">
            <Bell size={20} className="reminder-icon" />
            <span>Reminder Alert</span>
            {dueReminders.length > 1 && (
              <span className="reminder-count">{dueReminders.length} due</span>
            )}
          </div>
          <button className="reminder-close" onClick={() => setActiveReminder(null)}>
            <X size={18} />
          </button>
        </div>

        <div className="reminder-body">
          <div className="reminder-info">
            <h4 className="reminder-name">{activeReminder.title || 'No Title'}</h4>
            

            
            {/* Display comment with HTML formatting */}
            <div className="reminder-comment-display" style={{
              marginBottom: '20px',
              padding: '20px',
              background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
              border: '3px solid #ffc107',
              borderRadius: '12px',
              boxShadow: '0 6px 20px rgba(255, 193, 7, 0.25)',
              minHeight: '100px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#d4691a', 
                marginBottom: '15px',
                borderBottom: '2px solid #ffc107',
                paddingBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                📋 INSTRUCTIONS
              </div>
              
              {/* Use HTMLRenderer component for proper HTML rendering */}
              {activeReminder.comment ? (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  minHeight: '50px',
                  wordBreak: 'break-word'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '10px', 
                      fontFamily: 'monospace',
                      background: '#f0f0f0',
                      padding: '5px',
                      borderRadius: '3px'
                    }}>
                      DEBUG - Raw content: {JSON.stringify(activeReminder.comment)}
                    </div>
                  <div 
                    className="reminder-html-content"
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.7',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    {(() => {
                      // DIRECT dangerouslySetInnerHTML approach - most reliable
                      let htmlContent = activeReminder.comment;
                      
                      // Decode HTML entities
                      htmlContent = htmlContent
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"');
                      
                      console.log('� Final HTML to render:', htmlContent);
                      
                      // Create a temporary div to parse HTML and convert to React elements
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = htmlContent;
                      
                      // Convert DOM nodes to React elements
                      const convertNodeToReact = (node, key = 0) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                          return node.textContent;
                        }
                        
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const tagName = node.tagName.toLowerCase();
                          const style = {};
                          
                          // Handle different HTML tags
                          if (tagName === 'b' || tagName === 'strong') {
                            style.fontWeight = 'bold';
                            style.color = '#000';
                          } else if (tagName === 'span') {
                            // Parse inline styles
                            const bgColor = node.style.backgroundColor;
                            if (bgColor) {
                              style.backgroundColor = bgColor;
                              style.color = '#fff';
                              style.padding = '4px 8px';
                              style.borderRadius = '4px';
                              style.margin = '0 2px';
                              style.fontWeight = 'bold';
                            }
                          } else if (tagName === 'font') {
                            // Handle font color attribute
                            const color = node.getAttribute('color');
                            if (color) {
                              style.color = color;
                              style.fontWeight = 'bold';
                            }
                          }
                          
                          // Convert children
                          const children = Array.from(node.childNodes).map((child, index) =>
                            convertNodeToReact(child, `${key}-${index}`)
                          );
                          
                          return React.createElement(
                            tagName === 'font' ? 'span' : tagName,
                            { key: key, style: style },
                            children.length === 1 ? children[0] : children
                          );
                        }
                        
                        return null;
                      };
                      
                      // Convert all child nodes
                      const reactElements = Array.from(tempDiv.childNodes).map((node, index) =>
                        convertNodeToReact(node, index)
                      );
                      
                      console.log('✅ Converted React elements:', reactElements);
                      
                      return reactElements.length > 0 ? reactElements : htmlContent;
                    })()}
                  </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '15px', 
                  fontStyle: 'italic', 
                  color: '#666',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  No comment available for this reminder
                </div>
              )}
            </div>
            
            <div className="reminder-details">
              <div className="detail-section-header">
                <strong>📝 Additional Information:</strong>
              </div>
              <div style={{ 
                marginTop: '10px', 
                fontSize: '14px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                This reminder was created for follow-up purposes. Please complete the required response below.
              </div>
            </div>
            
            <div className="reminder-meta">
              <div className="meta-section">
                <div className="meta-header">
                  <strong>⏰ Reminder Information:</strong>
                </div>
                <div className="meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">📅 Due Date:</span>
                    <span className="meta-value">{new Date(activeReminder.reminderDateTime).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">⏰ Due Time:</span>
                    <span className="meta-value">{new Date(activeReminder.reminderDateTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📋 Type:</span>
                    <span className="meta-value">
                      {activeReminder.assignmentType === 'LeadAssignment' ? 'Client Lead' : 
                       activeReminder.assignmentType === 'UserLeadAssignment' ? 'User Lead' : 'General'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">🔄 Status:</span>
                    <span className="meta-value" style={{ 
                      color: activeReminder.status === 'pending' ? '#dc3545' : 
                             activeReminder.status === 'completed' ? '#28a745' : '#ffc107',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {activeReminder.status}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📅 Created:</span>
                    <span className="meta-value">{new Date(activeReminder.createdAt).toLocaleDateString()}</span>
                  </div>
                  {activeReminder.isRepeating && (
                    <div className="meta-item">
                      <span className="meta-label">🔁 Repeats:</span>
                      <span className="meta-value" style={{ color: '#17a2b8', fontWeight: '600' }}>
                        {activeReminder.repeatType}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Details */}
            {(() => {
              // Try to get client info from direct fields or from populated assignment
              const clientName = activeReminder.clientName || 
                                activeReminder.assignmentId?.userId?.fullName ||
                                'N/A';
              const phone = activeReminder.phone || 
                           activeReminder.assignmentId?.userId?.phone ||
                           null;
              const email = activeReminder.email || 
                           activeReminder.assignmentId?.userId?.email ||
                           null;
              const location = activeReminder.location || 
                              (activeReminder.assignmentId?.userId ? 
                                [
                                  activeReminder.assignmentId.userId.street,
                                  activeReminder.assignmentId.userId.city,
                                  activeReminder.assignmentId.userId.state
                                ].filter(Boolean).join(', ') 
                              : null);

              // Show client details if we have any information
              if (clientName !== 'N/A' || phone || email || location) {
                return (
                  <div className="reminder-client-details">
                    <div className="client-header">
                      <strong>👤 Client Information</strong>
                    </div>
                    <div className="client-info-grid">
                      {clientName !== 'N/A' && (
                        <div className="client-detail-item">
                          <span className="client-label">👤 Name:</span>
                          <span className="client-value">{clientName}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="client-detail-item">
                          <span className="client-label">📱 Phone:</span>
                          <span className="client-value">
                            <a href={`tel:${phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                              {phone}
                            </a>
                          </span>
                        </div>
                      )}
                      {email && (
                        <div className="client-detail-item">
                          <span className="client-label">📧 Email:</span>
                          <span className="client-value">
                            <a href={`mailto:${email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                              {email}
                            </a>
                          </span>
                        </div>
                      )}
                      {location && (
                        <div className="client-detail-item full-width">
                          <span className="client-label">📍 Location:</span>
                          <span className="client-value">{location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="reminder-client-details">
                    <div className="client-header">
                      <strong>👤 Client Information</strong>
                    </div>
                    <div className="no-client-info">
                      <span style={{ fontStyle: 'italic', color: '#6c757d' }}>
                        No client information available for this reminder
                      </span>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Assignment context */}
            {activeReminder.assignmentId && (
              <div className="reminder-assignment">
                <strong>Related to:</strong>
                {activeReminder.assignmentType === 'LeadAssignment' ? (
                  <span> Enquiry Lead - {activeReminder.assignmentId.inquiryId?.title || 'Lead'}</span>
                ) : (
                  <span> Client Lead Assignment</span>
                )}
              </div>
            )}
          </div>

          <div className="reminder-actions">
            <div className="completion-section">
              <label className="completion-label">
                Complete with Response:
              </label>
              <textarea
                className={`completion-textarea ${getResponseColorClass()}`}
                value={completionResponse}
                onChange={(e) => setCompletionResponse(e.target.value)}
                placeholder="Enter your response (minimum 10 words recommended)..."
                rows="3"
              />
              <div className={`word-count ${getResponseColorClass()}`}>
                Words: {getWordCount()}
                {getWordCount() < 10 && <span className="word-warning"> (Less than 10 words)</span>}
                {getWordCount() >= 10 && getWordCount() <= 20 && <span className="word-okay"> (Good length)</span>}
                {getWordCount() > 20 && <span className="word-excellent"> (Excellent detail)</span>}
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn-complete"
                onClick={handleCompleteReminder}
                disabled={!completionResponse.trim() || isCompleting}
              >
                <CheckCircle size={16} />
                {isCompleting ? 'Completing...' : 'Complete'}
              </button>

              <div className="snooze-buttons">
                <button className="btn-snooze" onClick={() => handleSnoozeReminder(15)}>
                  <Clock3 size={16} />
                  15min
                </button>
                <button className="btn-snooze" onClick={() => handleSnoozeReminder(30)}>
                  <Clock3 size={16} />
                  30min
                </button>
                <button className="btn-snooze" onClick={() => handleSnoozeReminder(60)}>
                  <Clock3 size={16} />
                  1hr
                </button>
              </div>

              <button className="btn-dismiss" onClick={handleDismissReminder}>
                {activeReminder.isRepeating ? 'Turn Off' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderPopup;