import React, { useState } from 'react';
import { Clock, Calendar, Repeat, AlertCircle, X } from 'lucide-react';
import './ReminderModal.css';

const ReminderModal = ({ isOpen, onClose, onSubmit, assignmentId, assignmentType, leadTitle }) => {
  const [formData, setFormData] = useState({
    title: '',
    comment: '',
    reminderDateTime: '',
    isRepeating: false,
    repeatType: 'daily'
  });

  const [errors, setErrors] = useState({});
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedBgColor, setSelectedBgColor] = useState('transparent');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle rich text formatting
  const applyFormatting = (command, value = null) => {
    console.log('Applying formatting:', command, value);
    
    const editor = document.querySelector('.rich-text-editor');
    if (editor) {
      // Ensure editor is focused and selection is preserved
      editor.focus();
      
      // Check if there's any text selected
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        console.log('Selected text:', selection.toString());
      } else {
        console.log('No text selected - formatting will apply to new text');
      }
      
      // Apply formatting using execCommand
      const success = document.execCommand(command, false, value);
      console.log('Command executed:', success);
      
      // Update state with new content
      setTimeout(() => {
        const content = editor.innerHTML;
        console.log('Updated content:', content);
        
        setFormData(prevData => ({
          ...prevData,
          comment: content
        }));
      }, 10);
    }
  };

    const handleCommentChange = (e) => {
    const content = e.target.innerHTML;
    console.log('Comment content:', content);
    setFormData(prevData => ({
      ...prevData,
      comment: content
    }));
    
    // Clear validation error when user types
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Check if there's any text content in the comment
    const plainComment = formData.comment ? formData.comment.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim() : '';
    if (!plainComment) {
      newErrors.comment = 'Comment is required';
    }
    
    if (!formData.reminderDateTime) {
      newErrors.reminderDateTime = 'Date and time is required';
    } else {
      const reminderDate = new Date(formData.reminderDateTime);
      const now = new Date();
      if (reminderDate <= now) {
        newErrors.reminderDateTime = 'Reminder must be set for future time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      assignmentId,
      assignmentType
    });

    // Reset form
    setFormData({
      title: '',
      comment: '',
      reminderDateTime: '',
      isRepeating: false,
      repeatType: 'daily'
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      title: '',
      comment: '',
      reminderDateTime: '',
      isRepeating: false,
      repeatType: 'daily'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const minDateTime = new Date();
  minDateTime.setMinutes(minDateTime.getMinutes() + 1);
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  return (
    <div className="reminder-modal-overlay">
      <div className="reminder-modal-content">
        <div className="reminder-modal-header">
          <div className="reminder-modal-title">
            <Clock size={20} className="me-2" />
            Create Reminder
          </div>
          <button className="reminder-modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="reminder-modal-body">
          <div className="lead-info">
            <p className="text-muted mb-3">
              <strong>For:</strong> {leadTitle || 'Lead Assignment'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">
                <AlertCircle size={16} className="me-1" />
                Reminder Title *
              </label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter reminder title..."
                maxLength={100}
              />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>

            <div className="form-group mb-3">
              <label className="form-label">
                Comment *
              </label>
              <div className="alert alert-info" style={{ fontSize: '13px', padding: '8px 12px', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>🎨 How to use colors:</strong>
                <br />
                1. Type your text in the box below
                <br />
                2. Select/highlight the text you want to color
                <br />
                3. Click the color pickers above to apply colors
              </div>
              
              {/* Custom Rich Text Toolbar */}
              <div className="rich-text-toolbar">
                <button type="button" onClick={() => applyFormatting('bold')} className="toolbar-btn">
                  <strong>B</strong>
                </button>
                <button type="button" onClick={() => applyFormatting('italic')} className="toolbar-btn">
                  <em>I</em>
                </button>
                <button type="button" onClick={() => applyFormatting('underline')} className="toolbar-btn">
                  <u>U</u>
                </button>
                
                {/* Text Color Picker */}
                <div className="color-picker-group">
                  <label htmlFor="textColor" className="color-label">Text Color:</label>
                  <input
                    type="color"
                    id="textColor"
                    value={selectedColor}
                    onChange={(e) => {
                      console.log('Text color changed to:', e.target.value);
                      setSelectedColor(e.target.value);
                      applyFormatting('foreColor', e.target.value);
                    }}
                    onClick={(e) => {
                      console.log('Text color picker clicked');
                      const editor = document.querySelector('.rich-text-editor');
                      if (editor) editor.focus();
                    }}
                    className="color-input"
                    title="Click to change text color"
                  />
                </div>
                
                {/* Background Color Picker */}
                <div className="color-picker-group">
                  <label htmlFor="bgColor" className="color-label">Highlight:</label>
                  <input
                    type="color"
                    id="bgColor"
                    value={selectedBgColor === 'transparent' ? '#ffff00' : selectedBgColor}
                    onChange={(e) => {
                      console.log('Highlight color changed to:', e.target.value);
                      setSelectedBgColor(e.target.value);
                      applyFormatting('backColor', e.target.value);
                    }}
                    onClick={(e) => {
                      console.log('Highlight color picker clicked');
                      const editor = document.querySelector('.rich-text-editor');
                      if (editor) editor.focus();
                    }}
                    className="color-input"
                    title="Click to highlight text background"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      console.log('Clear formatting clicked');
                      setSelectedBgColor('transparent');
                      applyFormatting('removeFormat');
                    }}
                    className="clear-btn"
                    title="Remove all formatting"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div
                ref={(el) => {
                  if (el) {
                    if (formData.comment) {
                      el.innerHTML = formData.comment;
                    } else if (el.innerHTML === '') {
                      el.innerHTML = 'Type your reminder comment here. Select text and use colors above to highlight important parts!';
                      // Clear the sample text when user clicks
                      el.addEventListener('focus', function clearSample() {
                        if (el.innerHTML === 'Type your reminder comment here. Select text and use colors above to highlight important parts!') {
                          el.innerHTML = '';
                        }
                        el.removeEventListener('focus', clearSample);
                      });
                    }
                  }
                }}
                contentEditable
                className={`rich-text-editor ${errors.comment ? 'is-invalid' : ''}`}
                onInput={handleCommentChange}
                style={{ 
                  minHeight: '100px', 
                  padding: '10px', 
                  border: '1px solid #ced4da', 
                  borderRadius: '0 0 0.375rem 0.375rem',
                  borderTop: 'none',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: formData.comment ? '#000' : '#6c757d',
                  fontStyle: formData.comment ? 'normal' : 'italic'
                }}
              />
              {errors.comment && <div className="invalid-feedback" style={{ display: 'block' }}>{errors.comment}</div>}
            </div>

            <div className="form-group mb-3">
              <label className="form-label">
                <Calendar size={16} className="me-1" />
                Reminder Date & Time *
              </label>
              <input
                type="datetime-local"
                className={`form-control ${errors.reminderDateTime ? 'is-invalid' : ''}`}
                name="reminderDateTime"
                value={formData.reminderDateTime}
                onChange={handleChange}
                min={minDateTimeString}
              />
              {errors.reminderDateTime && <div className="invalid-feedback">{errors.reminderDateTime}</div>}
            </div>

            <div className="form-group mb-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="isRepeating"
                  id="isRepeating"
                  checked={formData.isRepeating}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="isRepeating">
                  <Repeat size={16} className="me-1" />
                  Repeat Reminder
                </label>
              </div>
            </div>

            {formData.isRepeating && (
              <div className="form-group mb-3">
                <label className="form-label">Repeat Frequency</label>
                <select
                  className="form-select"
                  name="repeatType"
                  value={formData.repeatType}
                  onChange={handleChange}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <small className="text-muted">
                  Reminder will repeat at the same time {formData.repeatType} until manually turned off
                </small>
              </div>
            )}

            <div className="reminder-modal-footer">
              <button type="button" className="btn btn-secondary me-2" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Reminder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;