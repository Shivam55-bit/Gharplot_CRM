/**
 * Add Enquiry Modal Component
 * Form for adding manual enquiries
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createManualEnquiry } from '../../../services/enquiryService';

const AddEnquiryModal = ({ visible, onClose, onSuccess, addEnquiryAPI, totalEnquiries = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [nextSerialNumber, setNextSerialNumber] = useState(1);
  const [nextClientCode, setNextClientCode] = useState('CC001');
  const [nextProjectCode, setNextProjectCode] = useState('PC001');
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [weekActionDate, setWeekActionDate] = useState(new Date());
  const [weekActionTime, setWeekActionTime] = useState(new Date());
  
  const [formData, setFormData] = useState({
    s_No: 1,
    clientName: '',
    contactNumber: '',
    ClientCode: 'CC001',
    ProjectCode: 'PC001',
    productType: 'Residential',
    location: '',
    date: new Date().toISOString().split('T')[0],
    caseStatus: 'Open',
    source: 'Walk In',
    majorComments: '',
    address: '',
    weekOrActionTaken: '',
    actionPlan: '',
    referenceBy: '',
  });

  // Product types matching website
  const productTypes = [
    'Residential',
    'Commercial',
    'Plot',
    'Apartment',
    'Villa',
  ];

  // Case status options matching website
  const caseStatuses = [
    'Open',
    'Closed',
    'Week One',
    'Week Two',
    'Unassigned',
  ];

  // Source options matching website
  const sources = [
    'Walk In',
    'OLX',
    'Just Dial',
    'Reference By',
  ];

  // Auto-generate codes when modal opens (matching web logic EXACTLY)
  useEffect(() => {
    if (visible) {
      generateNextCodes();
    }
  }, [visible, totalEnquiries]);

  const generateNextCodes = async () => {
    try {
      // IMPORTANT: Use enquiries.length exactly as web does
      // If 5 enquiries exist, next will be 6
      const nextNumber = totalEnquiries; // Web uses enquiries.length directly
      const serialNo = nextNumber;
      const clientCode = `CC${String(nextNumber).padStart(3, '0')}`;
      const projectCode = `PC${String(nextNumber).padStart(3, '0')}`;
      
      console.log('📊 Auto-generation based on total enquiries:', totalEnquiries);
      console.log('🔢 Next Serial:', serialNo);
      console.log('💼 Next Client Code:', clientCode);
      console.log('📁 Next Project Code:', projectCode);
      
      setNextSerialNumber(serialNo);
      setNextClientCode(clientCode);
      setNextProjectCode(projectCode);
      
      setFormData(prev => ({
        ...prev,
        s_No: serialNo,
        ClientCode: clientCode,
        ProjectCode: projectCode,
      }));
    } catch (error) {
      console.error('Error generating codes:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle date picker change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setWeekActionDate(selectedDate);
      updateWeekActionDateTime(selectedDate, weekActionTime);
    }
  };

  // Handle time picker change
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedTime) {
      setWeekActionTime(selectedTime);
      updateWeekActionDateTime(weekActionDate, selectedTime);
    }
  };

  // Update the combined date-time string
  const updateWeekActionDateTime = (date, time) => {
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );
    
    // Format: "Dec 25, 2025, 10:30 AM"
    const formatted = combinedDateTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    handleInputChange('weekOrActionTaken', formatted);
  };

  // Clear date time
  const clearDateTime = () => {
    setWeekActionDate(new Date());
    setWeekActionTime(new Date());
    handleInputChange('weekOrActionTaken', '');
  };

  const validateForm = () => {
    // Check all required fields per backend validation
    const required = ['s_No', 'clientName', 'contactNumber', 'ClientCode', 'ProjectCode', 'productType', 'location', 'date'];
    
    for (const field of required) {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        Alert.alert('Validation Error', `${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
        return false;
      }
    }
    
    // Validate phone number
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid contact number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Format data for backend with proper data types
      const submitData = {
        s_No: parseInt(formData.s_No) || nextSerialNumber,
        clientName: formData.clientName?.trim() || '',
        contactNumber: formData.contactNumber?.trim() || '',
        ClientCode: formData.ClientCode?.trim() || nextClientCode,
        ProjectCode: formData.ProjectCode?.trim() || nextProjectCode,
        productType: formData.productType || 'Residential',
        location: formData.location?.trim() || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        caseStatus: formData.caseStatus || 'Open',
        source: formData.source || 'Walk In',
        majorComments: formData.majorComments?.trim() || '',
        address: formData.address?.trim() || '',
        weekOrActionTaken: formData.weekOrActionTaken?.trim() || '',
        actionPlan: formData.actionPlan?.trim() || '',
        referenceBy: formData.referenceBy?.trim() || ''
      };
      
      console.log('🚀 Submitting manual enquiry data:', JSON.stringify(submitData, null, 2));
      
      // Use the passed API function if available, otherwise use the imported one
      const apiFunction = addEnquiryAPI || createManualEnquiry;
      const result = await apiFunction(submitData);
      
      console.log('📡 API Response:', JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        // If Week/Action Date/Time is provided, create reminder
        if (formData.weekOrActionTaken && formData.weekOrActionTaken.trim()) {
          await createReminderFromEnquiry(result.data);
        }
        
        Alert.alert('Success', result.message || 'Enquiry created successfully!', [
          { text: 'OK', onPress: handleClose }
        ]);
        onSuccess && onSuccess();
      } else {
        // Provide more detailed error message
        const errorMessage = result?.message || result?.error || 'Failed to create enquiry. Please check your input.';
        console.error('❌ API returned error:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      console.error('❌ Error details:', error.message, error.stack);
      Alert.alert('Error', `Failed to create manual inquiry: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Create reminder from Week/Action field
  const createReminderFromEnquiry = async (enquiryData) => {
    try {
      console.log('📅 Creating reminder from Week/Action field...');
      
      // Parse Week/Action date time (format: "Dec 25, 2025, 10:30 AM")
      const reminderDateTime = parseWeekActionDateTime(formData.weekOrActionTaken);
      
      if (!reminderDateTime) {
        console.warn('⚠️ Could not parse Week/Action date time');
        return;
      }

      const reminderData = {
        name: formData.clientName,
        email: '',
        phone: formData.contactNumber,
        contactNumber: formData.contactNumber,
        location: formData.location,
        reminderTime: reminderDateTime,
        reminderDateTime: reminderDateTime,
        note: `Week/Action reminder for ${formData.clientName}`,
        title: `Enquiry Reminder: ${formData.clientName}`,
        productType: formData.productType,
        caseStatus: formData.caseStatus,
        source: formData.source,
        majorComments: formData.majorComments,
        address: formData.address,
        referenceBy: formData.referenceBy,
        clientCode: formData.ClientCode,
        projectCode: formData.ProjectCode,
        serialNumber: formData.s_No.toString(),
        enquiryId: enquiryData._id,
        actionPlan: formData.actionPlan,
        status: 'pending',
      };

      // Save to API
      const { createReminderFromLead } = await import('../../../services/crmEnquiryApi');
      const apiResult = await createReminderFromLead(reminderData);
      
      if (apiResult.success) {
        console.log('✅ Reminder created in API successfully');
      } else {
        console.warn('⚠️ API Reminder creation failed:', apiResult.message);
      }

      // IMPORTANT: Also save to local storage for popup
      const reminderManager = (await import('../../../services/reminderManager')).default;
      await reminderManager.addReminder({
        ...reminderData,
        id: apiResult.data?._id || `reminder_${Date.now()}`,
      });
      
      console.log('✅ Reminder saved to local storage for popup');
    } catch (error) {
      console.error('❌ Error creating reminder:', error);
      // Don't fail the enquiry creation if reminder fails
    }
  };

  // Parse Week/Action date time string
  const parseWeekActionDateTime = (dateTimeStr) => {
    try {
      // Try to parse various date formats
      const date = new Date(dateTimeStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const handleClose = () => {
    setFormData({
      s_No: '',
      clientName: '',
      contactNumber: '',
      ClientCode: '',
      ProjectCode: '',
      productType: 'Residential',
      location: '',
      date: new Date().toISOString().split('T')[0],
      caseStatus: 'New',
      source: 'Phone Call',
      majorComments: '',
      address: '',
      weekOrActionTaken: '',
      actionPlan: '',
      referenceBy: '',
    });
    onClose();
  };

  const renderInput = (label, field, placeholder, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {options.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, options.multiline && styles.textArea]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={options.keyboardType}
        multiline={options.multiline}
        numberOfLines={options.numberOfLines}
      />
    </View>
  );

  const renderSelect = (label, field, options, required = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.selectOption,
              formData[field] === option && styles.selectOptionActive,
            ]}
            onPress={() => handleInputChange(field, option)}
          >
            <Text style={[
              styles.selectOptionText,
              formData[field] === option && styles.selectOptionTextActive,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Enquiry</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Auto-generated fields with disabled input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Serial Number (Auto-generated)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.s_No.toString()}
                editable={false}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Client Code (Auto-generated)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.ClientCode}
                editable={false}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Code (Auto-generated)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.ProjectCode}
                editable={false}
              />
            </View>
            
            {renderInput('Client Name', 'clientName', 'Enter client name', { required: true })}
            {renderInput('Contact Number', 'contactNumber', '+91-XXXXXXXXXX', { required: true, keyboardType: 'phone-pad' })}
            
            {renderSelect('Property Type', 'productType', productTypes, true)}
            
            {renderInput('Location', 'location', 'Enter location', { required: true })}
            {renderInput('Date', 'date', 'YYYY-MM-DD')}
            
            {renderSelect('Source', 'source', sources, true)}
            
            {/* Show Reference By field only if source is "Reference By" */}
            {formData.source === 'Reference By' && (
              renderInput('Reference By', 'referenceBy', 'Enter reference name')
            )}
            
            {renderSelect('Case Status', 'caseStatus', caseStatuses, true)}
            
            {renderInput('Major Comments', 'majorComments', 'Enter comments...', { multiline: true, numberOfLines: 3 })}
            {renderInput('Address', 'address', 'Enter full address...', { multiline: true, numberOfLines: 2 })}
            
            {/* Week/Action Date & Time Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Week/Action Date & Time</Text>
              
              {/* Display selected date time */}
              {formData.weekOrActionTaken ? (
                <View style={styles.dateTimeDisplay}>
                  <Icon name="event" size={20} color="#3b82f6" />
                  <Text style={styles.dateTimeText}>{formData.weekOrActionTaken}</Text>
                  <TouchableOpacity onPress={clearDateTime} style={styles.clearButton}>
                    <Icon name="close" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.dateTimeText}>No date & time selected</Text>
              )}
              
              {/* Date & Time Picker Buttons */}
              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar-today" size={18} color="#ffffff" />
                  <Text style={styles.pickerButtonText}>Select Date</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Icon name="access-time" size={18} color="#ffffff" />
                  <Text style={styles.pickerButtonText}>Select Time</Text>
                </TouchableOpacity>
              </View>
              
              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={weekActionDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
              
              {/* Time Picker */}
              {showTimePicker && (
                <DateTimePicker
                  value={weekActionTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}
            </View>
            
            {renderInput('Action Plan', 'actionPlan', 'Enter action plan...', { multiline: true, numberOfLines: 2 })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Enquiry</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectOptionTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dateTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  dateTimeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddEnquiryModal;