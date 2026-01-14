/**
 * EditAlertScreen.js
 * Screen for editing existing alerts from notifications
 * User can modify alert reason/message and reschedule it
 * Uses FCM API for backend updates
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { updateAlert, BASE_URL } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFCMToken } from '../utils/fcmService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertNotificationService from '../services/AlertNotificationService';

const EditAlertScreen = ({ route, navigation }) => {
  const { alertId, originalTitle, originalReason, originalDate, originalTime, repeatDaily } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(originalTitle || '');
  const [reason, setReason] = useState(originalReason || '');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [repeat, setRepeat] = useState(repeatDaily === 'true' || repeatDaily === true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 🔥 Cleanup pickers on unmount to prevent errors
  useEffect(() => {
    return () => {
      setShowDatePicker(false);
      setShowTimePicker(false);
    };
  }, []);

  useEffect(() => {
    if (!alertId) {
      Alert.alert('Error', 'Invalid alert ID');
      navigation.goBack();
      return;
    }

    // Parse original date and time if provided
    if (originalDate && originalTime) {
      try {
        const [year, month, day] = originalDate.split('-').map(Number);
        const [hours, minutes] = originalTime.split(':').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes);
        if (!isNaN(date.getTime())) {
          setScheduledDate(date);
        }
      } catch (error) {
        console.error('Error parsing date/time:', error);
      }
    }
  }, [alertId, originalDate, originalTime]);

  const handleDateChange = (event, selectedDate) => {
    // Always hide picker first on Android to prevent unmount errors
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    if (selectedDate) {
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        scheduledDate.getHours(),
        scheduledDate.getMinutes()
      );
      setScheduledDate(newDate);
    }
    
    // Hide picker for iOS after selection
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    // Always hide picker first on Android to prevent unmount errors
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    if (selectedTime) {
      const newDate = new Date(
        scheduledDate.getFullYear(),
        scheduledDate.getMonth(),
        scheduledDate.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      setScheduledDate(newDate);
    }
    
    // Hide picker for iOS after selection
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }
  };

  const formatDateTime = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    
    return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter alert title');
      return;
    }
    
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter alert reason/message');
      return;
    }

    const now = new Date();
    if (scheduledDate <= now) {
      Alert.alert('Invalid Date', 'Please select a future date and time');
      return;
    }

    setLoading(true);

    try {
      // Format date and time for API
      const year = scheduledDate.getFullYear();
      const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0');
      const day = scheduledDate.getDate().toString().padStart(2, '0');
      const hours = scheduledDate.getHours().toString().padStart(2, '0');
      const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');

      const updateData = {
        title: title.trim(),
        reason: reason.trim(),
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        repeatDaily: repeat,
        isActive: true, // Ensure alert stays active
      };

      console.log('📤 Updating alert with ID:', alertId);
      console.log('📤 Update data:', JSON.stringify(updateData, null, 2));
      
      // Call API to update alert
      // ⚠️ Backend will automatically reschedule FCM notification
      const result = await updateAlert(alertId, updateData);

      console.log('✅ API Response:', JSON.stringify(result, null, 2));
      
      if (result && result.success !== false) {
        console.log('✅ Alert updated successfully - Now scheduling FCM notification via backend');
        
        // ⚠️ CRITICAL: Call backend to reschedule FCM notification
        try {
          // Get FCM token
          const fcmToken = await getFCMToken();
          
          // Combine date and time for scheduledDateTime
          const scheduledDateTime = scheduledDate.toISOString();
          
          // Get CRM auth token (critical for alert APIs)
          const authToken = await AsyncStorage.getItem('crm_token') ||
                           await AsyncStorage.getItem('admin_token') ||
                           await AsyncStorage.getItem('authToken') ||
                           await AsyncStorage.getItem('userToken');
          
          console.log('🔑 Auth token available:', !!authToken);
          console.log('🎯 FCM Token:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'Not available');
          
          if (authToken) {
            console.log('📤 Calling backend to schedule FCM notification...');
            console.log('📅 Scheduled DateTime:', scheduledDateTime);
            
            // Call backend API to reschedule FCM notification
            const fcmResponse = await fetch(`${BASE_URL}/api/alert/schedule-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                alertId: alertId,
                reason: reason.trim(),
                date: updateData.date,
                time: updateData.time,
                scheduledDateTime: scheduledDateTime,
                repeatDaily: repeat,
                notificationType: 'alert',
                fcmToken: fcmToken,
              }),
            });
            
            // Check if response is JSON before parsing
            const contentType = fcmResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const fcmResult = await fcmResponse.json();
              
              if (fcmResult.success) {
                console.log('✅ FCM notification rescheduled successfully via backend');
              } else {
                console.warn('⚠️ Backend FCM rescheduling failed:', fcmResult.message);
              }
            } else {
              const errorText = await fcmResponse.text();
              console.warn('⚠️ Backend returned non-JSON response (endpoint may not be implemented yet):', errorText.substring(0, 100));
            }
          } else {
            console.warn('⚠️ No auth token available for FCM rescheduling');
          }
        } catch (fcmError) {
          console.error('❌ Error rescheduling FCM notification:', fcmError);
          // Don't fail the whole operation
        }
        
        // ✅ Also schedule local notification as backup
        try {
          console.log('📱 Scheduling local backup notification...');
          
          // First cancel any existing notification for this alert
          await AlertNotificationService.cancelAlert(alertId);
          
          // Then schedule new notification
          const scheduleResult = await AlertNotificationService.scheduleAlert({
            id: alertId,
            date: updateData.date,
            time: updateData.time,
            title: title.trim(),
            reason: reason.trim(),
            repeatDaily: repeat,
          });
          
          if (scheduleResult.success) {
            console.log('✅ Local backup notification scheduled:', scheduleResult.scheduledFor);
          } else {
            console.warn('⚠️ Failed to schedule local notification:', scheduleResult.message);
          }
        } catch (localError) {
          console.error('❌ Error scheduling local notification:', localError);
        }
        
        Alert.alert(
          '✅ Success',
          `Alert updated successfully!\n\n📅 New schedule: ${formatDateTime(scheduledDate)}${repeat ? '\n🔄 (Repeats daily)' : ''}\n\n🔔 You will receive notification at the scheduled time`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error('Failed to update alert');
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      
      // User-friendly error message
      let errorMessage = 'Failed to update alert. ';
      if (error.message.includes('404')) {
        errorMessage += 'Alert not found. It may have been deleted.';
      } else if (error.message.includes('unauthorized') || error.message.includes('401') || error.message.includes('403')) {
        errorMessage += 'Authentication failed. Please login to CRM again.';
      } else if (error.message.includes('No authentication token')) {
        errorMessage += 'Please login to CRM first.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Edit',
      'Are you sure you want to discard changes?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Alert</Text>
        <Text style={styles.subtitle}>Update alert details and reschedule</Text>

        {/* Alert Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Alert Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter alert title (e.g., Morning Reminder)"
            placeholderTextColor="#999"
          />
        </View>

        {/* Alert Message/Reason */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Alert Message *</Text>
          <TextInput
            style={styles.textArea}
            value={reason}
            onChangeText={setReason}
            placeholder="Enter alert message (e.g., Go to gym)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Date Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {scheduledDate.toLocaleDateString('en-GB')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Time *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {scheduledDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Repeat Daily Switch */}
        <View style={styles.switchContainer}>
          <View>
            <Text style={styles.label}>Repeat Daily</Text>
            <Text style={styles.switchSubtext}>Alert will trigger every day at this time</Text>
          </View>
          <Switch
            value={repeat}
            onValueChange={setRepeat}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor={repeat ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Scheduled For Display */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Alert will be scheduled for:</Text>
          <Text style={styles.infoValue}>
            {formatDateTime(scheduledDate)}
            {repeat && '\n(Repeats daily)'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save & Reschedule</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker Modal */}
        {showTimePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            is24Hour={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  switchSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
  },
  infoLabel: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EditAlertScreen;
