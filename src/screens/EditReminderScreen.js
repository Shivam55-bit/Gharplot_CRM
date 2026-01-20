/**
 * EditReminderScreen.js
 * Screen for editing existing reminders from notifications
 * User can modify reminder message and reschedule it
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
} from 'react-native';
import { updateReminder } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendTokenToBackend, getFCMToken } from '../utils/fcmService';

const CRM_BASE_URL = 'https://abc.bhoomitechzone.us';

const EditReminderScreen = ({ route, navigation }) => {
  const { reminderId, clientName, originalMessage, enquiryId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(originalMessage || '');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (!reminderId) {
      Alert.alert('Error', 'Invalid reminder ID');
      navigation.goBack();
    }
    
    // 🔥 Ensure FCM token is synced to backend for notifications
    const syncFCMToken = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('employeeId');
        const token = await getFCMToken();
        if (userId && token) {
          await sendTokenToBackend(userId, token);
          console.log('✅ FCM token synced for notifications');
        }
      } catch (error) {
        console.warn('⚠️ FCM sync failed:', error);
      }
    };
    syncFCMToken();
  }, [reminderId]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Update date but keep existing time
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        scheduledDate.getHours(),
        scheduledDate.getMinutes()
      );
      setScheduledDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Update time but keep existing date
      const newDate = new Date(
        scheduledDate.getFullYear(),
        scheduledDate.getMonth(),
        scheduledDate.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      setScheduledDate(newDate);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const handleSave = async () => {
    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message');
      return;
    }

    const now = new Date();
    if (scheduledDate <= now) {
      Alert.alert('Invalid Date', 'Please select a future date and time');
      return;
    }

    setLoading(true);

    try {
      // Get auth token - try multiple keys
      const accessToken = await AsyncStorage.getItem('accessToken') ||
                          await AsyncStorage.getItem('employeeToken') ||
                          await AsyncStorage.getItem('adminToken') ||
                          await AsyncStorage.getItem('employee_auth_token') ||
                          await AsyncStorage.getItem('crm_auth_token') ||
                          await AsyncStorage.getItem('userToken');
      
      if (!accessToken) {
        Alert.alert('Session Expired', 'Please login again');
        return;
      }

      // 🔥 Get employeeId for FCM notification
      const employeeId = await AsyncStorage.getItem('employeeId') || await AsyncStorage.getItem('userId');
      console.log('📱 Employee ID for reminder:', employeeId);

      // Create new reminder via backend API
      const reminderPayload = {
        title: clientName || 'Reminder',
        comment: message.trim(),
        note: message.trim(), // Backend accepts both
        reminderDateTime: scheduledDate.toISOString(),
        isRepeating: false,
        repeatType: 'daily',
        clientName: clientName || '',
        phone: route.params?.phone || '',
        email: route.params?.email || '',
        location: '',
        employeeId: employeeId, // 🔥 Required for FCM notification
        isEdited: true, // 🏷️ Mark as edited reminder
      };

      // Only add enquiryId if it's a valid MongoDB ObjectId (24 char hex)
      if (enquiryId && /^[0-9a-fA-F]{24}$/.test(enquiryId)) {
        reminderPayload.enquiryId = enquiryId;
      }

      console.log('📤 Creating reminder:', reminderPayload);
      console.log('🔑 Token:', accessToken?.substring(0, 20) + '...');

      const response = await fetch(`${CRM_BASE_URL}/api/reminder/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reminderPayload),
      });

      console.log('📥 Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 Response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parse error:', e);
        throw new Error('Server returned invalid response');
      }

      if (response.ok && data.success) {
        // 🔥 Also save to local storage so it shows in Enquiry Details
        try {
          const localRemindersJson = await AsyncStorage.getItem('localReminders');
          const localReminders = localRemindersJson ? JSON.parse(localRemindersJson) : [];
          
          const newLocalReminder = {
            id: data.data?._id || `local_${Date.now()}`,
            _id: data.data?._id || `local_${Date.now()}`,
            clientName: clientName,
            phone: route.params?.phone || '',
            email: route.params?.email || '',
            note: message.trim(),
            comment: message.trim(),
            message: message.trim(),
            reminderDateTime: scheduledDate.toISOString(),
            scheduledDate: scheduledDate.toISOString(),
            status: 'pending',
            enquiryId: enquiryId,
            source: 'edit_reminder',
            isEdited: true, // 🏷️ Mark as edited reminder
            createdAt: new Date().toISOString(),
          };
          
          localReminders.push(newLocalReminder);
          await AsyncStorage.setItem('localReminders', JSON.stringify(localReminders));
          console.log('✅ Reminder saved to local storage for Enquiry Details');
          
          // Also save to app_reminders for popup
          const appRemindersJson = await AsyncStorage.getItem('app_reminders');
          const appReminders = appRemindersJson ? JSON.parse(appRemindersJson) : [];
          appReminders.push(newLocalReminder);
          await AsyncStorage.setItem('app_reminders', JSON.stringify(appReminders));
          console.log('✅ Reminder saved to app_reminders for popup');
        } catch (localError) {
          console.warn('⚠️ Could not save to local storage:', localError);
        }
        
        Alert.alert(
          '✅ Success',
          `Reminder scheduled successfully!\n\n📅 ${formatDateTime(scheduledDate)}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error('API Error:', data);
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', error.message || 'Failed to save reminder. Please try again.');
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
        <Text style={styles.title}>Edit Reminder</Text>
        <Text style={styles.subtitle}>Update reminder details and reschedule</Text>

        {/* Client Name (Read-only) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Client Name</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{clientName}</Text>
          </View>
        </View>

        {/* Message */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Reminder Message *</Text>
          <TextInput
            style={styles.textArea}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter reminder message (e.g., Shivam is coming in 10 min)"
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
            style={styles.inputField}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {formatDate(scheduledDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Time *</Text>
          <TouchableOpacity
            style={styles.inputField}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.inputText}>
              {formatTime(scheduledDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled For Display */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Reminder will be scheduled for:</Text>
          <Text style={styles.infoValue}>{formatDateTime(scheduledDate)}</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  readOnlyField: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
  inputField: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  infoLabel: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#FFB74D',
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default EditReminderScreen;
