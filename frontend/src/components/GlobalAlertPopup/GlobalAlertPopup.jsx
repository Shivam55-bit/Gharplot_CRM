import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertService from '../../services/AlertService';
import './GlobalAlertPopup.css';

const GlobalAlertPopup = ({ token }) => {
  const [currentAlert, setCurrentAlert] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [shownAlerts, setShownAlerts] = useState(new Set());
  const audioRef = useRef(null);

  // Function to play alert sound
  const playAlertSound = () => {
    console.log('🔊 playAlertSound called');
    
    // Method 1: Try with audio element
    try {
      if (audioRef.current) {
        console.log('Audio element found');
        audioRef.current.volume = 1.0;
        audioRef.current.muted = false;
        audioRef.current.currentTime = 0;
        
        audioRef.current.play()
          .then(() => console.log('✅ Sound played successfully'))
          .catch(err => {
            console.error('❌ Audio element failed:', err);
            // Method 2: Fallback to creating new Audio
            tryFallbackSound();
          });
      } else {
        console.error('❌ Audio ref is null');
        tryFallbackSound();
      }
    } catch (error) {
      console.error('❌ Error with audio element:', error);
      tryFallbackSound();
    }
  };

  // Fallback sound method
  const tryFallbackSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 1.0;
      audio.play()
        .then(() => console.log('✅ Fallback sound played'))
        .catch(err => console.error('❌ Fallback also failed:', err));
    } catch (error) {
      console.error('❌ Fallback sound error:', error);
    }
  };

  const checkAlerts = useCallback(async () => {
    if (!token) {
      console.log('⚠️ GlobalAlertPopup: No token available');
      return;
    }

    try {
      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      console.log('🔍 Checking alerts for:', { currentDate, currentTime });

      // Fetch alerts for today
      const data = await AlertService.getAlertsByDateRange(currentDate, currentDate, token);
      console.log('📋 Raw API response:', data);
      
      // Handle different response structures
      let alerts = [];
      if (Array.isArray(data)) {
        alerts = data;
      } else if (data.alerts && Array.isArray(data.alerts)) {
        alerts = data.alerts;
      } else if (data.data && Array.isArray(data.data)) {
        alerts = data.data;
      }

      console.log('📋 Processed alerts:', alerts, 'Count:', alerts.length);

      // Find alerts that match current time and haven't been shown
      const matchingAlert = alerts.find(alert => {
        const alertTime = alert.time;
        const alertId = alert._id || alert.id;
        
        // Check if alert time matches current time (within the same minute)
        const timeMatch = alertTime === currentTime;
        
        // Check if alert is active and not already shown
        const isActive = alert.isActive !== false;
        const notShown = !shownAlerts.has(`${alertId}-${currentDate}-${currentTime}`);
        
        console.log(`Alert check: ${alertId}`, { 
          alertTime, 
          currentTime, 
          timeMatch, 
          isActive, 
          notShown 
        });

        return timeMatch && isActive && notShown;
      });

      if (matchingAlert) {
        console.log('✅ Found matching alert:', matchingAlert);
        setCurrentAlert(matchingAlert);
        setShowPopup(true);
        
        // Mark this alert as shown for this time
        const alertKey = `${matchingAlert._id || matchingAlert.id}-${currentDate}-${currentTime}`;
        setShownAlerts(prev => new Set([...prev, alertKey]));
      }
    } catch (error) {
      console.error('❌ Error checking alerts:', error);
    }
  }, [token, shownAlerts]);

  useEffect(() => {
    if (!token) {
      console.log('⚠️ GlobalAlertPopup: Token not available, skipping alert check');
      return;
    }

    console.log('🔔 GlobalAlertPopup mounted with token');

    // Check alerts immediately
    checkAlerts();

    // Set up interval to check alerts every 30 seconds
    const intervalId = setInterval(() => {
      console.log('⏰ Running scheduled alert check...');
      checkAlerts();
    }, 30000); // 30 seconds

    return () => {
      console.log('🔕 GlobalAlertPopup unmounting');
      clearInterval(intervalId);
    };
  }, [token, checkAlerts]);

  // Play sound when popup becomes visible
  useEffect(() => {
    if (showPopup && currentAlert) {
      console.log('🔊 Popup visible, attempting to play sound...');
      console.log('Current alert:', currentAlert);
      // Multiple attempts to ensure sound plays
      setTimeout(() => playAlertSound(), 50);
      setTimeout(() => playAlertSound(), 200);
      setTimeout(() => playAlertSound(), 500);
    }
  }, [showPopup, currentAlert]);

  const handleClose = () => {
    setShowPopup(false);
    setCurrentAlert(null);
  };

  const handleDismiss = () => {
    handleClose();
  };

  return (
    <>
      {/* Hidden audio element for alert sound - always mounted */}
      <audio 
        ref={audioRef} 
        preload="auto"
        crossOrigin="anonymous"
      >
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
        <source src="https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3" type="audio/mpeg" />
      </audio>

      {/* Test sound button - remove this after testing */}
      <button 
        onClick={() => {
          console.log('🧪 Test button clicked');
          playAlertSound();
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 99999,
          padding: '10px 20px',
          background: '#ff5722',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        🔊 Test Alert Sound
      </button>
      
      {showPopup && currentAlert && (
        <div className="global-alert-overlay">
        <div className="global-alert-popup">
        <div className="alert-popup-header">
          <div className="alert-icon">
            <span>🔔</span>
          </div>
          <h3>Alert Notification</h3>
          <button className="alert-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>
        
        <div className="alert-popup-body">
          <div className="alert-detail">
            <strong>Date:</strong>
            <span>{currentAlert.date || 'N/A'}</span>
          </div>
          
          <div className="alert-detail">
            <strong>Time:</strong>
            <span>{currentAlert.time || 'N/A'}</span>
          </div>
          
          <div className="alert-detail">
            <strong>Reason:</strong>
            <p>{currentAlert.reason || 'No reason provided'}</p>
          </div>
          
          {currentAlert.repeatDaily && (
            <div className="alert-badge">
              <span className="repeat-badge">🔁 Repeats Daily</span>
            </div>
          )}
        </div>
        
        <div className="alert-popup-footer">
          <button className="btn-dismiss" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
      </div>
      )}
    </>
  );
};

export default GlobalAlertPopup;
