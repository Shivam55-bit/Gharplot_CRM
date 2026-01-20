/**
 * Reminder Modal Component
 * Simple form for creating reminders with native notifications
 * Updated to use ReminderNotificationService for background notifications
 */
import React, { useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createReminder, createReminderFromLead, sendScheduledReminderNotification } from '../../../services/crmEnquiryApi';
import { createReminderDateTime, extractClientInfo, convertTo24Hour } from '../../../services/reminderService';
import ReminderNotificationService from '../../../../services/ReminderNotificationService';

const ReminderModal = ({ visible, onClose, enquiry, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    date: '',
    hour: '1',
    minute: '00',
    period: 'AM',
    note: '',
    repeatType: 'none',
  });

  // Repeat Options
  const REPEAT_OPTIONS = [
    { label: 'No Repeat', value: 'none', icon: '❌' },
    { label: 'Daily', value: 'daily', icon: '📅' },
    { label: 'Weekly', value: 'weekly', icon: '📆' },
    { label: 'Monthly', value: 'monthly', icon: '🗓️' },
    { label: 'Yearly', value: 'yearly', icon: '🌐' },
    { label: 'Working Days (Mon-Fri)', value: 'working_days', icon: '💼' },
  ];

  // Populate form when enquiry changes
  React.useEffect(() => {
    if (enquiry) {
      const clientInfo = extractClientInfo(enquiry);
      setFormData({
        name: clientInfo.name,
        email: clientInfo.email,
        phone: clientInfo.phone,
        location: clientInfo.location,
        date: new Date().toISOString().split('T')[0],
        hour: '1',
        minute: '00',
        period: 'AM',
        note: '',
        repeatType: 'none',
      });
    }
  }, [enquiry]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter name');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return false;
    }

    if (!formData.date) {
      Alert.alert('Validation Error', 'Please select a date');
      return false;
    }

    // Validate date format
    const selectedDate = new Date(formData.date);
    if (isNaN(selectedDate.getTime())) {
      Alert.alert('Validation Error', 'Please enter a valid date');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !enquiry) return;

    setLoading(true);

    try {
      // Create reminder date and time
      const reminderDateTime = createReminderDateTime(
        formData.date,
        formData.hour,
        formData.minute,
        formData.period
      );

      // Validate that the reminder is set for future
      const reminderDate = new Date(reminderDateTime);
      const now = new Date();
      
      if (reminderDate <= now) {
        Alert.alert('Invalid Date', 'Please select a future date and time for the reminder');
        return;
      }

      // Prepare data for notification service
      const reminderData = {
        id: `reminder_${enquiry._id}_${Date.now()}`,
        clientName: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.note || `Follow up with ${formData.name} regarding property inquiry`,
        scheduledDate: reminderDate.toISOString(),
        enquiryId: enquiry._id,
        enquiry: enquiry,
        repeatType: formData.repeatType,
        // Enhanced navigation configuration for notification click
        targetScreen: 'EnquiryDetails', // Navigate to specific enquiry details
        navigationType: 'nested',
        navigationData: {
          enquiryId: enquiry._id,
          clientName: formData.name,
          clientPhone: formData.phone,
          clientEmail: formData.email,
          reminderType: 'follow_up',
          enquiry: enquiry,
          openReminderTab: true, // Open reminder tab in details
        },
      };

      // 🔥 IMPORTANT: Send to backend for FCM scheduled notification
      // This ensures notification works even when app is killed!
      console.log('📤 Sending reminder to backend for FCM scheduling...');
      const fcmResult = await sendScheduledReminderNotification(reminderData);
      
      if (fcmResult.success) {
        console.log('✅ FCM scheduled notification sent to backend successfully');
      } else {
        console.log('⚠️ FCM scheduling failed, falling back to local notification');
      }

      // 🔔 Also schedule local notification as backup
      const result = await ReminderNotificationService.scheduleReminder(reminderData);
      
      if (result.success) {
        // Also store legacy format for existing screens that might still check AsyncStorage
        const localReminder = {
          id: reminderData.id,
          leadId: enquiry._id || null,
          enquiryType: enquiry.enquiryType || 'ManualInquiry',
          clientName: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          comment: formData.note || `Reminder for ${formData.name}`,
          reminderDateTime: reminderDateTime,
          title: `Reminder: ${formData.name}`,
          status: 'pending',
          priority: 'medium',
          source: 'local',
          triggered: false,
          repeatType: formData.repeatType,
          createdAt: new Date().toISOString(),
          notificationId: reminderData.id, // Link to notification
        };

        // Store in AsyncStorage for backward compatibility
        const existingReminders = await AsyncStorage.getItem('localReminders');
        const reminderList = existingReminders ? JSON.parse(existingReminders) : [];
        reminderList.push(localReminder);
        await AsyncStorage.setItem('localReminders', JSON.stringify(reminderList));

        // Get repeat label for display
        const repeatLabel = REPEAT_OPTIONS.find(opt => opt.value === formData.repeatType)?.label || 'No Repeat';

        Alert.alert(
          '✅ Reminder Set Successfully!',
          `🔔 Notification scheduled for: ${formData.name}\n📅 Date & Time: ${reminderDate.toLocaleString('en-IN')}\n🔄 Repeat: ${repeatLabel}\n\n✅ You will receive notification even if app is KILLED or in background via FCM!`,
          [{ 
            text: 'Perfect!', 
            onPress: handleClose,
            style: 'default'
          }]
        );
        onSuccess && onSuccess();
      } else {
        Alert.alert(
          'Failed to Set Reminder',
          result.message || 'Failed to schedule notification. Please check your notification permissions and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Reminder creation error:', error);
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      date: '',
      hour: '1',
      minute: '00',
      period: 'AM',
      note: '',
      repeatType: 'none',
    });
    setShowRepeatDropdown(false);
    onClose();
  };

  if (!enquiry) return null;

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
            <Text style={styles.modalTitle}>Set Reminder</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter name"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Enter location"
              />
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(value) => handleInputChange('date', value)}
                placeholder="dd-mm-yyyy"
              />
            </View>

            {/* Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Time</Text>
              <View style={styles.timeRow}>
                {/* Hour */}
                <View style={styles.timeDropdown}>
                  <ScrollView 
                    style={styles.dropdown} 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.dropdownItem,
                          formData.hour === hour && styles.dropdownItemActive,
                        ]}
                        onPress={() => handleInputChange('hour', hour)}
                      >
                        <Text style={[
                          styles.dropdownText,
                          formData.hour === hour && styles.dropdownTextActive,
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                {/* Minute */}
                <View style={styles.timeDropdown}>
                  <ScrollView 
                    style={styles.dropdown}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.dropdownItem,
                          formData.minute === minute && styles.dropdownItemActive,
                        ]}
                        onPress={() => handleInputChange('minute', minute)}
                      >
                        <Text style={[
                          styles.dropdownText,
                          formData.minute === minute && styles.dropdownTextActive,
                        ]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Period */}
                <View style={styles.timeDropdown}>
                  <ScrollView 
                    style={styles.dropdown}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {['AM', 'PM'].map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.dropdownItem,
                          formData.period === period && styles.dropdownItemActive,
                        ]}
                        onPress={() => handleInputChange('period', period)}
                      >
                        <Text style={[
                          styles.dropdownText,
                          formData.period === period && styles.dropdownTextActive,
                        ]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.note}
                onChangeText={(value) => handleInputChange('note', value)}
                placeholder="Enter note"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Repeat Options Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🔄 Repeat Reminder</Text>
              <TouchableOpacity
                style={styles.repeatSelectButton}
                onPress={() => setShowRepeatDropdown(!showRepeatDropdown)}
              >
                <Text style={styles.repeatSelectIcon}>
                  {REPEAT_OPTIONS.find(opt => opt.value === formData.repeatType)?.icon || '❤️'}
                </Text>
                <Text style={styles.repeatSelectText}>
                  {REPEAT_OPTIONS.find(opt => opt.value === formData.repeatType)?.label || 'Select Repeat'}
                </Text>
                <Text style={styles.repeatArrow}>{showRepeatDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showRepeatDropdown && (
                <View style={styles.repeatDropdownContainer}>
                  <ScrollView 
                    style={styles.repeatDropdown} 
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {REPEAT_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.repeatDropdownItem,
                          formData.repeatType === option.value && styles.repeatDropdownItemActive,
                        ]}
                        onPress={() => {
                          handleInputChange('repeatType', option.value);
                          setShowRepeatDropdown(false);
                        }}
                      >
                        <Text style={styles.repeatIcon}>{option.icon}</Text>
                        <Text style={[
                          styles.repeatDropdownText,
                          formData.repeatType === option.value && styles.repeatDropdownTextActive,
                        ]}>
                          {option.label}
                        </Text>
                        {formData.repeatType === option.value && (
                          <Text style={styles.repeatCheckmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  formContainer: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeDropdown: {
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    maxHeight: 100,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#3b82f6',
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  dropdownTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Repeat Options Dropdown Styles
  repeatSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  repeatSelectIcon: {
    fontSize: 18,
  },
  repeatSelectText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  repeatArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  repeatDropdownContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  repeatDropdown: {
    maxHeight: 150,
  },
  repeatDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  repeatDropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  repeatIcon: {
    fontSize: 16,
  },
  repeatDropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  repeatDropdownTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  repeatCheckmark: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
  },
});

export default ReminderModal;