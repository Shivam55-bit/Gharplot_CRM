import React, { useState, useEffect, useRef } from 'react';
import { Clock3, X, Bell, CheckCircle, AlertTriangle, Repeat, Calendar } from 'lucide-react';
import globalReminderService from '../../services/GlobalReminderService';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig.jsx';
import SimpleHTMLRenderer from '../SimpleHTMLRenderer.jsx';
import './GlobalReminderPopup.css';

const GlobalReminderPopup = ({ token }) => {
  const [activeReminders, setActiveReminders] = useState([]);
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [completionResponses, setCompletionResponses] = useState({});
  const [isCompleting, setIsCompleting] = useState({});
  const [isSettingRepeat, setIsSettingRepeat] = useState({});
  const audioRef = useRef(null);
  const textareaRefs = useRef({}); // refs per reminder for autofocus and keyboard

  // Initialize audio for notifications
  useEffect(() => {
    // Create multiple audio elements for reliable playback
    const audio1 = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    const audio2 = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    
    audioRef.current = audio1;
    audioRef.current.volume = 1.0; // Maximum volume
    audioRef.current.preload = 'auto';
    
    // Force load
    audioRef.current.load();
    
    // Try to enable audio on first user interaction
    const enableAudio = () => {
      console.log('🔊 Enabling audio on user interaction...');
      audioRef.current?.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log('✅ Audio enabled successfully!');
      }).catch(e => console.log('Audio enable failed:', e));
    };
    
    // Listen for any user interaction to enable audio
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keypress', enableAudio, { once: true });
    
    console.log('🔊 Audio initialized - Ready to play');
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keypress', enableAudio);
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
    
    // Add to active reminders if not already present
    setActiveReminders(prev => {
      const exists = prev.some(r => r._id === reminder._id);
      console.log('Adding reminder to active list. Already exists:', exists);
      if (!exists) {
        const newReminders = [...prev, { ...reminder, showTime: Date.now() }];
        console.log('New active reminders count:', newReminders.length);
        
        // Play notification sound AFTER adding to state (important!)
        setTimeout(() => {
          console.log('🔊🔊🔊 PLAYING SOUND NOW! 🔊🔊🔊');
          playNotificationSound();
          // Play multiple times to ensure it's heard
          setTimeout(() => playNotificationSound(), 500);
          setTimeout(() => playNotificationSound(), 1000);
        }, 100);
        
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

    // Focus the first reminder's textarea after a brief delay
    const firstReminder = activeReminders[0];
    if (firstReminder && textareaRefs.current[firstReminder._id]) {
      setTimeout(() => {
        textareaRefs.current[firstReminder._id]?.focus();
      }, 100);
    }
  }, [activeReminders.length]);

  // Play notification sound
  const playNotificationSound = () => {
    console.log('🔊🔊🔊 PLAYING NOTIFICATION SOUND 🔊🔊🔊');
    
    if (!audioRef.current) {
      console.error('❌ Audio element not initialized!');
      return;
    }
    
    try {
      // Reset to start
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1.0;
      
      // Play the sound
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅✅✅ SOUND PLAYING SUCCESSFULLY! ✅✅✅');
          })
          .catch(error => {
            console.error('❌ Sound play failed:', error);
            console.log('💡 Attempting fallback sound...');
            
            // Fallback: Create a new audio element and try to play
            const fallbackAudio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
            fallbackAudio.volume = 1.0;
            fallbackAudio.play()
              .then(() => console.log('✅ Fallback sound played!'))
              .catch(e => console.error('❌ Fallback also failed:', e));
          });
      }
    } catch (error) {
      console.error('❌ Exception while playing sound:', error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (reminder) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Reminder Alert", {
        body: reminder.comment || reminder.description || reminder.message || "You have a reminder due",
        icon: "🔔"
      });
    }
  };

  // Close reminder
  const closeReminder = (reminderId) => {
    console.log(`🚫 Closing and dismissing reminder: ${reminderId}`);
    
    // Permanently dismiss this reminder from the service
    globalReminderService.dismissReminder(reminderId);
    
    // Remove from active display
    setActiveReminders(prev => prev.filter(r => r._id !== reminderId));
    delete textareaRefs.current[reminderId];
    setCompletionResponses(prev => {
      const newResponses = { ...prev };
      delete newResponses[reminderId];
      return newResponses;
    });
    setIsCompleting(prev => {
      const newCompleting = { ...prev };
      delete newCompleting[reminderId];
      return newCompleting;
    });
  };

  // Close all reminders
  const closeAllReminders = () => {
    console.log(`🚫 Closing and dismissing all ${activeReminders.length} reminders`);
    
    // Permanently dismiss all active reminders from the service
    activeReminders.forEach(reminder => {
      globalReminderService.dismissReminder(reminder._id);
    });
    
    setActiveReminders([]);
    textareaRefs.current = {};
    setCompletionResponses({});
    setIsCompleting({});
  };

  // Update completion response
  const updateCompletionResponse = (reminderId, response) => {
    setCompletionResponses(prev => ({
      ...prev,
      [reminderId]: response
    }));
  };

  // Get word count
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Get response color class based on word count
  const getResponseColorClass = (wordCount) => {
    if (wordCount < 10) return 'response-red';
    if (wordCount <= 20) return 'response-yellow';
    return 'response-green';
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e, reminderId) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      completeReminder(reminderId);
    }
  };

  // Snooze reminder
  const snoozeReminder = async (reminderId, minutes) => {
    try {
      const reminder = activeReminders.find(r => r._id === reminderId);
      if (!reminder) return;

      console.log(`🔔 Snoozing reminder ${reminderId} for ${minutes} minutes`);

        if (reminder.assignmentType) {
        // Check if it's a test reminder
        if (reminderId.startsWith('test-reminder-')) {
          console.log('🧪 Test reminder detected - simulating snooze without API call');
        } else {
          // Real reminder - make API call
          if (!token) {
            alert('❌ Authentication required. Please log in again.');
            return;
          }

          // Use correct API endpoint: /api/reminder/snooze/:id
          const endpoint = `${API_BASE_URL}/api/reminder/snooze/${reminderId}`;

          console.log('📡 Making snooze API call to:', endpoint);          const result = await axios.put(endpoint, {
            snoozeMinutes: minutes
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('✅ Snooze API Response:', result.data);
        }
      }

      // Remove from active reminders
      closeReminder(reminderId);
      
      console.log(`✅ Reminder snoozed for ${minutes} minutes and removed from active list`);
      alert(`✅ Reminder snoozed for ${minutes} minutes!`);
    } catch (error) {
      console.error('❌ Error snoozing reminder:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || 'Failed to snooze reminder. Please try again.';
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  // Set repeat for reminder (daily/weekly/monthly)
  const setRepeatReminder = async (reminderId, repeatType) => {
    try {
      const reminder = activeReminders.find(r => r._id === reminderId);
      if (!reminder) return;

      console.log(`🔁 Setting repeat ${repeatType} for reminder ${reminderId}`);
      
      setIsSettingRepeat(prev => ({ ...prev, [reminderId]: true }));

      // Check if it's a local/test reminder
      if (reminderId.startsWith('test-reminder-') || reminderId.startsWith('local-')) {
        console.log('🏠 Local reminder detected - updating locally');
        
        // Update local reminder
        setActiveReminders(prev => prev.map(r => 
          r._id === reminderId 
            ? { ...r, isRepeating: true, repeatType: repeatType }
            : r
        ));
        
        // Also update in localStorage
        const localReminders = JSON.parse(localStorage.getItem('localReminders') || '[]');
        const updatedLocalReminders = localReminders.map(r => 
          r._id === reminderId 
            ? { ...r, isRepeating: true, repeatType: repeatType }
            : r
        );
        localStorage.setItem('localReminders', JSON.stringify(updatedLocalReminders));
        
        alert(`✅ Reminder set to repeat ${repeatType}!`);
      } else {
        // Real reminder - use update endpoint
        const authToken = token || localStorage.getItem('token') || localStorage.getItem('employeeToken') || localStorage.getItem('adminToken');
        
        if (!authToken) {
          alert('❌ Authentication required. Please log in again.');
          return;
        }

        // Use the correct API endpoint: /api/reminder/update/:id
        const endpoint = `${API_BASE_URL}/api/reminder/update/${reminderId}`;

        console.log('📡 Making repeat update API call to:', endpoint);

        const result = await axios.put(endpoint, {
          isRepeating: true,
          repeatType: repeatType,
          isActive: true
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Repeat Update API Response:', result.data);
        
        // Update local state
        setActiveReminders(prev => prev.map(r => 
          r._id === reminderId 
            ? { ...r, isRepeating: true, repeatType: repeatType }
            : r
        ));
        
        alert(`✅ Reminder set to repeat ${repeatType}! Will repeat every ${repeatType === 'daily' ? 'day' : repeatType === 'weekly' ? 'week' : 'month'}.`);
      }
    } catch (error) {
      console.error('❌ Error setting repeat:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // If API fails, still update locally for this session
      setActiveReminders(prev => prev.map(r => 
        r._id === reminderId 
          ? { ...r, isRepeating: true, repeatType: repeatType }
          : r
      ));
      
      alert(`✅ Repeat set to ${repeatType} (local only). Backend sync may be pending.`);
    } finally {
      setIsSettingRepeat(prev => ({ ...prev, [reminderId]: false }));
    }
  };

  // Complete reminder
  const completeReminder = async (reminderId) => {
    const response = completionResponses[reminderId];
    if (!response?.trim()) {
      alert('Please enter a response before completing the reminder.');
      // Focus the textarea to help user
      if (textareaRefs.current[reminderId]) {
        textareaRefs.current[reminderId].focus();
      }
      return;
    }

    // Count words in response
    const wordCount = response.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Check if response is less than 10 words
    if (wordCount < 10) {
      console.log('⚠️ Response has less than 10 words, sending BAD ATTENDANT notification to admin');
      
      try {
        // Send notification to admin about bad attendant
        const reminder = activeReminders.find(r => r._id === reminderId);
        
        if (!token) {
          console.error('⚠️ No token found for sending admin notification');
          alert('⚠️ Response too short (less than 10 words). Could not notify admin - you are not logged in.');
        } else {
          console.log('📤 Sending BAD ATTENDANT notification to admin...', {
            reminderId,
            employeeId: reminder?.employeeId,
            wordCount,
            response: response.trim()
          });
          
          // Send to admin notification endpoint
          const notificationResponse = await axios.post(`${API_BASE_URL}/admin/notifications/bad-attendant`, {
            reminderId: reminderId,
            employeeId: reminder?.employeeId,
            reminderTitle: reminder?.title || 'Untitled Reminder',
            clientName: reminder?.clientName || 'Unknown Client',
            response: response.trim(),
            wordCount: wordCount,
            timestamp: new Date().toISOString(),
            severity: 'high',
            zone: 'RED',
            message: `BAD ATTENDANT - Employee provided only ${wordCount} words in reminder response (minimum 10 required)`
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ BAD ATTENDANT notification sent successfully:', notificationResponse.data);
          alert(`⚠️ WARNING: Response too short (${wordCount} words).\n\n✅ Admin has been notified in RED ZONE.\n\nMinimum required: 10 words`);
        }
        
        // Close the reminder immediately
        closeReminder(reminderId);
        return;
      } catch (error) {
        console.error('❌ Error sending bad attendant notification:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        alert(`⚠️ Response too short (${wordCount} words).\n\n❌ Failed to notify admin: ${error.response?.data?.message || error.message}\n\nPlease contact your administrator.`);
        closeReminder(reminderId);
        return;
      }
    }

    setIsCompleting(prev => ({ ...prev, [reminderId]: true }));

    try {
      const reminder = activeReminders.find(r => r._id === reminderId);
      if (!reminder) {
        console.log('Reminder not found in active reminders');
        return;
      }

      console.log('🚀 Completing reminder:', reminderId, 'with response:', response);

      // Check if it's a test reminder
      if (reminderId.startsWith('test-reminder-')) {
        console.log('🧪 Test reminder detected - simulating completion without API call');
      } else {
        // Real reminder - make API call
        if (!token) {
          alert('❌ Authentication required. Please log in again.');
          setIsCompleting(prev => ({ ...prev, [reminderId]: false }));
          return;
        }

        // Use correct API endpoint: /api/reminder/complete/:id
        const endpoint = `${API_BASE_URL}/api/reminder/complete/${reminderId}`;

        console.log('📡 Making complete API call to:', endpoint);
        console.log('📡 Request data:', { response: response.trim() });
        
        const result = await axios.put(endpoint, {
          response: response.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ API Response:', result.data);
      }

      // Remove from active reminders
      closeReminder(reminderId);
      
      console.log('✅ Reminder completed successfully and removed from active list');
      alert('✅ Reminder completed successfully!');
    } catch (error) {
      console.error('❌ Error completing reminder:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Failed to complete reminder. Please try again.';
      alert(`❌ Error: ${errorMessage}`);
      
      setIsCompleting(prev => ({ ...prev, [reminderId]: false }));
    }
  };

  // Dismiss reminder
  const dismissReminder = async (reminderId) => {
    try {
      const reminder = activeReminders.find(r => r._id === reminderId);
      if (!reminder) return;

      console.log(`🚫 Dismissing reminder ${reminderId}`);

      if (reminder.assignmentType) {
        // Check if it's a test reminder
        if (reminderId.startsWith('test-reminder-')) {
          console.log('🧪 Test reminder detected - simulating dismiss without API call');
        } else {
          // Real reminder - make API call
          if (!token) {
            alert('❌ Authentication required. Please log in again.');
            return;
          }

          // Use correct API endpoint: /api/reminder/dismiss/:id
          const endpoint = `${API_BASE_URL}/api/reminder/dismiss/${reminderId}`;

          console.log('📡 Making dismiss API call to:', endpoint);

          const result = await axios.put(endpoint, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('✅ Dismiss API Response:', result.data);
        }
      }

      // Remove from active reminders
      closeReminder(reminderId);
      
      console.log('✅ Reminder dismissed successfully and removed from active list');
      alert('✅ Reminder dismissed!');
    } catch (error) {
      console.error('❌ Error dismissing reminder:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || 'Failed to dismiss reminder. Please try again.';
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  // Format time for display
  const formatTime = (dateTime) => {
    if (!dateTime) return 'No time specified';
    
    // Parse the ISO string - it's stored as proper ISO format
    const isoDate = new Date(dateTime);
    
    // Display in local time format
    const formattedDate = isoDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = isoDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${formattedDate} at ${formattedTime}`;
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
      {/* Service status indicator with sound test button */}
      <div className="reminder-service-status">
        <Bell size={12} />
        <span>{isServiceActive ? 'Active' : 'Inactive'} | {activeReminders.length} reminders</span>
        <button 
          onClick={() => {
            console.log('🔊 Testing notification sound...');
            playNotificationSound();
          }}
          style={{
            marginLeft: '10px',
            padding: '2px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: '#fff'
          }}
          title="Click to test notification sound"
        >
          🔊 Test Sound
        </button>
      </div>

      {/* Square Modal for each reminder */}
      {activeReminders.map((reminder, index) => {
        // Check if user is admin
        const isAdmin = !!localStorage.getItem('adminToken');
        
        // Debug: Log reminder data
        console.log('🔍 RENDERING POPUP - Full Reminder Data:', JSON.stringify(reminder, null, 2));
        console.log('🔍 isAdmin:', isAdmin);
        console.log('🔍 isLocalReminder:', reminder.isLocalReminder);
        console.log('🔍 assignmentType:', reminder.assignmentType);
        console.log('🔍 clientName:', reminder.clientName);
        console.log('🔍 productType:', reminder.productType);
        console.log('🔍 caseStatus:', reminder.caseStatus);
        
        // Show full details if: 
        // 1. Not admin (employee always sees full view)
        // 2. OR it's a local reminder
        // 3. OR it's enquiry type  
        // 4. OR reminder has enquiry-specific data (clientName, productType, etc.)
        const hasEnquiryData = reminder.clientName || reminder.productType || reminder.caseStatus || reminder.serialNumber;
        const showFullDetails = !isAdmin || reminder.isLocalReminder || reminder.assignmentType === 'enquiry' || reminder.assignmentType?.includes('enquiry') || hasEnquiryData;
        console.log('🔍 hasEnquiryData:', hasEnquiryData);
        console.log('🔍 showFullDetails:', showFullDetails);
        
        return (
        <div key={reminder._id} className="reminder-modal-overlay">
          <div 
            className={`reminder-square-modal ${isAdmin ? 'admin-reminder' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '85vh',
              maxHeight: '85vh',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ flex: '0 0 auto' }}>
              <div className="header-content">
                <div className="bell-icon">
                  <Bell size={28} color="#ff6b6b" />
                </div>
                <h3 className="modal-title">{showFullDetails ? 'Enquiry Reminder' : 'Employee Reminder'}</h3>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => closeReminder(reminder._id)}
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - SCROLLABLE */}
            <div 
              className="modal-body"
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                overflowX: 'hidden',
                minHeight: 0
              }}
            >
              {!showFullDetails ? (
                // ADMIN VIEW - Simple format for employee reminders only
                <div className="admin-reminder-content">
                  <div className="admin-reminder-time">
                    <Clock3 size={18} />
                    <span>{formatTime(reminder.reminderDateTime)}</span>
                  </div>
                  
                  <div className="admin-reminder-info">
                    <div className="admin-info-item">
                      <span className="admin-label">👤 Client:</span>
                      <span className="admin-value">
                        {reminder.clientName || 
                         reminder.name || 
                         reminder.client?.name ||
                         reminder.lead?.name ||
                         'N/A'}
                      </span>
                    </div>
                    
                    <div className="admin-info-item">
                      <span className="admin-label">👨‍💼 Employee:</span>
                      <span className="admin-value">{reminder.employeeName || 'Unknown Employee'}</span>
                    </div>

                    {reminder.title && (
                      <div className="admin-info-item">
                        <span className="admin-label">📋 Title:</span>
                        <span className="admin-value">{reminder.title}</span>
                      </div>
                    )}
                    
                    {reminder.comment && (
                      <div className="admin-info-item">
                        <span className="admin-label">💬 Note:</span>
                        <span className="admin-value">{reminder.comment.replace(/<[^>]*>/g, '')}</span>
                      </div>
                    )}
                  </div>

                  <div className="admin-actions">
                    <button 
                      className="admin-btn-dismiss"
                      onClick={() => closeReminder(reminder._id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                // FULL ENQUIRY VIEW - Show all details for enquiry reminders (both admin & employee)
                <>
              <div className="reminder-time-display">
                <Clock3 size={18} />
                <span>{formatTime(reminder.reminderDateTime)}</span>
                {reminder.isLocalReminder && <span style={{marginLeft: '10px', fontSize: '12px', color: '#27ae60'}}>✓ Local</span>}
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
                  {console.log('🔍🔍🔍 REMINDER DATA:', reminder)}
                  {console.log('📝 Comment:', reminder.comment)}
                  {console.log('📝 Description:', reminder.description)}
                  {console.log('📝 Message:', reminder.message)}
                  <SimpleHTMLRenderer 
                    htmlContent={reminder.note || reminder.comment || reminder.description || reminder.message || 'You have a reminder scheduled for this time.'} 
                  />
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
                  
                  {/* Client Details Box - Always show for enquiry reminders */}
                  <div className="client-details-box">
                    <h4>👤 Client Information</h4>
                    <div className="detail-item">
                      <span className="label">Name:</span>
                      <span className="value">
                        {reminder.clientName || reminder.leadName || reminder.name || 'Not specified'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Phone:</span>
                      <span className="value">{reminder.phone || reminder.contactNumber || 'Not specified'}</span>
                    </div>
                    {reminder.email && reminder.email !== 'N/A' && (
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{reminder.email}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="label">Location:</span>
                      <span className="value">{reminder.location || 'Not specified'}</span>
                    </div>
                    {reminder.address && reminder.address !== 'N/A' && (
                      <div className="detail-item">
                        <span className="label">Address:</span>
                        <span className="value">{reminder.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Enquiry Details Box - Always show for enquiry-related reminders */}
                  <div className="enquiry-details-box">
                    <h4>📋 Enquiry Details</h4>
                    {reminder.serialNumber && (
                      <div className="detail-item">
                        <span className="label">S.No:</span>
                        <span className="value">{reminder.serialNumber}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="label">Product Type:</span>
                      <span className="value">{reminder.productType || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Case Status:</span>
                      <span className="value">{reminder.caseStatus || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Source:</span>
                      <span className="value">{reminder.source || 'Not specified'}</span>
                    </div>
                    {reminder.referenceBy && (
                      <div className="detail-item">
                        <span className="label">Reference By:</span>
                        <span className="value">{reminder.referenceBy}</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Details Box - 4th Column */}
                  <div className="additional-details-box">
                    <h4>📌 Additional Info</h4>
                    {reminder.clientCode && (
                      <div className="detail-item">
                        <span className="label">Client Code:</span>
                        <span className="value">{reminder.clientCode}</span>
                      </div>
                    )}
                    {reminder.projectCode && (
                      <div className="detail-item">
                        <span className="label">Project Code:</span>
                        <span className="value">{reminder.projectCode}</span>
                      </div>
                    )}
                    {reminder.budget && (
                      <div className="detail-item">
                        <span className="label">Budget:</span>
                        <span className="value">{reminder.budget}</span>
                      </div>
                    )}
                    {reminder.subLocation && (
                      <div className="detail-item">
                        <span className="label">Sub Location:</span>
                        <span className="value">{reminder.subLocation}</span>
                      </div>
                    )}
                    {reminder.majorComments && (
                      <div className="detail-item">
                        <span className="label">Major Comments:</span>
                        <span className="value">{reminder.majorComments}</span>
                      </div>
                    )}
                    {reminder.note && (
                      <div className="detail-item">
                        <span className="label">Action Plan:</span>
                        <span className="value">{reminder.note}</span>
                      </div>
                    )}
                    {reminder.employeeName && (
                      <div className="detail-item">
                        <span className="label">Assigned To:</span>
                        <span className="value">{reminder.employeeName}</span>
                      </div>
                    )}
                  </div>
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

                {/* Completion Section - Always show for all reminders */}
                <div className="completion-section">
                  <label className="completion-label">
                    Complete with Response: <span className="required-star">*</span>
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
              </div>
              </>
              )}
            </div>

            {/* Modal Footer - OUTSIDE modal-body for proper scrolling */}
            <div className="modal-footer" style={{ flex: '0 0 auto' }}>
              {/* Complete Button - Always show for all reminders */}
              <button 
                className="square-btn complete-btn-primary"
                onClick={() => completeReminder(reminder._id)}
                disabled={!completionResponses[reminder._id]?.trim() || isCompleting[reminder._id]}
                title={!completionResponses[reminder._id]?.trim() ? "Please enter a response before completing" : "Complete reminder with response"}
              >
                <CheckCircle size={16} />
                {isCompleting[reminder._id] ? 'Completing...' : 'Complete'}
              </button>

              {/* Snooze Buttons */}
              {/* <div className="snooze-buttons">
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
              </div> */}

              {/* Repeat Buttons - Daily/Weekly/Monthly */}
              <div className="repeat-buttons">
                <span className="repeat-label"><Repeat size={14} /> Repeat:</span>
                <button 
                  className={`square-btn repeat-btn ${reminder.repeatType === 'daily' && reminder.isRepeating ? 'active' : ''}`}
                  onClick={() => setRepeatReminder(reminder._id, 'daily')}
                  disabled={isSettingRepeat[reminder._id]}
                  title="Repeat this reminder daily"
                >
                  <Calendar size={14} />
                  Daily
                </button>
                <button 
                  className={`square-btn repeat-btn ${reminder.repeatType === 'weekly' && reminder.isRepeating ? 'active' : ''}`}
                  onClick={() => setRepeatReminder(reminder._id, 'weekly')}
                  disabled={isSettingRepeat[reminder._id]}
                  title="Repeat this reminder weekly"
                >
                  <Calendar size={14} />
                  Weekly
                </button>
                <button 
                  className={`square-btn repeat-btn ${reminder.repeatType === 'monthly' && reminder.isRepeating ? 'active' : ''}`}
                  onClick={() => setRepeatReminder(reminder._id, 'monthly')}
                  disabled={isSettingRepeat[reminder._id]}
                  title="Repeat this reminder monthly"
                >
                  <Calendar size={14} />
                  Monthly
                </button>
              </div>

              <button 
                className="square-btn dismiss-btn-primary"
                onClick={() => reminder._id.startsWith('test-reminder-') ? closeReminder(reminder._id) : dismissReminder(reminder._id)}
                title="Dismiss reminder permanently"
              >
                {reminder._id.startsWith('test-reminder-') ? 'Close' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
        );
      })}

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
    </>
  );
};

export default GlobalReminderPopup;