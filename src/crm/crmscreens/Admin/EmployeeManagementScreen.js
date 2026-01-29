import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { 
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeEmployeePassword,
  toggleEmployeePopup
} from '../../services/crmEmployeeManagementApi';
import { getAllRoles } from '../../services/crmRoleApi';
import * as UspService from '../../services/crmUSPApi';

const EmployeeManagementScreen = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [uspCategories, setUspCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal states
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [uspModalVisible, setUspModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Reminders modal states
  const [remindersModalVisible, setRemindersModalVisible] = useState(false);
  const [employeeReminders, setEmployeeReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [previousReminderCount, setPreviousReminderCount] = useState(0);
  const [pollingActive, setPollingActive] = useState(false);

  // Form states
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    department: '',
    giveAdminAccess: false,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [uspFormData, setUspFormData] = useState({
    categoryId: '',
    expertise: '',
    experienceYears: '',
    description: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Check token validity and redirect if needed
  const checkTokenValidity = useCallback(async () => {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const employeeToken = await AsyncStorage.getItem('employeeToken');
    
    if (!adminToken && !employeeToken) {
      showAlert('error', 'No authentication token found. Redirecting to login...');
      // Navigate to login screen
      setTimeout(() => navigation.replace('Login'), 2000);
      return false;
    }
    
    // TODO: Add token expiry check here
    return true;
  }, [navigation]);

  // Get endpoint based on token type
  const isAdmin = useCallback(async () => {
    const adminToken = await AsyncStorage.getItem('adminToken');
    return !!adminToken;
  }, []);

  // Show alert function
  const showAlert = (type, message) => {
    if (type === 'success') {
      Alert.alert('Success', message);
    } else {
      Alert.alert('Error', message);
    }
  };

  // Validate employee form
  const validateEmployeeForm = () => {
    const errors = {};
    
    if (!employeeFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!employeeFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(employeeFormData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!employeeFormData.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!/^\d{10,11}$/.test(employeeFormData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone must be 10-11 digits';
    }
    
    if (!employeeFormData.role) {
      errors.role = 'Role is required';
    }
    
    if (!selectedEmployee && !employeeFormData.password.trim()) {
      errors.password = 'Password is required for new employees';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    if (!passwordFormData.newPassword.trim()) {
      showAlert('error', 'New password is required');
      return false;
    }
    
    if (passwordFormData.newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return false;
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  // Validate USP form
  const validateUspForm = () => {
    if (!uspFormData.categoryId) {
      showAlert('error', 'Please select a USP category');
      return false;
    }
    return true;
  };

  // Load employees
  const loadEmployees = useCallback(async () => {
    if (!(await checkTokenValidity())) return;
    
    try {
      setLoading(true);
      const response = await getAllEmployees();
      
      console.log('👥 Loading employees - Response:', JSON.stringify(response, null, 2));
      
      if (response && response.employees) {
        const processedEmployees = response.employees.map(emp => {
          // Try to get popup enabled from multiple possible field names (backend uses adminReminderPopupEnabled)
          const popupEnabledValue = 
            emp.adminReminderPopupEnabled !== undefined ? emp.adminReminderPopupEnabled :
            emp.popupEnabled !== undefined ? emp.popupEnabled :
            emp.adminPopupEnabled !== undefined ? emp.adminPopupEnabled :
            emp.enablePopupAccess !== undefined ? emp.enablePopupAccess :
            emp.popupAccessEnabled !== undefined ? emp.popupAccessEnabled :
            false; // Default to false if not found
          
          console.log('👤 Processing employee:', emp.name, '- Raw fields:', { 
            adminReminderPopupEnabled: emp.adminReminderPopupEnabled,
            popupEnabled: emp.popupEnabled,
            adminPopupEnabled: emp.adminPopupEnabled,
            enablePopupAccess: emp.enablePopupAccess,
            popupAccessEnabled: emp.popupAccessEnabled
          }, '- Final value:', popupEnabledValue);
          
          return {
            id: emp._id || emp.id,
            name: emp.name || 'Unknown',
            email: emp.email || '',
            phone: emp.phone || '',
            role: emp.role?.name || emp.role || 'Agent',
            roleId: emp.role?._id || emp.role,
            department: emp.department || 'General',
            isActive: emp.isActive !== false,
            joinDate: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-GB') : '',
            giveAdminAccess: emp.giveAdminAccess || false,
            popupEnabled: popupEnabledValue === true || popupEnabledValue === 'true',
            address: emp.address || {}
          };
        });
        
        console.log('✅ Processed employees:', processedEmployees.map(e => ({ name: e.name, popupEnabled: e.popupEnabled })));
        setEmployees(processedEmployees);
      } else {
        showAlert('error', 'Error fetching employees. Please check your connection and try again.');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showAlert('error', 'Error fetching employees. Please check your connection and try again.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [checkTokenValidity]);

  // Load roles
  const loadRoles = useCallback(async () => {
    try {
      const response = await getAllRoles();
      if (response && response.success && response.data) {
        // Filter only active roles
        const activeRoles = response.data.filter(role => role.isActive);
        setRoles(activeRoles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    }
  }, []);

  // Load USP categories
  const loadUspCategories = useCallback(async () => {
    try {
      const response = await UspService.getAllCategories();
      if (response && response.success && response.data) {
        setUspCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading USP categories:', error);
      setUspCategories([]);
    }
  }, []);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadEmployees(), loadRoles()]);
    setRefreshing(false);
  }, [loadEmployees, loadRoles]);

  // Load data on mount
  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, [loadEmployees, loadRoles]);

  // Setup FCM listeners for reminder notifications from backend
  useEffect(() => {
    console.log('📱 Setting up FCM notification listeners for Admin...');
    
    // Listen for foreground notifications
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📩 🔥 FOREGROUND notification received in EmployeeManagement:', remoteMessage);
      
      const title = remoteMessage.notification?.title || remoteMessage.data?.title || '🔔 सूचना';
      const body = remoteMessage.notification?.body || remoteMessage.data?.body || '';
      const data = remoteMessage.data || {};
      
      // Handle reminder notifications
      if (data.type === 'reminder' || data.notificationType === 'reminder') {
        console.log('🎯 Reminder notification received:', {title, body});
        
        Alert.alert(
          title,
          body,
          [
            { text: 'बंद करें', style: 'cancel' },
            { text: 'ठीक है', style: 'default' }
          ]
        );
      }
    });
    
    // Return cleanup function
    return () => {
      console.log('🛑 Cleaning up FCM listeners');
      unsubscribeForeground();
    };
  }, []);

  // Open create modal
  const openCreateModal = () => {
    setEmployeeFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      department: '',
      giveAdminAccess: false,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    });
    setFormErrors({});
    setSelectedEmployee(null);
    setCreateEditModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (employee) => {
    setEmployeeFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.roleId,
      password: '',
      department: employee.department,
      giveAdminAccess: employee.giveAdminAccess,
      address: employee.address || {}
    });
    setFormErrors({});
    setSelectedEmployee(employee);
    setCreateEditModalVisible(true);
  };

  // Open password modal
  const openPasswordModal = (employee) => {
    setPasswordFormData({
      newPassword: '',
      confirmPassword: ''
    });
    setSelectedEmployee(employee);
    setPasswordModalVisible(true);
  };

  // Open USP modal
  const openUspModal = async (employee) => {
    setUspFormData({
      categoryId: '',
      expertise: '',
      experienceYears: '',
      description: ''
    });
    setSelectedEmployee(employee);
    
    // Load USP categories if not loaded
    if (uspCategories.length === 0) {
      await loadUspCategories();
    }
    
    setUspModalVisible(true);
  };
  // Handle employee form submission
  const handleEmployeeSubmit = async () => {
    if (!validateEmployeeForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = { ...employeeFormData };
      
      // Don't send password if it's empty during edit
      if (selectedEmployee && !submitData.password.trim()) {
        delete submitData.password;
      }
      
      if (selectedEmployee) {
        // Update employee
        const response = await updateEmployee(selectedEmployee.id, submitData);
        if (response.success) {
          showAlert('success', 'Employee updated successfully!');
          setTimeout(() => {
            setCreateEditModalVisible(false);
            loadEmployees();
          }, 1500);
        } else {
          showAlert('error', response.message || 'An error occurred while updating employee');
        }
      } else {
        // Create employee
        const response = await createEmployee(submitData);
        if (response.success) {
          showAlert('success', 'Employee created successfully!');
          setTimeout(() => {
            setCreateEditModalVisible(false);
            loadEmployees();
          }, 1500);
        } else {
          showAlert('error', response.message || 'An error occurred while creating employee');
        }
      }
    } catch (error) {
      console.error('Error submitting employee:', error);
      showAlert('error', error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await changeEmployeePassword(selectedEmployee.id, {
        newPassword: passwordFormData.newPassword
      });
      
      if (response.success) {
        showAlert('success', 'Password updated successfully!');
        setTimeout(() => {
          setPasswordModalVisible(false);
        }, 1500);
      } else {
        showAlert('error', response.message || 'Error updating password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('error', error.message || 'Error updating password');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle popup
  const handleTogglePopup = async (employee, currentValue) => {
    const newValue = !currentValue;
    
    try {
      console.log('🔄 Toggle popup handler - Employee:', employee.name, 'Current:', currentValue, 'New:', newValue);
      
      // Update local state FIRST for instant UI feedback
      setEmployees(prev => {
        const updated = prev.map(e => 
          e.id === employee.id ? {...e, popupEnabled: newValue} : e
        );
        console.log('✅ Local state updated immediately - New popupEnabled:', newValue);
        return updated;
      });
      
      // Then call API to save to backend
      console.log('📤 Calling API to save popupEnabled:', newValue);
      const result = await toggleEmployeePopup(employee.id, newValue);
      
      console.log('📋 Toggle result:', result);
      
      if (result.success) {
        showAlert('success', `Popup ${newValue ? 'enabled' : 'disabled'} successfully!`);
        
        // Verify the state was actually saved by re-fetching employee
        console.log('🔍 Verifying backend saved the change...');
        setTimeout(() => {
          loadEmployees(); // Reload to verify from backend
        }, 2000);
      } else {
        // If API failed, revert the local state
        console.error('❌ API failed, reverting local state');
        setEmployees(prev => {
          const reverted = prev.map(e => 
            e.id === employee.id ? {...e, popupEnabled: currentValue} : e
          );
          console.log('⚠️ Reverted to:', currentValue);
          return reverted;
        });
        showAlert('error', result.message || 'Failed to save popup setting');
      }
    } catch (error) {
      console.error('❌ Error toggling popup:', error);
      // Revert on error
      setEmployees(prev => {
        return prev.map(e => 
          e.id === employee.id ? {...e, popupEnabled: currentValue} : e
        );
      });
      showAlert('error', error.message || 'Failed to toggle popup');
    }
  };

  // Handle USP submission
  const handleUspSubmit = async () => {
    if (!validateUspForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        employeeId: selectedEmployee.id,
        categoryId: uspFormData.categoryId,
        expertise: uspFormData.expertise,
        experienceYears: uspFormData.experienceYears ? parseInt(uspFormData.experienceYears) : undefined,
        description: uspFormData.description
      };
      
      const response = await UspService.addEmployeeById(submitData);
      
      if (response.success) {
        showAlert('success', 'Employee added to USP successfully!');
        setTimeout(() => {
          setUspModalVisible(false);
        }, 1500);
      } else {
        showAlert('error', response.message || 'Error adding employee to USP');
      }
    } catch (error) {
      console.error('Error adding employee to USP:', error);
      showAlert('error', error.message || 'Error adding employee to USP');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = (employee) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteEmployee(employee.id);
              if (response.success) {
                showAlert('success', 'Employee deleted successfully!');
                loadEmployees();
              } else {
                showAlert('error', response.message || 'Error deleting employee');
              }
            } catch (error) {
              console.error('Error deleting employee:', error);
              showAlert('error', error.message || 'Error deleting employee');
            }
          },
        },
      ]
    );
  };

  // Load reminders for employee
  const loadEmployeeReminders = async (employeeId) => {
    try {
      setRemindersLoading(true);
      
      const token = await AsyncStorage.getItem('adminToken') ||
                   await AsyncStorage.getItem('crm_auth_token') ||
                   await AsyncStorage.getItem('employee_auth_token');
      
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      const response = await fetch(
        `https://abc.bhoomitechzone.us/api/reminder/employee/${employeeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reminders: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setEmployeeReminders(data.data);
        setPreviousReminderCount(data.data.length); // Set initial count
        console.log('✅ Reminders loaded:', data.data.length);
      } else {
        setEmployeeReminders([]);
        setPreviousReminderCount(0);
      }
    } catch (error) {
      console.error('❌ Load reminders error:', error);
      setEmployeeReminders([]);
      setPreviousReminderCount(0);
    } finally {
      setRemindersLoading(false);
    }
  };

  // Handle view reminders
  const handleViewReminders = async (employee) => {
    setSelectedEmployee(employee);
    console.log('📱 Opening reminders for:', employee.name);
    // Load reminders first
    await loadEmployeeReminders(employee._id || employee.id);
    // Then open modal - this will trigger polling via useEffect
    setRemindersModalVisible(true);
  };

  // Polling for new reminders - only notify when count increases
  useEffect(() => {
    if (!pollingActive || !selectedEmployee) {
      console.log('❌ Polling not active or no employee selected. Active:', pollingActive, 'Employee:', selectedEmployee?.name);
      return;
    }

    console.log('✅ Polling STARTED for:', selectedEmployee.name, 'Current reminders count:', previousReminderCount);

    const pollInterval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem('adminToken') ||
                     await AsyncStorage.getItem('crm_auth_token') ||
                     await AsyncStorage.getItem('employee_auth_token');

        if (!token) {
          console.log('❌ No token found');
          return;
        }

        const response = await fetch(
          `https://abc.bhoomitechzone.us/api/reminder/employee/${selectedEmployee._id || selectedEmployee.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.log('❌ API response not ok:', response.status);
          return;
        }

        const data = await response.json();

        if (data.success && data.data) {
          const newReminders = data.data;
          const newCount = newReminders.length;
          
          console.log('📊 API returned:', newCount, 'reminders. Previous count was:', previousReminderCount);
          
          // Check if new reminder was added (count increased)
          if (newCount > previousReminderCount) {
            console.log('🎯 Count increased! Old:', previousReminderCount, 'New:', newCount);
            
            // Find the newly added reminder
            const newReminder = newReminders.find(r => 
              !employeeReminders.some(er => er._id === r._id)
            ) || newReminders[0];
            
            console.log('🔔 NEW REMINDER DETECTED!', newReminder.title);
            
            // Show notification immediately with employee name
            Alert.alert(
              `🔔 New Reminder Set - ${selectedEmployee?.name}`,
              `Reminder: ${newReminder.title}\nClient: ${newReminder.clientName}\n\n⏰ ${new Date(newReminder.reminderDateTime).toLocaleString()}`,
              [
                { text: 'OK', style: 'default' }
              ]
            );
            
            // Tell backend to schedule notification at reminder time (NOT using setTimeout)
            try {
              const token = await AsyncStorage.getItem('adminToken') ||
                           await AsyncStorage.getItem('crm_auth_token') ||
                           await AsyncStorage.getItem('employee_auth_token');
              
              // Call backend to schedule FCM notification at reminder time
              const scheduleResponse = await fetch(
                'https://abc.bhoomitechzone.us/api/reminder/schedule-notification',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    reminderId: newReminder._id,
                    scheduledTime: newReminder.reminderDateTime,
                    title: `⏰ Reminder Time - ${selectedEmployee?.name}`,
                    message: `Time to follow up!\n\n${newReminder.title}\nClient: ${newReminder.clientName}`,
                  })
                }
              );
              
              if (scheduleResponse.ok) {
                console.log('✅ Scheduled notification on backend for:', new Date(newReminder.reminderDateTime).toLocaleString());
              } else {
                console.log('⚠️ Backend notification scheduling failed');
              }
            } catch (error) {
              console.error('❌ Error scheduling backend notification:', error);
            }
            
            // Update reminders list silently (no loading spinner)
            setEmployeeReminders(newReminders);
            // Update count
            setPreviousReminderCount(newCount);
            console.log('✅ Reminders updated, new count:', newCount);
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds for quick detection

    return () => {
      console.log('🛑 Polling STOPPED for:', selectedEmployee?.name);
      clearInterval(pollInterval);
    };
  }, [pollingActive, selectedEmployee, selectedEmployee?.name]);

  // Handle modal open/close
  useEffect(() => {
    if (!remindersModalVisible) {
      setPollingActive(false);
      setPreviousReminderCount(0);
      setSelectedEmployee(null);
    } else {
      setPollingActive(true);
    }
  }, [remindersModalVisible]);

  // Filter employees based on search
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.phone.includes(searchText) ||
    employee.role.toLowerCase().includes(searchText.toLowerCase())
  );

  // Render employee item
  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity style={styles.employeeCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
        </View>
        
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeEmail}>{item.email}</Text>
          <Text style={styles.employeePhone}>{item.phone}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10b981' : '#ef4444' }]}>
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{item.role}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{item.department}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Join Date</Text>
            <Text style={styles.infoValue}>{item.joinDate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Admin Access</Text>
            <Text style={styles.infoValue}>{item.giveAdminAccess ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </View>
      
      {/* Enable Popup Access Row */}
      <View style={styles.popupAccessRow}>
        <View style={styles.popupAccessLeft}>
          <Icon name="notifications" size={20} color="#f59e0b" />
          <Text style={styles.popupAccessText}>Enable Popup Access</Text>
        </View>
        <Switch
          value={item.popupEnabled}
          onValueChange={() => handleTogglePopup(item, item.popupEnabled)}
          trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
          thumbColor={item.popupEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewReminders(item)}
        >
          <Icon name="list" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Reminders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Icon name="create" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openPasswordModal(item)}
        >
          <Icon name="key" size={16} color="#f59e0b" />
          <Text style={styles.actionText}>Password</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openUspModal(item)}
        >
          <Icon name="star" size={16} color="#f59e0b" />
          <Text style={styles.actionText}>USP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteEmployee(item)}
        >
          <Icon name="trash" size={16} color="#ef4444" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Create/Edit Employee Modal
  const CreateEditEmployeeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={createEditModalVisible}
      onRequestClose={() => setCreateEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedEmployee ? 'Edit Employee' : 'Create New Employee'}
            </Text>
            <TouchableOpacity
              onPress={() => setCreateEditModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={[styles.formInput, formErrors.name && styles.formInputError]}
                placeholder="Enter full name"
                value={employeeFormData.name}
                onChangeText={(text) => {
                  setEmployeeFormData(prev => ({ ...prev, name: text }));
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                }}
                placeholderTextColor="#9ca3af"
              />
              {formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={[styles.formInput, formErrors.email && styles.formInputError]}
                placeholder="Enter email address"
                value={employeeFormData.email}
                onChangeText={(text) => {
                  setEmployeeFormData(prev => ({ ...prev, email: text }));
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: null }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              {formErrors.email && (
                <Text style={styles.errorText}>{formErrors.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone *</Text>
              <TextInput
                style={[styles.formInput, formErrors.phone && styles.formInputError]}
                placeholder="Enter phone number"
                value={employeeFormData.phone}
                onChangeText={(text) => {
                  setEmployeeFormData(prev => ({ ...prev, phone: text }));
                  if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: null }));
                }}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
              {formErrors.phone && (
                <Text style={styles.errorText}>{formErrors.phone}</Text>
              )}
            </View>

            {/* Role */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Role *</Text>
              <View style={[styles.formInput, { paddingVertical: 0 }]}>
                <TouchableOpacity
                  style={styles.roleSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Role',
                      '',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        ...roles.map(role => ({
                          text: role.name,
                          onPress: () => {
                            setEmployeeFormData(prev => ({ ...prev, role: role._id }));
                            if (formErrors.role) setFormErrors(prev => ({ ...prev, role: null }));
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Text style={[styles.roleSelectorText, !employeeFormData.role && { color: '#9ca3af' }]}>
                    {employeeFormData.role 
                      ? roles.find(r => r._id === employeeFormData.role)?.name || 'Select Role'
                      : 'Select Role'
                    }
                  </Text>
                  <Icon name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {formErrors.role && (
                <Text style={styles.errorText}>{formErrors.role}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Password {selectedEmployee ? '' : '*'}
              </Text>
              {selectedEmployee && (
                <Text style={styles.formSubLabel}>Leave blank to keep current password</Text>
              )}
              <TextInput
                style={[styles.formInput, formErrors.password && styles.formInputError]}
                placeholder={selectedEmployee ? "Leave blank to keep current" : "Enter password"}
                value={employeeFormData.password}
                onChangeText={(text) => {
                  setEmployeeFormData(prev => ({ ...prev, password: text }));
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: null }));
                }}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />
              {formErrors.password && (
                <Text style={styles.errorText}>{formErrors.password}</Text>
              )}
            </View>

            {/* Department */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter department"
                value={employeeFormData.department}
                onChangeText={(text) => setEmployeeFormData(prev => ({ ...prev, department: text }))}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Admin Access */}
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.formLabel}>Give Admin Access</Text>
                <Switch
                  value={employeeFormData.giveAdminAccess}
                  onValueChange={(value) => setEmployeeFormData(prev => ({ ...prev, giveAdminAccess: value }))}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={employeeFormData.giveAdminAccess ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Address */}
            <Text style={styles.sectionTitle}>Address (Optional)</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Street</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter street address"
                value={employeeFormData.address.street}
                onChangeText={(text) => 
                  setEmployeeFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: text }
                  }))
                }
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>City</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="City"
                  value={employeeFormData.address.city}
                  onChangeText={(text) => 
                    setEmployeeFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: text }
                    }))
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="State"
                  value={employeeFormData.address.state}
                  onChangeText={(text) => 
                    setEmployeeFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: text }
                    }))
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Zip Code</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Zip"
                  value={employeeFormData.address.zipCode}
                  onChangeText={(text) => 
                    setEmployeeFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, zipCode: text }
                    }))
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Country"
                  value={employeeFormData.address.country}
                  onChangeText={(text) => 
                    setEmployeeFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, country: text }
                    }))
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </ScrollView>
          
          {/* Fixed Action Buttons */}
          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCreateEditModalVisible(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!employeeFormData.name.trim() || !employeeFormData.email.trim() || 
                 !employeeFormData.phone.trim() || !employeeFormData.role || 
                 (!selectedEmployee && !employeeFormData.password.trim()) || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleEmployeeSubmit}
              disabled={!employeeFormData.name.trim() || !employeeFormData.email.trim() || 
                       !employeeFormData.phone.trim() || !employeeFormData.role || 
                       (!selectedEmployee && !employeeFormData.password.trim()) || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {selectedEmployee ? 'Update Employee' : 'Create Employee'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Password Change Modal
  const PasswordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={passwordModalVisible}
      onRequestClose={() => setPasswordModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => setPasswordModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              Change password for {selectedEmployee?.name}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Password *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter new password"
                value={passwordFormData.newPassword}
                onChangeText={(text) => setPasswordFormData(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm Password *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Confirm new password"
                value={passwordFormData.confirmPassword}
                onChangeText={(text) => setPasswordFormData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
          
          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setPasswordModalVisible(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!passwordFormData.newPassword.trim() || !passwordFormData.confirmPassword.trim() || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handlePasswordSubmit}
              disabled={!passwordFormData.newPassword.trim() || !passwordFormData.confirmPassword.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // USP Modal
  const UspModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={uspModalVisible}
      onRequestClose={() => setUspModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to USP</Text>
            <TouchableOpacity
              onPress={() => setUspModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.infoAlert}>
              <Icon name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoAlertText}>
                Add {selectedEmployee?.name} to USP (Unique Selling Proposition) to showcase their expertise.
              </Text>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>USP Category *</Text>
              <View style={styles.formInput}>
                <TouchableOpacity
                  style={styles.roleSelector}
                  onPress={() => {
                    if (uspCategories.length === 0) {
                      showAlert('error', 'No USP categories available. Please create categories first.');
                      return;
                    }
                    
                    Alert.alert(
                      'Select USP Category',
                      '',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        ...uspCategories.map(category => ({
                          text: category.name,
                          onPress: () => {
                            setUspFormData(prev => ({ ...prev, categoryId: category._id }));
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Text style={[styles.roleSelectorText, !uspFormData.categoryId && { color: '#9ca3af' }]}>
                    {uspFormData.categoryId 
                      ? uspCategories.find(c => c._id === uspFormData.categoryId)?.name || 'Select Category'
                      : 'Select Category'
                    }
                  </Text>
                  <Icon name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expertise */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Expertise</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Residential Properties, Commercial Real Estate"
                value={uspFormData.expertise}
                onChangeText={(text) => setUspFormData(prev => ({ ...prev, expertise: text }))}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Experience Years */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Experience Years</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter years of experience"
                value={uspFormData.experienceYears}
                onChangeText={(text) => setUspFormData(prev => ({ ...prev, experienceYears: text }))}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 80 }]}
                placeholder="Describe their specialization and achievements..."
                value={uspFormData.description}
                onChangeText={(text) => setUspFormData(prev => ({ ...prev, description: text }))}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setUspModalVisible(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!uspFormData.categoryId || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleUspSubmit}
              disabled={!uspFormData.categoryId || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Add to USP</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const RemindersModal = React.useMemo(() => () => (
    <Modal
      visible={remindersModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setRemindersModalVisible(false)}
    >
      <SafeAreaView style={styles.reminderModalContainer}>
        <View style={styles.reminderModalContent}>
          {/* Modal Header */}
          <View style={styles.reminderModalHeader}>
            <View style={styles.reminderHeaderLeft}>
              <Icon name="alarm-multiple" size={28} color="#3b82f6" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.reminderModalTitle}>{selectedEmployee?.name}</Text>
                <Text style={styles.reminderModalSubtitle}>
                  {employeeReminders?.length || 0} reminders set
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reminderCloseButton}
              onPress={() => setRemindersModalVisible(false)}
            >
              <Icon name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          {remindersLoading && employeeReminders.length === 0 ? (
            <View style={styles.reminderLoadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading reminders...</Text>
            </View>
          ) : employeeReminders && employeeReminders.length > 0 ? (
            <ScrollView style={styles.remindersListContainer}>
              {employeeReminders.map((reminder, index) => {
                const reminderDate = new Date(reminder.reminderDateTime);
                const isOverdue = new Date() > reminderDate;

                return (
                  <View key={reminder._id || index} style={[styles.reminderCard, isOverdue && styles.overdueCard]}>
                    <View style={styles.reminderCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reminderTitle}>{reminder.title}</Text>
                        <Text style={styles.reminderClient}>{reminder.clientName}</Text>
                      </View>
                      <View style={[styles.reminderBadge, { backgroundColor: isOverdue ? '#fed7d7' : '#dbeafe' }]}>
                        <Text style={[styles.reminderBadgeText, { color: isOverdue ? '#991b1b' : '#1e40af' }]}>
                          {isOverdue ? 'OVERDUE' : 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reminderDetails}>
                      <View style={styles.detailRow}>
                        <Icon name="call" size={14} color="#6b7280" />
                        <Text style={styles.detailText}>{reminder.phone}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Icon name="mail" size={14} color="#6b7280" />
                        <Text style={styles.detailText} numberOfLines={1}>{reminder.email}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Icon name="calendar" size={14} color="#6b7280" />
                        <Text style={styles.detailText}>
                          {reminderDate.toLocaleDateString()} at {reminderDate.toLocaleTimeString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reminderStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Triggered</Text>
                        <Text style={styles.statValue}>{reminder.triggerCount || 0}x</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Snoozed</Text>
                        <Text style={styles.statValue}>{reminder.snoozeCount || 0}x</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Status</Text>
                        <Text style={styles.statValue}>{reminder.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyRemindersContainer}>
              <Icon name="inbox" size={64} color="#d1d5db" />
              <Text style={styles.emptyRemindersTitle}>No Reminders</Text>
              <Text style={styles.emptyRemindersText}>
                {selectedEmployee?.name} hasn't set any reminders yet
              </Text>
            </View>
          )}

          {/* Modal Footer */}
          <TouchableOpacity
            style={styles.reminderCloseFooterButton}
            onPress={() => setRemindersModalVisible(false)}
          >
            <Text style={styles.reminderCloseFooterButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  ), [remindersModalVisible, selectedEmployee?.name, employeeReminders, remindersLoading]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1e293b" 
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openCreateModal}
        >
          <Icon name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{employees.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {employees.filter(emp => emp.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>
              {employees.filter(emp => !emp.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        ) : filteredEmployees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {searchText ? 'No employees found' : 'No employees found'}
            </Text>
            <Text style={styles.emptySubText}>
              {searchText 
                ? 'Try adjusting your search criteria'
                : 'Create your first employee!'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEmployees}
            renderItem={renderEmployeeItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
          />
        )}
      </View>
      
      <CreateEditEmployeeModal />
      <PasswordModal />
      <UspModal />
      <RemindersModal />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  listContainer: {
    paddingBottom: 20,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  employeePhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  popupAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  popupAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
    marginLeft: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editButton: {
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
  },
  passwordButton: {
    borderColor: '#fef3c7',
    backgroundColor: '#fffbeb',
  },
  uspButton: {
    borderColor: '#fef3c7',
    backgroundColor: '#fffbeb',
  },
  deleteButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
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
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 12,
  },
  // Form styles
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formSubLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: -4,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  formInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoAlertText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
  },
  // Modal action buttons (fixed at bottom)
  modalActionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Reminders Modal Styles
  reminderModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  reminderModalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  reminderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reminderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  reminderModalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  reminderCloseButton: {
    padding: 8,
  },
  reminderLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remindersListContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reminderCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  overdueCard: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  reminderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reminderClient: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  reminderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reminderDetails: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  reminderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyRemindersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyRemindersTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyRemindersText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  reminderCloseFooterButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reminderCloseFooterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmployeeManagementScreen;
