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
          console.log('📋 CLIENT NAME FIELDS:', {
            clientName: response.data.data[0].clientName,
            name: response.data.data[0].name,
            assignmentId: response.data.data[0].assignmentId,
            assignmentType: response.data.data[0].assignmentType
          });
          
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

  const getWordCount = () => {
    return completionResponse.trim().split(/\s+/).filter(word => word.length > 0).length;
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
        <div style={{ padding: '30px', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' }}>
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
              border: '4px solid #ffc107',
              borderRadius: '15px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 15px 30px rgba(255, 193, 7, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '22px',
                fontWeight: '800',
                color: '#856404',
                marginBottom: '25px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}>
                📝 INSTRUCTIONS
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '25px',
                borderRadius: '12px',
                border: '2px solid #ffc107',
                fontSize: '20px',
                lineHeight: '1.6',
                minHeight: '80px',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
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
              
              {/* Debug Info - Remove in production */}
              <div style={{ 
                fontSize: '10px', 
                backgroundColor: '#f1f1f1', 
                padding: '5px', 
                marginBottom: '10px',
                fontFamily: 'monospace',
                borderRadius: '3px',
                color: '#666',
                maxHeight: '100px',
                overflow: 'auto'
              }}>
                <div><strong>All Reminder Fields:</strong></div>
                <div>clientName: "{activeReminder.clientName}"</div>
                <div>name: "{activeReminder.name}"</div>
                <div>phone: "{activeReminder.phone}"</div>
                <div>email: "{activeReminder.email}"</div>
                <div>location: "{activeReminder.location}"</div>
                <div>assignmentType: "{activeReminder.assignmentType}"</div>
                <div>assignmentId: {activeReminder.assignmentId ? 'has data' : 'null'}</div>
                <div>title: "{activeReminder.title}"</div>
                <div>Available Keys: [{Object.keys(activeReminder).join(', ')}]</div>
                <div><strong>SCHEMA CHECK:</strong> Using {activeReminder.clientName ? 'NEW SCHEMA' : 'OLD SCHEMA'}</div>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <div><strong>Name:</strong></div>
                <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                  {activeReminder.name || 
                   activeReminder.clientName || 
                   activeReminder.assignmentId?.userId?.fullName || 
                   activeReminder.assignmentId?.userId?.name ||
                   activeReminder.client?.name ||
                   activeReminder.client?.fullName ||
                   (activeReminder.title && activeReminder.title.includes('Follow up with') ? 
                     activeReminder.title.replace('Follow up with ', '') : null) ||
                   (activeReminder.email && activeReminder.email.split('@')[0]) ||
                   (activeReminder.phone && `Client (${activeReminder.phone})`) ||
                   'Name not provided'}
                </div>
                
                <div><strong>Phone:</strong></div>
                <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                  {activeReminder.phone || 
                   activeReminder.assignmentId?.userId?.phone || 
                   activeReminder.client?.phone ||
                   'Phone not available'}
                </div>
                
                {(activeReminder.email || activeReminder.assignmentId?.userId?.email) && (
                  <>
                    <div><strong>Email:</strong></div>
                    <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                      {activeReminder.email || activeReminder.assignmentId?.userId?.email}
                    </div>
                  </>
                )}
                
                {(activeReminder.location || 
                  activeReminder.assignmentId?.userId?.city || 
                  activeReminder.assignmentId?.userId?.street) && (
                  <>
                    <div><strong>Location:</strong></div>
                    <div style={{ color: '#6c757d' }}>
                      {activeReminder.location || 
                       `${activeReminder.assignmentId?.userId?.street || ''} ${activeReminder.assignmentId?.userId?.city || ''} ${activeReminder.assignmentId?.userId?.state || ''} ${activeReminder.assignmentId?.userId?.pinCode || ''}`.trim()}
                    </div>
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
};

export default ReminderPopup;