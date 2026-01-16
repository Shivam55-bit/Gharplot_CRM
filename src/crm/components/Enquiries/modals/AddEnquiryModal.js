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
  Vibration,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ReminderPopup from '../../Reminders/ReminderPopup';
import ReminderNotificationService from '../../../../services/ReminderNotificationService';
import { createManualEnquiry } from '../../../services/enquiryService';

const AddEnquiryModal = ({ visible, onClose, onSuccess, addEnquiryAPI, totalEnquiries = 0, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [nextSerialNumber, setNextSerialNumber] = useState(1);
  const [nextClientCode, setNextClientCode] = useState('CC001');
  const [nextProjectCode, setNextProjectCode] = useState('PC001');
  
  // Reminder popup state
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  
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

  // 🚨 CRITICAL: Background reminder checker
  useEffect(() => {
    let reminderInterval;
    
    const startReminderChecker = () => {
      reminderInterval = setInterval(async () => {
        try {
          await checkDueReminders();
        } catch (error) {
          console.log('Reminder check error:', error);
        }
      }, 5000); // Check every 5 seconds for better precision
    };
    
    // Start immediately when component mounts
    startReminderChecker();
    
    // ✅ FIXED: Properly handle AppState listener in newer React Native
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkDueReminders();
      }
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (reminderInterval) {
        clearInterval(reminderInterval);
      }
      // ✅ FIXED: Use subscription.remove() instead of removeEventListener
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, []);

  // �️ Make debug functions available globally (for development)
  useEffect(() => {
    if (__DEV__) {
      global.reminderDebug = {
        checkReminders: checkDueReminders,
        viewStorage: async () => {
          const reminders = await AsyncStorage.getItem('localReminders');
          const parsed = reminders ? JSON.parse(reminders) : [];
          console.log('📋 Stored reminders:', parsed);
          return parsed;
        },
        clearAll: async () => {
          await AsyncStorage.removeItem('localReminders');
          console.log('🧹 All reminders cleared');
        }
      };
      
      console.log(`
🧪 DEBUG COMMANDS AVAILABLE:
• reminderDebug.checkReminders() - Check for due reminders now
• reminderDebug.createTest() - Create 10-second test reminder
• reminderDebug.viewStorage() - View all stored reminders  
• reminderDebug.clearAll() - Clear all reminders
      `);
    }
  }, []);

  // �🚨 CRITICAL: Check for due reminders and show alerts
  const checkDueReminders = async () => {
    try {
      const reminders = await AsyncStorage.getItem('localReminders');
      if (!reminders) return;
      
      const reminderList = JSON.parse(reminders);
      const now = new Date();
      
      for (const reminder of reminderList) {
        if (reminder.triggered) continue; // Skip already triggered
        
        const reminderTime = new Date(reminder.reminderDateTime || reminder.scheduledDate);
        const timeDiff = now.getTime() - reminderTime.getTime();
        
        // Only trigger at or after the scheduled time (within 30 seconds after)
        if (timeDiff >= 0 && timeDiff <= 30000) {
          console.log('🔔 REMINDER ALERT TIME!', reminder.clientName);
          
          // Mark as triggered
          reminder.triggered = true;
          await AsyncStorage.setItem('localReminders', JSON.stringify(reminderList));
          
          // Show reminder popup with vibration and sound
          Vibration.vibrate([500, 200, 500, 200, 500]);
          
          setCurrentReminder(reminder);
          setShowReminderPopup(true);
          
          break; // Only show one reminder at a time
        }
      }
    } catch (error) {
      console.log('Error checking reminders:', error);
    }
  };

  // 🧪 TEST FUNCTION: Create immediate test reminder (for debugging)
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
      
      // ✅ DEBUG: Add debugging capabilities for reminder testing
      if (__DEV__) {
        global.debugEnquiryReminders = {
          // Create immediate test reminder (30 seconds)
          testNow: () => {
            const testTime = new Date(Date.now() + 30000); // 30 seconds from now
            setWeekActionDate(testTime);
            setWeekActionTime(testTime);
            updateWeekActionDateTime(testTime, testTime);
            console.log(`🧪 Test reminder set for: ${testTime.toLocaleString()}`);
            return `Test reminder set for ${testTime.toLocaleString()}`;
          },
          
          // Create test reminder for 2 minutes
          test2Min: () => {
            const testTime = new Date(Date.now() + 120000); // 2 minutes from now
            setWeekActionDate(testTime);
            setWeekActionTime(testTime);
            updateWeekActionDateTime(testTime, testTime);
            console.log(`⏰ 2-minute test reminder set for: ${testTime.toLocaleString()}`);
            return `2-minute test reminder set for ${testTime.toLocaleString()}`;
          },
          
          // Check current reminder settings
          checkCurrent: () => {
            console.log('📅 Current Week/Action settings:');
            console.log('  Date:', weekActionDate.toLocaleString());
            console.log('  Time:', weekActionTime.toLocaleString());
            console.log('  Combined:', formData.weekOrActionTaken);
            return {
              date: weekActionDate.toLocaleString(),
              time: weekActionTime.toLocaleString(),
              combined: formData.weekOrActionTaken
            };          },
          
          // ✅ NEW: Quick form fill for testing
          quickFill: () => {
            handleInputChange('clientName', 'Test Form Client');
            handleInputChange('contactNumber', '8888888888');
            handleInputChange('location', 'Test Form Location');
            console.log('📋 Quick form filled for testing');
            return 'Form filled with test data';
          },
          
          // ✅ NEW: Set reminder for 1 minute from now
          setIn1Min: () => {
            const testTime = new Date(Date.now() + 60000); // 1 minute
            setWeekActionDate(testTime);
            setWeekActionTime(testTime);
            updateWeekActionDateTime(testTime, testTime);
            console.log(`⏰ Form reminder set for 1 minute: ${testTime.toLocaleString()}`);
            return `Reminder set for: ${testTime.toLocaleString()}`;          }
        };
        
        console.log('🛠️ Debug Commands Available (AddEnquiryModal):');
        console.log('  • global.debugEnquiryReminders.testNow() - Set 30s reminder');
        console.log('  • global.debugEnquiryReminders.test2Min() - Set 2min reminder');
        console.log('  • global.debugEnquiryReminders.setIn1Min() - Set 1min reminder');
        console.log('  • global.debugEnquiryReminders.quickFill() - Fill form with test data');
        console.log('  • global.debugEnquiryReminders.checkCurrent() - Check settings');
      }
    }
  }, [visible, totalEnquiries]);

  const generateNextCodes = async () => {
    try {
      // IMPORTANT: If no enquiries exist (totalEnquiries = 0), start from 1
      // Otherwise use totalEnquiries + 1 for next number
      const nextNumber = totalEnquiries === 0 ? 1 : totalEnquiries + 1;
      const serialNo = nextNumber;
      const clientCode = `CC${String(nextNumber).padStart(2, '0')}`;
      const projectCode = `PC${String(nextNumber).padStart(2, '0')}`;
      
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

  // Check if contact number already exists
  const checkDuplicateContact = async (contactNumber) => {
    if (!contactNumber || contactNumber.length < 10) return;
    
    try {
      console.log('🔍 Checking for duplicate contact:', contactNumber);
      
      // Import the API function
      const { getAllEnquiries } = await import('../../../services/crmEnquiryApi');
      const result = await getAllEnquiries();
      
      if (result && result.success && result.data) {
        // Check if any enquiry has same contact number
        const existingEnquiry = result.data.find(enq => 
          enq.contactNumber === contactNumber || 
          enq.contactNumber === contactNumber.trim()
        );
        
        if (existingEnquiry) {
          console.log('⚠️ Found existing profile:', existingEnquiry);
          
          // Show alert with existing profile details
          Alert.alert(
            '⚠️ Profile Already Available',
            `📋 Name: ${existingEnquiry.clientName}\n` +
            `📞 Phone: ${existingEnquiry.contactNumber}\n` +
            `📍 Location: ${existingEnquiry.location}\n` +
            `🏢 Product: ${existingEnquiry.productType}\n` +
            `📅 Created: ${new Date(existingEnquiry.createdAt).toLocaleDateString('en-IN')}\n` +
            `📊 Status: ${existingEnquiry.caseStatus}\n` +
            `💼 Client Code: ${existingEnquiry.ClientCode}\n\n` +
            `An enquiry with this phone number already exists in the system. Do you want to continue creating a new entry?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  // Clear the contact number field
                  handleInputChange('contactNumber', '');
                }
              },
              {
                text: 'View Profile',
                onPress: () => {
                  // Navigate to existing profile or show more details
                  Alert.alert(
                    'Profile Details',
                    `📋 Full Details:\n\n` +
                    `Name: ${existingEnquiry.clientName}\n` +
                    `Phone: ${existingEnquiry.contactNumber}\n` +
                    `Client Code: ${existingEnquiry.ClientCode}\n` +
                    `Project Code: ${existingEnquiry.ProjectCode}\n` +
                    `Location: ${existingEnquiry.location}\n` +
                    `Product Type: ${existingEnquiry.productType}\n` +
                    `Status: ${existingEnquiry.caseStatus}\n` +
                    `Source: ${existingEnquiry.source}\n` +
                    `Address: ${existingEnquiry.address || 'N/A'}\n` +
                    `Reference By: ${existingEnquiry.referenceBy || 'N/A'}\n` +
                    `Comments: ${existingEnquiry.majorComments || 'N/A'}\n` +
                    `Created: ${new Date(existingEnquiry.createdAt).toLocaleString('en-IN')}`
                  );
                }
              },
              {
                text: 'Create New Anyway',
                style: 'destructive'
              }
            ]
          );
          
          return true; // Duplicate found
        }
      }
      
      return false; // No duplicate
    } catch (error) {
      console.error('Error checking duplicate contact:', error);
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Check for duplicate when contact number is fully entered (10 digits)
    if (field === 'contactNumber' && value && value.length === 10) {
      checkDuplicateContact(value);
    }
  };

  // Handle date picker change
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setWeekActionDate(selectedDate);
      updateWeekActionDateTime(selectedDate, weekActionTime);
    }
  };

  // Handle time picker change
  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setWeekActionTime(selectedTime);
      updateWeekActionDateTime(weekActionDate, selectedTime);
    }
  };

  // ✅ ENHANCED: Update the combined date-time string with better handling
  const updateWeekActionDateTime = (date, time) => {
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds() || 0
    );
    
    // Format for display: "Dec 25, 2025, 10:30 AM"
    const formatted = combinedDateTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    console.log('📅 Date/Time Updated:');
    console.log('  📆 Date:', date.toLocaleDateString());
    console.log('  🕐 Time:', time.toLocaleTimeString());
    console.log('  📋 Combined:', formatted);
    console.log('  🌐 ISO String:', combinedDateTime.toISOString());
    
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
        // ✅ ENHANCED: If Week/Action Date/Time is provided, create reminder with guaranteed alert
        if (formData.weekOrActionTaken && formData.weekOrActionTaken.trim()) {
          console.log('🔔 Creating reminder with FORM date/time...');
          console.log('📅 Form Week/Action value:', formData.weekOrActionTaken);
          
          await createReminderFromEnquiry(result.data);
          
          // ✅ ENHANCED: Show detailed confirmation with exact time
          const parsedTime = parseWeekActionDateTime(formData.weekOrActionTaken);
          const alertTime = parsedTime ? new Date(parsedTime).toLocaleString() : formData.weekOrActionTaken;
          
          Alert.alert(
            '✅ Enquiry & Reminder Created Successfully!',
            `📋 Enquiry: ${formData.clientName}\n📞 Phone: ${formData.contactNumber}\n📍 Location: ${formData.location}\n\n🔔 REMINDER SET FOR:\n⏰ ${alertTime}\n\n📱 You will get:\n• Popup alert (when app is open)\n• Background notification (when app is closed/minimized)\n• Sound + Vibration\n\n⚠️ Notification will work even if app is killed!`,
            [{ text: 'Perfect!', onPress: handleClose }]
          );
        } else {
          Alert.alert('Success', result.message || 'Enquiry created successfully!', [
            { text: 'OK', onPress: handleClose }
          ]);
        }
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

  // ✅ FIXED: Create reminder from Week/Action field using PROPER reminder manager
  const createReminderFromEnquiry = async (enquiryData) => {
    try {
      console.log('🔔 Creating reminder from FORM Week/Action field...');
      console.log('📅 Form Week/Action value:', formData.weekOrActionTaken);
      
      // Parse Week/Action date time 
      const reminderDateTime = parseWeekActionDateTime(formData.weekOrActionTaken);
      
      if (!reminderDateTime) {
        console.warn('⚠️ Could not parse Week/Action date time');
        Alert.alert('Warning', 'Invalid reminder date/time format. Reminder was not created.');
        return;
      }

      const reminderDateObj = new Date(reminderDateTime);
      const now = new Date();
      
      console.log('🕐 Reminder Time Details:');
      console.log('  📅 Original input:', formData.weekOrActionTaken);
      console.log('  🕒 Parsed local time:', reminderDateObj.toLocaleString());
      console.log('  🌐 ISO string:', reminderDateTime);
      console.log('  ⏰ Will trigger at:', reminderDateObj.toLocaleString());

      // Prepare comprehensive reminder data for ReminderManager
      const reminderData = {
        name: formData.clientName,
        email: formData.email || 'N/A',
        phone: formData.contactNumber,
        contactNumber: formData.contactNumber,
        location: formData.location,
        reminderTime: reminderDateTime,
        reminderDateTime: reminderDateTime,
        note: formData.actionPlan || `Week/Action reminder for ${formData.clientName}`,
        title: `📋 Enquiry Reminder: ${formData.clientName}`,
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
        assignmentType: 'enquiry',
        isLocalReminder: true,
        createdAt: new Date().toISOString()
      };

      console.log('📤 Adding reminder to ReminderManager...');
      
      // ✅ CRITICAL FIX: Use the SAME reminder manager that handles popups
      const reminderManager = (await import('../../../services/reminderManager')).default;
      const addedReminder = await reminderManager.addReminder(reminderData);
      
      console.log('✅ Reminder added to ReminderManager successfully:', addedReminder.id);

      // 🔔 ENHANCED: Schedule background notification using ReminderNotificationService
      try {
        const notificationData = {
          id: `notification_${enquiryData._id}_${Date.now()}`,
          clientName: formData.clientName,
          message: formData.actionPlan || `Follow up reminder for ${formData.clientName}`,
          scheduledDate: reminderDateObj,
          enquiryId: enquiryData._id,
          enquiry: enquiryData,
          targetScreen: 'EnquiriesScreen', // Navigate to EnquiriesScreen
          navigationType: 'nested',
          navigationData: {
            enquiryId: enquiryData._id,
            clientName: formData.clientName,
            clientPhone: formData.contactNumber,
            isReminderNotification: true,
            fromNotification: true,
            reminderType: 'enquiry_follow_up'
          }
        };

        const notificationResult = await ReminderNotificationService.scheduleReminder(notificationData);
        
        if (notificationResult.success) {
          console.log('✅ Background notification scheduled successfully');
        } else {
          console.warn('⚠️ Background notification scheduling failed:', notificationResult.message);
        }
      } catch (notificationError) {
        console.error('❌ Notification scheduling error:', notificationError);
      }

      // Force immediate check to ensure service is running
      setTimeout(() => {
        console.log('🔄 Forcing immediate reminder check after form creation...');
        reminderManager.forceCheck();
      }, 1000);

      // Also try API creation (but local is guaranteed)
      try {
        const { createReminderFromLead } = await import('../../../services/crmEnquiryApi');
        const apiResult = await createReminderFromLead(reminderData);
        
        if (apiResult.success) {
          console.log('✅ API reminder also created successfully');
        } else {
          console.warn('⚠️ API Reminder creation failed:', apiResult.message);
        }
      } catch (apiError) {
        console.error('❌ API reminder creation error (continuing with local):', apiError);
      }

      console.log('🎉 Reminder creation completed successfully!');
      console.log(`⏰ Reminder will trigger at: ${reminderDateObj.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Complete reminder creation failed:', error);
      Alert.alert('Error', `Failed to create reminder: ${error.message}`);
    }
  };

  // ✅ ENHANCED Parse Week/Action date time string with multiple format support
  const parseWeekActionDateTime = (dateTimeStr) => {
    if (!dateTimeStr || typeof dateTimeStr !== 'string') {
      console.warn('⚠️ Invalid date/time string provided:', dateTimeStr);
      return null;
    }

    try {
      console.log('🔍 Parsing date string:', dateTimeStr);
      
      // Method 1: Direct Date parsing
      let date = new Date(dateTimeStr);
      if (!isNaN(date.getTime())) {
        console.log('✅ Direct parsing successful:', date.toISOString());
        return date.toISOString();
      }

      // Method 2: Handle formatted display string ("Dec 25, 2025, 10:30 AM")
      if (dateTimeStr.includes(',')) {
        const parts = dateTimeStr.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const reconstructed = `${parts[0]}, ${parts[1]} ${parts[2]}`;
          date = new Date(reconstructed);
          if (!isNaN(date.getTime())) {
            console.log('✅ Formatted parsing successful:', date.toISOString());
            return date.toISOString();
          }
        }
      }

      // Method 3: Try combining weekActionDate and weekActionTime states if available
      if (weekActionDate && weekActionTime) {
        const combinedDate = new Date(
          weekActionDate.getFullYear(),
          weekActionDate.getMonth(),
          weekActionDate.getDate(),
          weekActionTime.getHours(),
          weekActionTime.getMinutes(),
          0 // seconds
        );
        if (!isNaN(combinedDate.getTime())) {
          console.log('✅ Combined date/time parsing successful:', combinedDate.toISOString());
          console.log('✅ Local time will be:', combinedDate.toLocaleString());
          return combinedDate.toISOString();
        }
      }

      console.warn('❌ All parsing methods failed for:', dateTimeStr);
      return null;
    } catch (error) {
      console.error('❌ Error parsing date:', error);
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
              <Text style={{ fontSize: 24, color: '#6b7280' }}>×</Text>
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
            
            {/* Enhanced Date Input with Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
              
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Select date..."
                  value={formData.date}
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="date-range" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            
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
                  <Text style={{ fontSize: 20, color: '#3b82f6' }}>📅</Text>
                  <Text style={styles.dateTimeText}>{formData.weekOrActionTaken}</Text>
                  <TouchableOpacity onPress={clearDateTime} style={styles.clearButton}>
                    <Text style={{ fontSize: 18, color: '#ef4444' }}>×</Text>
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
                  <Text style={{ fontSize: 18, color: '#ffffff' }}>📅</Text>
                  <Text style={styles.pickerButtonText}>Select Date</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ fontSize: 18, color: '#ffffff' }}>⏰</Text>
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

      {/* Reminder Popup */}
      {showReminderPopup && currentReminder && (
        <ReminderPopup
          visible={showReminderPopup}
          reminder={currentReminder}
          navigation={navigation}
          onClose={() => {
            setShowReminderPopup(false);
            setCurrentReminder(null);
          }}
        />
      )}
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
});

export default AddEnquiryModal;