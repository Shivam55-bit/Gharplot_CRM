import React, { useState, useEffect } from "react";
import { 
  User, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Building,
  Calendar,
  MessageSquare,
  Target,
  X,
  AlertCircle,
  CheckSquare
} from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "./FollowUpModal.css";

const FollowUpModal = ({ 
  isOpen, 
  onClose, 
  leadData, 
  leadType, 
  leadId,
  onFollowUpCreated 
}) => {
  const [formData, setFormData] = useState({
    caseStatus: 'open',
    priority: 'medium',
    comment: '',
    actionTaken: 'other',
    nextFollowUpDate: '',
    tags: [],
    result: ''
  });
  const [resultError, setResultError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingFollowUps, setExistingFollowUps] = useState([]);

  // Helper function to count words
  const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to validate result field
  const validateResult = (result, caseStatus) => {
    if (caseStatus === 'close') {
      if (!result || result.trim().length === 0) {
        return 'Result is required when closing a follow-up';
      }
      const wordCount = countWords(result);
      if (wordCount < 1) {
        return 'Result must contain at least 1 word';
      }
    }
    return '';
  };

  const caseStatusOptions = [
    { value: 'open', label: 'Open', color: '#10b981' },
    { value: 'close', label: 'Close', color: '#ef4444' },
    { value: 'not-interested', label: 'Not Interested', color: '#f59e0b' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'urgent', label: 'Urgent', color: '#dc2626' }
  ];

  const actionTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'meeting', label: 'Meeting', icon: User },
    { value: 'site_visit', label: 'Site Visit', icon: MapPin },
    { value: 'document_sent', label: 'Document Sent', icon: MessageSquare },
    { value: 'follow_up_scheduled', label: 'Follow-up Scheduled', icon: Calendar },
    { value: 'other', label: 'Other', icon: Target }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchExistingFollowUps();
    }
  }, [isOpen, leadId, leadType]);

  const fetchExistingFollowUps = async () => {
    if (!leadId || !leadType) return;
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/follow-ups/lead/${leadType}/${leadId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setExistingFollowUps(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching existing follow-ups:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate result field if status is 'close'
    const resultValidationError = validateResult(formData.result, formData.caseStatus);
    if (resultValidationError) {
      setResultError(resultValidationError);
      toast.error(resultValidationError);
      return;
    }
    
    // Clear any previous result error
    setResultError('');

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('employeeToken');
      
      const submitData = {
        leadId,
        leadType,
        caseStatus: formData.caseStatus,
        priority: formData.priority,
        comment: formData.comment,
        actionTaken: formData.actionTaken,
        nextFollowUpDate: formData.nextFollowUpDate,
        tags: formData.tags,
        result: formData.result,
        wordCount: countWords(formData.result)
        // assignedAgent will be auto-assigned by backend to current user
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/follow-ups/create`,
        submitData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Follow-up created successfully');
        onFollowUpCreated && onFollowUpCreated(response.data.data);
        onClose();
        // Reset form
        setFormData({
          caseStatus: 'open',
          priority: 'medium',
          comment: '',
          actionTaken: 'other',
          nextFollowUpDate: '',
          tags: [],
          result: ''
        });
        setResultError('');
      }
    } catch (err) {
      console.error("Error creating follow-up:", err);
      toast.error(err.response?.data?.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLeadTypeDisplay = () => {
    return leadType === 'UserLeadAssignment' ? 'User Lead' : 'Enquiry Lead';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content follow-up-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info">
            <h3>Create Follow-up</h3>
            <span className="lead-type-badge">{getLeadTypeDisplay()}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-scrollable-content">
          {/* Lead Information Display */}
          <div className="lead-info-section">
          <div className="lead-info-header">
            <Target size={20} />
            <h4>Lead Information</h4>
          </div>
          
          <div className="lead-details-grid">
            <div className="lead-detail-item">
              <User size={16} />
              <div>
                <strong>Client Name</strong>
                <span>{leadData?.clientName || leadData?.fullName || 'N/A'}</span>
              </div>
            </div>

            {leadData?.phone && (
              <div className="lead-detail-item">
                <Phone size={16} />
                <div>
                  <strong>Phone</strong>
                  <span>{leadData.phone}</span>
                </div>
              </div>
            )}

            {leadData?.email && leadData.email !== 'N/A' && (
              <div className="lead-detail-item">
                <Mail size={16} />
                <div>
                  <strong>Email</strong>
                  <span>{leadData.email}</span>
                </div>
              </div>
            )}

            {leadData?.propertyType && (
              <div className="lead-detail-item">
                <Building size={16} />
                <div>
                  <strong>Property Type</strong>
                  <span>{leadData.propertyType}</span>
                </div>
              </div>
            )}

            {leadData?.location && (
              <div className="lead-detail-item">
                <MapPin size={16} />
                <div>
                  <strong>Location</strong>
                  <span>{leadData.location}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Existing Follow-ups */}
        {existingFollowUps.length > 0 && (
          <div className="existing-followups-section">
            <div className="section-header">
              <Clock size={20} />
              <h4>Existing Follow-ups ({existingFollowUps.length})</h4>
            </div>
            
            <div className="existing-followups-list">
              {existingFollowUps.slice(0, 3).map((followUp) => (
                <div key={followUp._id} className="existing-followup-item">
                  <div className="followup-status">
                    <span className={`status-indicator status-${followUp.caseStatus}`}></span>
                    <span className="status-text">{followUp.caseStatus}</span>
                  </div>
                  <div className="followup-info">
                    <div className="followup-agent">{followUp.assignedAgent?.name}</div>
                    <div className="followup-date">{formatDate(followUp.createdAt)}</div>
                  </div>
                </div>
              ))}
              {existingFollowUps.length > 3 && (
                <div className="more-followups">
                  +{existingFollowUps.length - 3} more follow-ups
                </div>
              )}
            </div>
          </div>
        )}

          <form id="follow-up-form" onSubmit={handleSubmit} className="follow-up-form">
            <div className="form-section">
              <h4>Follow-up Details</h4>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Case Status *</label>
                  <select
                    value={formData.caseStatus}
                    onChange={(e) => {
                      setFormData({...formData, caseStatus: e.target.value});
                      // Clear result error when changing status
                      if (e.target.value !== 'close') {
                        setResultError('');
                      }
                    }}
                    required
                  >
                    {caseStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Action Taken</label>
                  <select
                    value={formData.actionTaken}
                    onChange={(e) => setFormData({...formData, actionTaken: e.target.value})}
                  >
                    {actionTypes.map(action => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Next Follow-up Date</label>
                  <input
                    type="datetime-local"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Initial Comment</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  placeholder="Add your initial comment about this follow-up..."
                  rows="4"
                />
              </div>

              {/* Result field - Required when status is 'close' */}
              {formData.caseStatus === 'close' && (
                <div className="form-group">
                  <label>
                    Closing Result * 
                    <span className="result-word-count">
                      ({countWords(formData.result)} words)
                    </span>
                  </label>
                  <textarea
                    value={formData.result}
                    onChange={(e) => {
                      setFormData({...formData, result: e.target.value});
                      setResultError('');
                    }}
                    placeholder="Describe the result/outcome of this follow-up (minimum 1 word required)..."
                    rows="4"
                    required
                    className={resultError ? 'error' : ''}
                  />
                  {resultError && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {resultError}
                    </div>
                  )}
                  <div className="result-hint">
                    <span className={countWords(formData.result) >= 10 ? 'good' : 'needs-improvement'}>
                      {countWords(formData.result) < 10 
                        ? `Add ${10 - countWords(formData.result)} more words for a good result` 
                        : 'Good result length!'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} form="follow-up-form">
            {loading ? 'Creating...' : 'Create Follow-up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;