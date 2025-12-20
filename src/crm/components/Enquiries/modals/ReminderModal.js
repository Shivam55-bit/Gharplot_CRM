/**
 * Reminder Modal Component
 * Form for creating reminders for enquiries
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
import { createReminder, createReminderDateTime, extractClientInfo } from '../../../services/reminderService';

const ReminderModal = ({ visible, onClose, enquiry, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hour: '09',
    minute: '00',
    period: 'AM',
    note: '',
  });

  useEffect(() => {
    if (enquiry) {
      // Play reminder sound when modal opens
      playReminderSound();
    }
  }, [enquiry]);

  const playReminderSound = () => {
    // In a real app, you would implement sound playing here
    // For React Native, you could use react-native-sound or expo-av
    console.log('🔔 Reminder sound played');
  };

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = (i + 1).toString().padStart(2, '0');
    return hour;
  });

  const minutes = Array.from({ length: 12 }, (_, i) => {
    const minute = (i * 5).toString().padStart(2, '0');
    return minute;
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.date) {
      Alert.alert('Validation Error', 'Please select a date');
      return false;
    }

    if (!formData.hour || !formData.minute) {
      Alert.alert('Validation Error', 'Please select time');
      return false;
    }

    // Check if date is not in the past
    const selectedDateTime = new Date(`${formData.date}T${formData.hour}:${formData.minute}:00`);
    if (selectedDateTime < new Date()) {
      Alert.alert('Validation Error', 'Please select a future date and time');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !enquiry) return;

    setLoading(true);

    try {
      const clientInfo = extractClientInfo(enquiry);
      const reminderDateTime = createReminderDateTime(
        formData.date,
        formData.hour,
        formData.minute,
        formData.period
      );

      const reminderData = {
        name: clientInfo.name,
        email: clientInfo.email,
        phone: clientInfo.phone,
        location: clientInfo.location,
        comment: formData.note || `Follow up with ${clientInfo.name}`,
        reminderDateTime,
        title: `Reminder for ${clientInfo.name}`,
        status: 'pending',
      };

      const result = await createReminder(reminderData);

      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: handleClose }
        ]);
        onSuccess && onSuccess();
      } else {
        Alert.alert('Error', result.message || 'Failed to create reminder');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      hour: '09',
      minute: '00',
      period: 'AM',
      note: '',
    });
    onClose();
  };

  if (!enquiry) return null;

  const clientInfo = extractClientInfo(enquiry);

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
            <View style={styles.headerLeft}>
              <Icon name="notifications" size={24} color="#3b82f6" />
              <Text style={styles.modalTitle}>Set Reminder</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Client Information (Read-only) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client Information</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Name: {clientInfo.name}</Text>
                <Text style={styles.infoText}>Phone: {clientInfo.phone}</Text>
                <Text style={styles.infoText}>Email: {clientInfo.email}</Text>
                <Text style={styles.infoText}>Location: {clientInfo.location}</Text>
              </View>
            </View>

            {/* Reminder Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onChangeText={(value) => handleInputChange('date', value)}
              />
            </View>

            {/* Reminder Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Time *</Text>
              <View style={styles.timeContainer}>
                {/* Hour */}
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <View style={styles.timePicker}>
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeOption,
                          formData.hour === hour && styles.timeOptionActive,
                        ]}
                        onPress={() => handleInputChange('hour', hour)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          formData.hour === hour && styles.timeOptionTextActive,
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Minute */}
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Minute</Text>
                  <View style={styles.timePicker}>
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timeOption,
                          formData.minute === minute && styles.timeOptionActive,
                        ]}
                        onPress={() => handleInputChange('minute', minute)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          formData.minute === minute && styles.timeOptionTextActive,
                        ]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Period */}
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Period</Text>
                  <View style={styles.periodContainer}>
                    {['AM', 'PM'].map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.periodOption,
                          formData.period === period && styles.periodOptionActive,
                        ]}
                        onPress={() => handleInputChange('period', period)}
                      >
                        <Text style={[
                          styles.periodOptionText,
                          formData.period === period && styles.periodOptionTextActive,
                        ]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter reminder note..."
                value={formData.note}
                onChangeText={(value) => handleInputChange('note', value)}
                multiline
                numberOfLines={3}
              />
            </View>
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
                <>
                  <Icon name="notifications" size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Set Reminder</Text>
                </>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  timePicker: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeOptionActive: {
    backgroundColor: '#3b82f6',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  timeOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  periodContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  periodOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  periodOptionActive: {
    backgroundColor: '#3b82f6',
  },
  periodOptionText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  periodOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
    flexDirection: 'row',
    gap: 6,
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
});

export default ReminderModal;