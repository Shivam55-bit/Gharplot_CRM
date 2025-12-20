import React, { useState, useEffect, useRef } from 'react';
import AlertService from '../../services/AlertService';
import './AlertsPage.css';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const audioRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    reason: '',
    repeatDaily: false
  });
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const token = localStorage.getItem('token') || 
                localStorage.getItem('adminToken') || 
                localStorage.getItem('employeeToken');

  // Function to play alert sound
  const playAlertSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.log('Sound play failed:', err);
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await AlertService.getAllAlerts(token);
      console.log('📋 Fetched alerts data:', data);
      
      // Handle different response structures
      let alertsArray = [];
      if (Array.isArray(data)) {
        alertsArray = data;
      } else if (data.alerts && Array.isArray(data.alerts)) {
        alertsArray = data.alerts;
      } else if (data.data && Array.isArray(data.data)) {
        alertsArray = data.data;
      }
      
      setAlerts(alertsArray);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch alerts';
      alert(`Error: ${errorMessage}`);
      setAlerts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertsByDateRange = async () => {
    if (!filterStartDate || !filterEndDate) {
      alert('Please select both start and end dates');
      return;
    }
    setLoading(true);
    try {
      const data = await AlertService.getAlertsByDateRange(filterStartDate, filterEndDate, token);
      console.log('📋 Fetched filtered alerts data:', data);
      
      // Handle different response structures
      let alertsArray = [];
      if (Array.isArray(data)) {
        alertsArray = data;
      } else if (data.alerts && Array.isArray(data.alerts)) {
        alertsArray = data.alerts;
      } else if (data.data && Array.isArray(data.data)) {
        alertsArray = data.data;
      }
      
      setAlerts(alertsArray);
    } catch (error) {
      console.error('Error fetching alerts by date range:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch alerts';
      alert(`Error: ${errorMessage}`);
      setAlerts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAlert) {
        // Update existing alert
        const updateData = {
          time: formData.time,
          reason: formData.reason,
          isActive: true
        };
        await AlertService.updateAlert(editingAlert._id || editingAlert.id, updateData, token);
        playAlertSound();
        alert('Alert updated successfully!');
      } else {
        // Create new alert
        await AlertService.createAlert(formData, token);
        playAlertSound();
        alert('Alert created successfully!');
      }
      setShowModal(false);
      setEditingAlert(null);
      setFormData({ date: '', time: '', reason: '', repeatDaily: false });
      fetchAlerts();
    } catch (error) {
      console.error('Error saving alert:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save alert. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      date: alert.date || '',
      time: alert.time || '',
      reason: alert.reason || '',
      repeatDaily: alert.repeatDaily || false
    });
    setShowModal(true);
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    setLoading(true);
    try {
      await AlertService.deleteAlert(alertId, token);
      alert('Alert deleted successfully!');
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to delete alert';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAlert(null);
    setFormData({ date: '', time: '', reason: '', repeatDaily: false });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAlert(null);
    setFormData({ date: '', time: '', reason: '', repeatDaily: false });
  };

  const clearFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    fetchAlerts();
  };

  return (
    <div className="alerts-page">
      {/* Hidden audio element for alert sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/alert-sound.mp3" type="audio/mpeg" />
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
      </audio>
      
      <div className="alerts-header">
        <h1>Alert Management</h1>
        <button className="btn-create" onClick={openCreateModal}>
          + Create Alert
        </button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-inputs">
          <div className="input-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>End Date:</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
          <button className="btn-filter" onClick={fetchAlertsByDateRange}>
            Filter
          </button>
          <button className="btn-clear" onClick={clearFilter}>
            Clear Filter
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="alerts-table-container">
        {loading ? (
          <div className="loading">Loading alerts...</div>
        ) : (
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Repeat Daily</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">No alerts found</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id || alert.id}>
                    <td>{alert.date || 'N/A'}</td>
                    <td>{alert.time || 'N/A'}</td>
                    <td>{alert.reason || 'N/A'}</td>
                    <td>
                      <span className={`badge ${alert.repeatDaily ? 'badge-yes' : 'badge-no'}`}>
                        {alert.repeatDaily ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${alert.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {alert.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(alert)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(alert._id || alert.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAlert ? 'Edit Alert' : 'Create New Alert'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  disabled={editingAlert !== null}
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Enter alert reason..."
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="repeatDaily"
                    checked={formData.repeatDaily}
                    onChange={handleInputChange}
                    disabled={editingAlert !== null}
                  />
                  <span>Repeat Daily</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingAlert ? 'Update Alert' : 'Create Alert')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
