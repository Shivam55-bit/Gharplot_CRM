/**
 * EnquiriesScreen.js
 * Comprehensive CRM Admin screen for managing customer enquiries
 * Refactored with modular components and full CRM features
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import services
import { 
  getAllEnquiriesMerged, 
  getAvailableEmployees, 
  getAvailableRoles,
  assignEnquiriesToEmployee,
  unassignEnquiry,
  createReminder,
  createFollowUp,
  addManualEnquiry
} from '../../services/crmEnquiryApi';

// Import components
import EnquiryCard from '../../components/Enquiries/EnquiryCard';
import AddEnquiryModal from '../../components/Enquiries/modals/AddEnquiryModal';
import AssignEnquiryModal from '../../components/Enquiries/modals/AssignEnquiryModal';
import AutoAssignModal from '../../components/Enquiries/modals/AutoAssignModal';
import ReminderModal from '../../components/Enquiries/modals/ReminderModal';
import FollowUpModal from '../../components/Enquiries/modals/FollowUpModal';

// Import styles
import styles from './EnquiriesScreenStyles';

const EnquiriesScreen = ({ navigation }) => {
  // Data states
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, client: 0, manual: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Employee and role data
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  // UI states
  const [searchText, setSearchText] = useState('');
  const [filterSource, setFilterSource] = useState('all'); // all, client, manual
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Pagination states (10 items per page matching web)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection states
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [autoAssignModalVisible, setAutoAssignModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);

  // Permission states
  const [userRole, setUserRole] = useState('admin');

  // Check user permissions
  useEffect(() => {
    checkUserPermissions();
  }, []);

  const checkUserPermissions = async () => {
    try {
      const adminToken = await AsyncStorage.getItem('adminToken');
      const employeeToken = await AsyncStorage.getItem('employeeToken');
      
      if (adminToken) {
        setUserRole('admin');
      } else if (employeeToken) {
        setUserRole('employee');
      } else {
        setUserRole('user');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setUserRole('user');
    }
  };

  // Fetch enquiries data with enhanced error handling
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const response = await getAllEnquiriesMerged();
      
      if (response.success) {
        setEnquiries(response.data || []);
        setFilteredEnquiries(response.data || []);
        setStats(response.stats || { total: 0, client: 0, manual: 0 });
      } else {
        console.warn('Failed to fetch enquiries:', response.message);
        showErrorToast('Failed to fetch enquiries');
        setEnquiries([]);
        setFilteredEnquiries([]);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      showErrorToast('Failed to fetch enquiries. Please try again.');
      setEnquiries([]);
      setFilteredEnquiries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch available employees for assignment with error handling
  const fetchEmployees = async () => {
    if (userRole !== 'admin') return;
    
    try {
      setEmployeesLoading(true);
      const response = await getAvailableEmployees();
      
      if (response.success) {
        setEmployees(response.data || []);
        if (response.data.length === 0) {
          showInfoToast('No employees found. Please create employees in Employee Management first.');
        }
      } else {
        console.warn('Failed to fetch employees:', response.message);
        showErrorToast('Failed to fetch employees');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showErrorToast('Failed to fetch employees. Make sure employees exist in the system.');
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Fetch available roles for auto assignment with error handling
  const fetchRoles = async () => {
    if (userRole !== 'admin') return;
    
    try {
      setRolesLoading(true);
      const response = await getAvailableRoles();
      
      if (response.success) {
        setRoles(response.data || []);
      } else {
        console.warn('Failed to fetch roles:', response.message);
        showErrorToast('Failed to fetch roles');
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showErrorToast('Failed to fetch roles');
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEnquiries();
    if (userRole === 'admin') {
      fetchEmployees();
      fetchRoles();
    }
  }, [userRole]);

  // Filter enquiries based on search and source
  useEffect(() => {
    let filtered = enquiries;

    // Filter by source
    if (filterSource !== 'all') {
      filtered = filtered.filter(enquiry => 
        enquiry.source === filterSource
      );
    }

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(enquiry => {
        // Safe property access to avoid object rendering issues
        const clientName = enquiry.clientName || '';
        const email = enquiry.email || '';
        const contactNumber = enquiry.contactNumber || '';
        const propertyId = typeof enquiry.propertyId === 'object' ? enquiry.propertyId?._id : enquiry.propertyId;
        const propertyLocation = enquiry.propertyLocation || '';
        
        return clientName.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               contactNumber.includes(searchText) ||
               (propertyId && propertyId.toString().includes(searchText)) ||
               propertyLocation.toLowerCase().includes(searchLower);
      });
    }

    setFilteredEnquiries(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [enquiries, searchText, filterSource]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSelectedEnquiries([]);
    setSelectionMode(false);
    fetchEnquiries();
    if (userRole === 'admin') {
      fetchEmployees();
      fetchRoles();
    }
  }, [userRole]);

  // Show toast message with different types (matching web implementation)
  const showToast = (message, type = 'SHORT') => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, type === 'LONG' ? ToastAndroid.LONG : ToastAndroid.SHORT);
    } else {
      // For iOS, use Alert as fallback (or install react-native-toast-message for better experience)
      Alert.alert('', message);
    }
  };

  const showSuccessToast = (message) => showToast(`✅ ${message}`, 'SHORT');
  const showErrorToast = (message) => showToast(`❌ ${message}`, 'LONG');
  const showWarningToast = (message) => showToast(`⚠️ ${message}`, 'LONG');
  const showInfoToast = (message) => showToast(`ℹ️ ${message}`, 'SHORT');

  // Handle enquiry selection with validation (matching web)
  const handleEnquirySelect = (enquiry) => {
    // Cannot select enquiries that are already assigned (matching web)
    if (enquiry.assignment) {
      showWarningToast('Cannot select enquiries that are already assigned to an employee');
      return;
    }
    
    const enquirySelection = { 
      enquiryId: enquiry._id, 
      enquiryType: enquiry.enquiryType 
    };
    
    const isSelected = selectedEnquiries.some(
      selected => selected.enquiryId === enquiry._id
    );

    if (isSelected) {
      setSelectedEnquiries(prev => 
        prev.filter(selected => selected.enquiryId !== enquiry._id)
      );
    } else {
      setSelectedEnquiries(prev => [...prev, enquirySelection]);
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedEnquiries([]);
    }
  };

  // Select all enquiries
  const handleSelectAll = () => {
    const unassignedEnquiries = filteredEnquiries.filter(
      enquiry => !enquiry.assignment
    );
    
    if (selectedEnquiries.length === unassignedEnquiries.length) {
      setSelectedEnquiries([]);
    } else {
      const allSelections = unassignedEnquiries.map(enquiry => ({
        enquiryId: enquiry._id,
        enquiryType: enquiry.enquiryType,
      }));
      setSelectedEnquiries(allSelections);
    }
  };

  // Handle unassign with enhanced notifications
  const handleUnassign = async (enquiry) => {
    Alert.alert(
      'Unassign Enquiry',
      `Are you sure you want to unassign this enquiry from ${enquiry.assignment?.employeeId?.fullName || enquiry.assignment?.employeeId || 'the assigned employee'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await unassignEnquiry(enquiry._id, enquiry.enquiryType);
              if (result.success) {
                showSuccessToast('Lead unassigned successfully');
                fetchEnquiries();
              } else {
                showErrorToast(result.message || 'Failed to unassign enquiry');
              }
            } catch (error) {
              showErrorToast('Failed to unassign enquiry. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Modal handlers with enhanced toast notifications
  const handleAddSuccess = () => {
    setAddModalVisible(false);
    fetchEnquiries();
    showSuccessToast('Enquiry created successfully!');
  };

  const handleAssignSuccess = () => {
    setAssignModalVisible(false);
    setSelectedEnquiries([]);
    setSelectionMode(false);
    fetchEnquiries();
    showSuccessToast('Enquiries assigned successfully!');
  };

  const handleAutoAssignSuccess = () => {
    setAutoAssignModalVisible(false);
    setSelectedEnquiries([]);
    setSelectionMode(false);
    fetchEnquiries();
    showSuccessToast('Auto assignment completed!');
  };

  const handleReminderSuccess = () => {
    setReminderModalVisible(false);
    showSuccessToast('Reminder created successfully!');
  };

  const handleFollowUpSuccess = () => {
    setFollowUpModalVisible(false);
    fetchEnquiries();
    showSuccessToast('Follow-up created successfully!');
  };

  const handleSetReminder = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setReminderModalVisible(true);
  };

  const handleFollowUp = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setFollowUpModalVisible(true);
  };

  const showEnquiryDetails = (enquiry) => {
    if (!selectionMode) {
      setSelectedEnquiry(enquiry);
      setDetailsModalVisible(true);
    }
  };

  // Render enquiry item
  const renderEnquiryItem = ({ item }) => {
    const isSelected = selectedEnquiries.some(
      selected => selected.enquiryId === item._id
    );
    const canSelect = !item.assignment; // Can only select unassigned enquiries

    return (
      <EnquiryCard
        enquiry={item}
        isSelected={isSelected}
        onSelect={() => handleEnquirySelect(item)}
        onPress={() => showEnquiryDetails(item)}
        onSetReminder={handleSetReminder}
        onFollowUp={handleFollowUp}
        onUnassign={handleUnassign}
        canSelect={canSelect}
        showCheckbox={selectionMode}
      />
    );
  };

  // Filter buttons
  const FilterButtons = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All', count: stats.total },
        { key: 'client', label: 'Client', count: stats.client },
        { key: 'manual', label: 'Manual', count: stats.manual },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            filterSource === filter.key && styles.filterButtonActive
          ]}
          onPress={() => setFilterSource(filter.key)}
        >
          <Text style={[
            styles.filterButtonText,
            filterSource === filter.key && styles.filterButtonTextActive
          ]}>
            {filter.label} ({filter.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Empty state
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="contact-mail" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Enquiries Found</Text>
      <Text style={styles.emptyMessage}>
        {searchText ? 'No enquiries match your search.' : 'No enquiries available.'}
      </Text>
      {userRole === 'admin' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Icon name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Add First Enquiry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const unassignedCount = filteredEnquiries.filter(e => !e.assignment).length;
  const canShowAssignButtons = userRole === 'admin' && selectedEnquiries.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Property Enquiries</Text>
          <Text style={styles.subtitle}>
            {filteredEnquiries.length} of {enquiries.length} enquiries
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Icon name="refresh" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Statistics Badges - Matching Web Design */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBadge, styles.statBadgeTotal]}>
          <Icon name="list-alt" size={20} color="#3b82f6" />
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
        
        <View style={[styles.statBadge, styles.statBadgeClient]}>
          <Icon name="people" size={20} color="#10b981" />
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats.client}</Text>
            <Text style={styles.statLabel}>Client</Text>
          </View>
        </View>
        
        <View style={[styles.statBadge, styles.statBadgeManual]}>
          <Icon name="person-add" size={20} color="#f59e0b" />
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats.manual}</Text>
            <Text style={styles.statLabel}>Manual</Text>
          </View>
        </View>
      </View>

      {/* Action Bar - Always show for debugging */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addEnquiryButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Icon name="add" size={20} color="#ffffff" />
          <Text style={styles.addEnquiryText}>Add Enquiry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectionButton, selectionMode && styles.selectionButtonActive]}
          onPress={toggleSelectionMode}
        >
          <Icon name={selectionMode ? "close" : "checklist"} size={20} color="#ffffff" />
          <Text style={styles.selectionButtonText}>
            {selectionMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Assignment Bar */}
      {selectedEnquiries.length > 0 && (
        <View style={styles.assignmentBar}>
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => setAssignModalVisible(true)}
          >
            <Icon name="person-add" size={18} color="#ffffff" />
            <Text style={styles.assignButtonText}>Assign ({selectedEnquiries.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.autoAssignButton}
            onPress={() => setAutoAssignModalVisible(true)}
          >
            <Icon name="auto-awesome" size={18} color="#ffffff" />
            <Text style={styles.autoAssignButtonText}>Auto Assign ({selectedEnquiries.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
          >
            <Text style={styles.selectAllButtonText}>
              {selectedEnquiries.length === unassignedCount ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone, property..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="clear" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <FilterButtons />

      {/* Enquiries List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading enquiries...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedEnquiries}
            keyExtractor={(item) => item._id}
            renderItem={renderEnquiryItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
              />
            }
            ListEmptyComponent={EmptyState}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Pagination Controls - Matching Web Design */}
          {filteredEnquiries.length > 0 && (
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationInfo}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredEnquiries.length)} of {filteredEnquiries.length} enquiries
              </Text>
              
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#9ca3af' : '#374151'} />
                  <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Prev</Text>
                </TouchableOpacity>
                
                {/* Page Numbers */}
                <View style={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <TouchableOpacity
                        key={pageNumber}
                        style={[
                          styles.pageNumberButton,
                          currentPage === pageNumber && styles.pageNumberButtonActive
                        ]}
                        onPress={() => goToPage(pageNumber)}
                      >
                        <Text style={[
                          styles.pageNumberText,
                          currentPage === pageNumber && styles.pageNumberTextActive
                        ]}>
                          {pageNumber}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
                  <Icon name="chevron-right" size={20} color={currentPage === totalPages ? '#9ca3af' : '#374151'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enquiry Details</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedEnquiry && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Client Information</Text>
                    <Text style={styles.modalText}>Name: {selectedEnquiry.clientName}</Text>
                    <Text style={styles.modalText}>Email: {selectedEnquiry.email}</Text>
                    <Text style={styles.modalText}>Phone: {selectedEnquiry.contactNumber}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Property Information</Text>
                    <Text style={styles.modalText}>Property ID: {typeof selectedEnquiry.propertyId === 'object' ? selectedEnquiry.propertyId?._id || 'N/A' : selectedEnquiry.propertyId || 'N/A'}</Text>
                    <Text style={styles.modalText}>Type: {selectedEnquiry.propertyType}</Text>
                    <Text style={styles.modalText}>Location: {selectedEnquiry.propertyLocation}</Text>
                    {selectedEnquiry.price !== 'N/A' && (
                      <Text style={styles.modalText}>Price: ₹{typeof selectedEnquiry.price === 'object' ? 'N/A' : selectedEnquiry.price}</Text>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Additional Details</Text>
                    <Text style={styles.modalText}>Source: {selectedEnquiry.source}</Text>
                    <Text style={styles.modalText}>Status: {selectedEnquiry.status}</Text>
                    <Text style={styles.modalText}>Created: {new Date(selectedEnquiry.createdAt).toLocaleString()}</Text>
                    {selectedEnquiry.assignment && (
                      <Text style={styles.modalText}>
                        Assigned to: {selectedEnquiry.assignment.employeeId?.fullName || 'Unknown Employee'}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <AddEnquiryModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        addEnquiryAPI={addManualEnquiry}
        onSuccess={handleAddSuccess}
        totalEnquiries={enquiries.length}
      />

      <AssignEnquiryModal
        visible={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        selectedEnquiries={selectedEnquiries}
        employees={employees}
        employeesLoading={employeesLoading}
        onSuccess={handleAssignSuccess}
      />

      <AutoAssignModal
        visible={autoAssignModalVisible}
        onClose={() => setAutoAssignModalVisible(false)}
        selectedEnquiries={selectedEnquiries}
        roles={roles}
        employees={employees}
        rolesLoading={rolesLoading}
        onSuccess={handleAutoAssignSuccess}
      />

      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        enquiry={selectedEnquiry}
        createReminderAPI={createReminder}
        onSuccess={handleReminderSuccess}
      />

      <FollowUpModal
        visible={followUpModalVisible}
        onClose={() => setFollowUpModalVisible(false)}
        enquiry={selectedEnquiry}
        createFollowUpAPI={createFollowUp}
        onSuccess={handleFollowUpSuccess}
      />
    </View>
  );
};

export default EnquiriesScreen;