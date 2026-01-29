import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCRMAuthHeaders } from '../../services/crmAPI';
import { sendAlertToAdmin } from '../../services/crmEnquiryApi';
import { createAlert, updateAlert, BASE_URL } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import AlertNotificationService from '../../../services/AlertNotificationService';
import { getFCMToken } from '../../../utils/fcmService';

const CreateAlertScreen = ({ navigation, route }) => {
  // Get alert to edit from route params
  const alertToEdit = route?.params?.alertToEdit;
  const isEditMode = !!alertToEdit;
  
  const [formData, setFormData] = useState({
    title: alertToEdit?.title || '',
    date: alertToEdit ? new Date(alertToEdit.date) : new Date(),
    time: alertToEdit ? (() => {
      const [hours, minutes] = (alertToEdit.time || '00:00').split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return timeDate;
    })() : new Date(),
    reason: alertToEdit?.reason || '',
    repeatFrequency: alertToEdit?.repeatFrequency || 'none', // none, daily, weekly, monthly, yearly, custom
    repeatDaily: alertToEdit?.repeatDaily || false, // Keep for backward compatibility
    customIntervalMinutes: alertToEdit?.customIntervalMinutes || 60, // Custom interval in minutes
  });
  const [showCustomInput, setShowCustomInput] = useState(alertToEdit?.repeatFrequency === 'custom');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setFormData(prev => ({ ...prev, time: selectedTime }));
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the alert');
      return;
    }
    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please enter a reason for the alert');
      return;
    }

    setIsSubmitting(true);
    try {
      // Format time for backend
      const timeStr = formatTime(formData.time); // HH:MM
      
      // Prepare date and metadata based on repeat frequency
      let dateStr;
      let repeatMetadata = {};
      
      if (formData.repeatFrequency === 'none') {
        // One-time alert: use exact selected date
        dateStr = formData.date.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('📅 One-time alert - using selected date:', dateStr);
      } else if (formData.repeatFrequency === 'daily') {
        // Daily: ignore date, use current date, only time matters
        dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('🔄 Daily alert - using current date, time matters:', timeStr);
      } else if (formData.repeatFrequency === 'weekly') {
        // Weekly: store day of week (0=Sunday, 1=Monday, etc)
        const dayOfWeek = formData.date.getDay();
        dateStr = new Date().toISOString().split('T')[0]; // Use current date
        repeatMetadata.dayOfWeek = dayOfWeek;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`🔄 Weekly alert - every ${dayNames[dayOfWeek]} at ${timeStr}`);
      } else if (formData.repeatFrequency === 'monthly') {
        // Monthly: store day of month (1-31)
        const dayOfMonth = formData.date.getDate();
        dateStr = new Date().toISOString().split('T')[0]; // Use current date
        repeatMetadata.dayOfMonth = dayOfMonth;
        console.log(`🔄 Monthly alert - every ${dayOfMonth} of month at ${timeStr}`);
      } else if (formData.repeatFrequency === 'yearly') {
        // Yearly: store month and day
        const month = formData.date.getMonth() + 1; // 1-12
        const day = formData.date.getDate(); // 1-31
        dateStr = new Date().toISOString().split('T')[0]; // Use current date
        repeatMetadata.month = month;
        repeatMetadata.dayOfMonth = day;
        console.log(`🔄 Yearly alert - every ${day}/${month} at ${timeStr}`);
      } else if (formData.repeatFrequency === 'custom') {
        // Custom: use custom interval in minutes
        dateStr = new Date().toISOString().split('T')[0]; // Use current date
        repeatMetadata.customIntervalMinutes = formData.customIntervalMinutes || 60;
        console.log(`🔄 Custom alert - every ${formData.customIntervalMinutes} minutes starting at ${timeStr}`);
      }

      console.log(`📤 ${isEditMode ? 'Updating' : 'Creating'} alert:`, { 
        dateStr, 
        timeStr, 
        reason: formData.reason, 
        repeatFrequency: formData.repeatFrequency,
        repeatMetadata,
        repeatDaily: formData.repeatFrequency === 'daily'
      });

      let result;
      
      // Prepare alert data
      const alertData = {
        title: formData.title,
        date: dateStr,
        time: timeStr,
        reason: formData.reason,
        repeatFrequency: formData.repeatFrequency,
        repeatMetadata: repeatMetadata, // Store day/month info for weekly/monthly/yearly
        repeatDaily: formData.repeatFrequency === 'daily', // Map to repeatDaily for backward compatibility
        isActive: true,
      };
      
      if (isEditMode) {
        // UPDATE existing alert using new API function
        const alertId = alertToEdit._id || alertToEdit.id;
        result = await updateAlert(alertId, alertData);
        console.log('🔔 Update Alert Response:', result);
      } else {
        // CREATE new alert using new API function
        result = await createAlert(alertData);
        console.log('🔔 Create Alert Response:', result);
      }
      
      if (result.success || result.alert || result.data) {
        // Extract the alert ID from response
        const alertId = isEditMode 
          ? (alertToEdit._id || alertToEdit.id)
          : (result.alert?._id || result.alert?.id || result.data?._id || result.data?.id);
        
        if (alertId) {
          console.log(`📤 ${isEditMode ? 'Rescheduling' : 'Scheduling'} FCM notification for alert:`, alertId);
          
          // ⚠️ CRITICAL: Send FCM schedule request to backend
          try {
            // Get FCM token
            const fcmToken = await getFCMToken();
            
            if (!fcmToken) {
              console.warn('⚠️ No FCM token available, notification may not work');
            }
            
            // Get CRM auth headers for FCM scheduling request
            const headers = await getCRMAuthHeaders();
            
            // Call backend API to schedule FCM notification
            // Backend expects: title, reason, date, time, repeatDaily, notificationType, fcmToken
            const fcmResponse = await fetch(`${BASE_URL}/api/alert/schedule-notification`, {
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: formData.title, // ✅ Added title field
                reason: formData.reason,
                date: dateStr,
                time: timeStr,
                repeatDaily: formData.repeatFrequency === 'daily',
                notificationType: 'alert',
                fcmToken: fcmToken,
              }),
            });
            
            // Check if response is JSON before parsing
            const contentType = fcmResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const fcmResult = await fcmResponse.json();
              
              if (fcmResult.success) {
                console.log('✅ FCM notification scheduled successfully via backend');
              } else {
                console.warn('⚠️ Backend FCM scheduling failed:', fcmResult.message);
              }
            } else {
              const errorText = await fcmResponse.text();
              console.warn('⚠️ Backend returned non-JSON response (endpoint may not be implemented yet):', errorText.substring(0, 100));
            }
          } catch (fcmError) {
            console.error('❌ Error scheduling FCM notification:', fcmError);
            // Don't fail the whole operation, just log it
          }
          
          // Also schedule local notification as backup
          const scheduleResult = await AlertNotificationService.scheduleAlert({
            id: alertId,
            date: dateStr,
            time: timeStr,
            title: formData.title,
            reason: formData.reason,
            repeatFrequency: formData.repeatFrequency,
            repeatMetadata: repeatMetadata,
            repeatDaily: formData.repeatFrequency === 'daily',
          });
          
          if (scheduleResult.success) {
            console.log('✅ Local backup notification scheduled:', scheduleResult.scheduledFor);
          } else {
            console.warn('⚠️ Failed to schedule local notification:', scheduleResult.message);
          }
          
          // 🔔 Send notification to admin if employee has popup access enabled
          try {
            console.log('📤 Checking if admin notification should be sent...');
            const adminNotifyResult = await sendAlertToAdmin({
              title: formData.title,
              reason: formData.reason,
              date: dateStr,
              time: timeStr,
              repeatFrequency: formData.repeatFrequency,
            });
            
            if (adminNotifyResult.success) {
              console.log('✅ Admin notification sent successfully');
            } else {
              console.log('ℹ️ Admin notification not sent:', adminNotifyResult.error);
            }
          } catch (adminNotifyError) {
            console.warn('⚠️ Error sending admin notification:', adminNotifyError);
            // Don't fail the whole operation
          }
        } else {
          console.warn('⚠️ No alert ID received, notification not scheduled');
        }
        
        // Reset form
        setFormData({
          title: '',
          date: new Date(),
          time: new Date(),
          reason: '',
          repeatFrequency: 'none',
          repeatDaily: false,
        });
        
        // Get repeat message with specific details
        let scheduleInfo;
        if (formData.repeatFrequency === 'none') {
          scheduleInfo = `📅 Scheduled: ${dateStr} at ${timeStr}`;
        } else if (formData.repeatFrequency === 'daily') {
          scheduleInfo = `🔄 Repeats daily at ${timeStr}`;
        } else if (formData.repeatFrequency === 'weekly') {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[formData.date.getDay()];
          scheduleInfo = `🔄 Repeats every ${dayName} at ${timeStr}`;
        } else if (formData.repeatFrequency === 'monthly') {
          const dayOfMonth = formData.date.getDate();
          scheduleInfo = `🔄 Repeats monthly on day ${dayOfMonth} at ${timeStr}`;
        } else if (formData.repeatFrequency === 'yearly') {
          const month = formData.date.getMonth() + 1;
          const day = formData.date.getDate();
          scheduleInfo = `🔄 Repeats yearly on ${day}/${month} at ${timeStr}`;
        } else if (formData.repeatFrequency === 'custom') {
          const mins = formData.customIntervalMinutes;
          if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            scheduleInfo = `🔄 Repeats every ${hours} hour${hours > 1 ? 's' : ''}`;
          } else {
            scheduleInfo = `🔄 Repeats every ${mins} minute${mins > 1 ? 's' : ''}`;
          }
        } else {
          scheduleInfo = `🔄 Repeats ${formData.repeatFrequency} at ${timeStr}`;
        }
        
        const repeatMsg = formData.repeatFrequency !== 'none' ? ' at the scheduled time' : '';
        
        Alert.alert(
          '✅ Success', 
          `Alert ${isEditMode ? 'updated' : 'created'} successfully!\n\n${scheduleInfo}\n\n🔔 You will receive notification${repeatMsg}`, 
          [
            { 
              text: 'OK', 
              onPress: () => {
                navigation.goBack();
              }
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create reminder');
      }
    } catch (error) {
      console.error('❌ Create alert error:', error);
      
      // User-friendly error message
      let errorMessage = 'Failed to create alert. ';
      if (error.message.includes('404')) {
        errorMessage += 'API endpoint not found. Please check backend.';
      } else if (error.message.includes('401') || error.message.includes('403') || error.message.includes('unauthorized')) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      title: '',
      date: new Date(),
      time: new Date(),
      reason: '',
      repeatFrequency: 'none',
      repeatDaily: false,
    });
    navigation.goBack();
  };

  const getRepeatLabel = () => {
    if (formData.repeatFrequency === 'custom') {
      const mins = formData.customIntervalMinutes;
      if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `Every ${hours}h ${remainingMins}m` : `Every ${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `Every ${mins} minute${mins > 1 ? 's' : ''}`;
    }
    const labels = {
      none: 'Does not repeat',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    };
    return labels[formData.repeatFrequency] || 'Does not repeat';
  };

  const handleRepeatSelect = (frequency) => {
    setFormData(prev => ({
      ...prev,
      repeatFrequency: frequency,
      repeatDaily: frequency === 'daily'
    }));
    if (frequency === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setShowRepeatModal(false);
    }
  };

  const handleCustomIntervalChange = (value) => {
    const mins = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      customIntervalMinutes: mins > 0 ? mins : 1
    }));
  };

  const confirmCustomInterval = () => {
    setShowCustomInput(false);
    setShowRepeatModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f2f6ff" barStyle="dark-content" />

      <ScrollView style={styles.scrollContent}>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Title Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter alert title"
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Date Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
                <Icon name="calendar-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Time Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
                <Icon name="time-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              </TouchableOpacity>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={formData.time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                is24Hour={true}
              />
            )}

            {/* Reason Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Reason <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter alert reason..."
                value={formData.reason}
                onChangeText={(value) => handleInputChange('reason', value)}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Repeat Frequency Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Repeat</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowRepeatModal(true)}
              >
                <Text style={styles.dateTimeText}>{getRepeatLabel()}</Text>
                <Icon name="chevron-down-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.createButton, isSubmitting && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.createButtonText}>
                  {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Alert' : 'Create Alert')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      </ScrollView>

      {/* Repeat Frequency Modal */}
      <Modal
        visible={showRepeatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRepeatModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !showCustomInput && setShowRepeatModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Repeat</Text>
            
            <ScrollView 
              style={styles.repeatOptionsScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Repeat Options */}
              <TouchableOpacity 
                style={[styles.repeatOption, formData.repeatFrequency === 'none' && styles.repeatOptionSelected]}
                onPress={() => handleRepeatSelect('none')}
              >
                <Text style={[styles.repeatOptionText, formData.repeatFrequency === 'none' && styles.repeatOptionTextSelected]}>
                  Does not repeat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.repeatOption, formData.repeatFrequency === 'daily' && styles.repeatOptionSelected]}
                onPress={() => handleRepeatSelect('daily')}
              >
                <Text style={[styles.repeatOptionText, formData.repeatFrequency === 'daily' && styles.repeatOptionTextSelected]}>
                  Daily
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.repeatOption, formData.repeatFrequency === 'weekly' && styles.repeatOptionSelected]}
                onPress={() => handleRepeatSelect('weekly')}
              >
                <Text style={[styles.repeatOptionText, formData.repeatFrequency === 'weekly' && styles.repeatOptionTextSelected]}>
                  Weekly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.repeatOption, formData.repeatFrequency === 'monthly' && styles.repeatOptionSelected]}
                onPress={() => handleRepeatSelect('monthly')}
              >
                <Text style={[styles.repeatOptionText, formData.repeatFrequency === 'monthly' && styles.repeatOptionTextSelected]}>
                  Monthly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.repeatOption, formData.repeatFrequency === 'yearly' && styles.repeatOptionSelected]}
                onPress={() => handleRepeatSelect('yearly')}
              >
                <Text style={[styles.repeatOptionText, formData.repeatFrequency === 'yearly' && styles.repeatOptionTextSelected]}>
                  Yearly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.repeatOption, formData.repeatFrequency === 'custom' && styles.repeatOptionSelected]}
                onPress={() => handleRepeatSelect('custom')}
              >
                <Text style={[styles.repeatOptionText, formData.repeatFrequency === 'custom' && styles.repeatOptionTextSelected]}>
                  Custom
                </Text>
              </TouchableOpacity>

              {/* Custom Interval Input */}
              {showCustomInput && (
                <View style={styles.customIntervalContainer}>
                  <Text style={styles.customIntervalLabel}>Set interval (in minutes):</Text>
                  <View style={styles.customIntervalRow}>
                    <TextInput
                      style={styles.customIntervalInput}
                      keyboardType="numeric"
                      value={String(formData.customIntervalMinutes)}
                      onChangeText={handleCustomIntervalChange}
                      placeholder="60"
                    />
                    <Text style={styles.customIntervalUnit}>minutes</Text>
                  </View>
                  <Text style={styles.customIntervalHint}>
                    Tip: 60 = 1 hour, 120 = 2 hours, 1440 = 1 day
                  </Text>
                  <TouchableOpacity 
                    style={styles.customConfirmButton}
                    onPress={confirmCustomInterval}
                  >
                    <Text style={styles.customConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {!showCustomInput && (
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRepeatModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
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
  inputContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 45,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 14,
    color: '#374151',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 100,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  repeatOptionsScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  repeatOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  repeatOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  repeatOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  repeatOptionTextSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom interval styles
  customIntervalContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  customIntervalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 12,
  },
  customIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customIntervalInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#0369a1',
    textAlign: 'center',
  },
  customIntervalUnit: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  customIntervalHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  customConfirmButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  customConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAlertScreen;