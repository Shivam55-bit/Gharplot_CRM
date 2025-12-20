/**
 * Reminder Service
 * Handles reminder creation and management
 */
import { BASE_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeaders = async () => {
  const adminToken = await AsyncStorage.getItem('adminToken');
  const employeeToken = await AsyncStorage.getItem('employeeToken');
  const token = await AsyncStorage.getItem('token');
  
  const authToken = adminToken || employeeToken || token;
  
  return {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
  };
};

/**
 * Create reminder for enquiry
 */
export const createReminder = async (reminderData) => {
  try {
    const response = await fetch(`${BASE_URL}/employee/reminders/create`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create reminder');
    }
    
    return {
      success: true,
      message: data.message || 'Reminder created successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Error creating reminder:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Convert 12-hour time to 24-hour format
 */
export const convertTo24Hour = (hour, minute, period) => {
  let hour24 = parseInt(hour);
  
  if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  } else if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  }
  
  return { hour: hour24, minute: parseInt(minute) };
};

/**
 * Create ISO datetime string from date and time components
 */
export const createReminderDateTime = (date, hour, minute, period) => {
  try {
    const { hour: hour24, minute: min } = convertTo24Hour(hour, minute, period);
    
    const reminderDate = new Date(date);
    reminderDate.setHours(hour24, min, 0, 0);
    
    return reminderDate.toISOString();
  } catch (error) {
    console.error('Error creating reminder datetime:', error);
    throw new Error('Invalid date or time format');
  }
};

/**
 * Extract client info from enquiry for reminder
 */
export const extractClientInfo = (enquiry) => {
  return {
    name: enquiry.clientName || 'Unknown Client',
    email: enquiry.email || '',
    phone: enquiry.contactNumber || '',
    location: enquiry.propertyLocation || enquiry.location || '',
  };
};