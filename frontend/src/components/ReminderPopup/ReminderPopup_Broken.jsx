import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, CheckCircle, X, Clock3, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig.jsx';
import SimpleHTMLRenderer from '../SimpleHTMLRenderer.jsx';
import './ReminderPopup.css';

const ReminderPopup = () => {
  const [dueReminders, setDueReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [completionResponse, setCompletionResponse] = useState('');
  const [responseColor, setResponseColor] = useState('red');
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const htmlContentRef = useRef(null);

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

  // Direct DOM manipulation to set HTML content with immediate manual decoding
  useEffect(() => {
    if (htmlContentRef.current && activeReminder?.comment) {
      console.log('🎯 Raw content from backend:', activeReminder.comment);
      
      // IMMEDIATE manual entity decode - no waiting
      console.log('� FORCE DECODE - Manual entity replacement:');
      let decodedContent = activeReminder.comment
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      console.log('🔥 Decoded content:', decodedContent);
      console.log('🔥 Contains &nbsp;?', decodedContent.includes('&nbsp;'));
      
      // Set innerHTML with decoded content
      htmlContentRef.current.innerHTML = decodedContent;
    }
  }, [activeReminder?.comment]);

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '3px solid #f39c12'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f39c12, #e67e22)',
          color: 'white',
          padding: '20px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Bell size={24} />
            <span style={{ fontSize: '22px', fontWeight: '700' }}>Reminder Alert</span>
          </div>
          <button 
            onClick={() => setActiveReminder(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '30px' }}>
          {/* Date */}
          <div style={{
            textAlign: 'center',
            fontSize: '16px',
            color: '#7f8c8d',
            marginBottom: '20px'
          }}>
            {new Date(activeReminder.reminderDateTime).toLocaleString()}
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#2c3e50',
            textAlign: 'center',
            margin: '0 0 30px 0'
          }}>
            {activeReminder.title || 'Reminder'}
          </h2>

          {/* Notes Section - BIG & PROMINENT */}
          {activeReminder.comment && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '3px solid #ffc107',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '30px',
              boxShadow: '0 8px 25px rgba(255, 193, 7, 0.2)'
            }}>
              <div style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#856404',
                marginBottom: '20px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                📝 Instructions
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #ffc107',
                fontSize: '18px',
                lineHeight: '1.6',
                minHeight: '60px'
              }}>
                <SimpleHTMLRenderer htmlContent={activeReminder.comment} />
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              border: '2px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Reminder Details</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <div><strong>Type:</strong></div>
                <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                  {activeReminder.assignmentType === 'LeadAssignment' ? 'Client Lead' : 'General'}
                </div>
                <div><strong>Status:</strong></div>
                <div style={{ 
                  color: activeReminder.status === 'pending' ? '#dc3545' : '#28a745',
                  textTransform: 'capitalize',
                  fontWeight: '600'
                }}>
                  {activeReminder.status}
                </div>
                <div style={{ marginTop: '10px' }}><strong>Created:</strong></div>
                <div style={{ color: '#6c757d' }}>
                  {new Date(activeReminder.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              border: '2px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Client Information</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <div><strong>Name:</strong></div>
                <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                  {activeReminder.clientName || 'Unknown Client'}
                </div>
                {activeReminder.location && (
                  <>
                    <div><strong>Location:</strong></div>
                    <div style={{ color: '#6c757d' }}>{activeReminder.location}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Response Section */}
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '25px',
            borderRadius: '10px',
            border: '2px solid #2196f3',
            marginBottom: '25px'
          }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1976d2',
              marginBottom: '15px'
            }}>
              Complete with Response: *
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '15px',
                border: '2px solid #2196f3',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'system-ui, sans-serif',
                resize: 'vertical',
                outline: 'none'
              }}
              value={completionResponse}
              onChange={(e) => setCompletionResponse(e.target.value)}
              placeholder="Enter your response (minimum 10 words recommended)..."
            />
            <div style={{
              marginTop: '10px',
              fontSize: '14px',
              color: getWordCount() < 10 ? '#dc3545' : getWordCount() <= 20 ? '#ffc107' : '#28a745'
            }}>
              Words: {getWordCount()}
              {getWordCount() < 10 && ' (Less than 10 words)'}
              {getWordCount() >= 10 && getWordCount() <= 20 && ' (Good length)'}
              {getWordCount() > 20 && ' (Excellent detail)'}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button 
              onClick={handleCompleteReminder}
              disabled={!completionResponse.trim() || isCompleting}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: completionResponse.trim() ? 'pointer' : 'not-allowed',
                opacity: completionResponse.trim() ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle size={18} />
              {isCompleting ? 'Completing...' : 'Complete'}
            </button>

            <button 
              onClick={() => handleSnoozeReminder(15)}
              style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Snooze 15min
            </button>

            <button 
              onClick={() => handleSnoozeReminder(30)}
              style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Snooze 30min
            </button>

            <button 
              onClick={handleDismissReminder}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
            <div className="reminder-comment-display" style={{
              marginBottom: '30px',
              padding: '30px',
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 50%, #fdcb6e 100%)',
              border: '4px solid #f39c12',
              borderRadius: '20px',
              boxShadow: '0 15px 35px rgba(243, 156, 18, 0.3), inset 0 2px 5px rgba(255, 255, 255, 0.5)',
              minHeight: '200px',
              maxHeight: '500px',
              overflowY: 'auto',
              position: 'relative',
              transform: 'scale(1.02)',
              transition: 'all 0.3s ease'
            }}>
              {/* Enhanced Header with Icon Animation */}
              <div style={{ 
                fontSize: '20px', 
                fontWeight: '800', 
                color: '#d35400', 
                marginBottom: '25px',
                borderBottom: '3px solid #f39c12',
                paddingBottom: '15px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                background: 'linear-gradient(90deg, #d35400, #e67e22)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                position: 'relative'
              }}>
                <span style={{ 
                  fontSize: '24px', 
                  marginRight: '10px',
                  animation: 'bounce 1s infinite alternate'
                }}>📋</span>
                IMPORTANT INSTRUCTIONS
                <span style={{ 
                  fontSize: '24px', 
                  marginLeft: '10px',
                  animation: 'bounce 1s infinite alternate'
                }}>📋</span>
              </div>
              
              {/* Enhanced Content Area */}
              {activeReminder.comment ? (
                <div style={{
                  padding: '25px',
                  backgroundColor: '#ffffff',
                  borderRadius: '15px',
                  border: '2px solid #f39c12',
                  minHeight: '120px',
                  wordBreak: 'break-word',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  fontSize: '18px',
                  lineHeight: '1.8',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative Corner Elements */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    clipPath: 'polygon(0 0, 100% 0, 0 100%)'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
                  }}></div>
                  
                  {/* Content with Enhanced Styling */}
                  <div style={{ 
                    position: 'relative', 
                    zIndex: 1,
                    fontSize: '19px',
                    fontWeight: '500'
                  }}>
                    <SimpleHTMLRenderer htmlContent={activeReminder.comment} />
                  </div>
                  
                  {/* Bottom Decorative Elements */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    clipPath: 'polygon(0 100%, 100% 100%, 0 0)'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                    clipPath: 'polygon(100% 100%, 100% 0, 0 100%)'
                  }}></div>
                </div>
              ) : (
                <div style={{ 
                  padding: '30px', 
                  fontStyle: 'italic', 
                  color: '#7f8c8d',
                  textAlign: 'center',
                  backgroundColor: '#ecf0f1',
                  borderRadius: '15px',
                  fontSize: '18px',
                  border: '2px dashed #bdc3c7'
                }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>📝</span>
                  No specific instructions provided for this reminder
                </div>
              )}
              
              {/* Animated Border Effect */}
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                background: 'linear-gradient(45deg, #f39c12, #e67e22, #d35400, #f39c12)',
                borderRadius: '22px',
                zIndex: '-1',
                backgroundSize: '400% 400%',
                animation: 'gradientShift 3s ease infinite'
              }}></div>
            </div>

            {/* Add CSS Animation Keyframes */}
            <style jsx>{`
              @keyframes bounce {
                0% { transform: translateY(0px); }
                100% { transform: translateY(-5px); }
              }
              
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
            
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