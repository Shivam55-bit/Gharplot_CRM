/**
 * Employee Leads Screen
 * Unified view for both Enquiry Leads and Client Leads
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://abc.bhoomitechzone.us';

const EmployeeLeads = ({ navigation }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statsData, setStatsData] = useState({
    total: 0,
    enquiry: 0,
    client: 0,
    active: 0,
    completed: 0,
  });

  // Filter Options
  const STATUS_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const TYPE_OPTIONS = [
    { label: 'All Types', value: 'all' },
    { label: 'Enquiry Leads', value: 'enquiry' },
    { label: 'Client Leads', value: 'client' },
  ];

  // ============================================
  // LIFECYCLE
  // ============================================
  useEffect(() => {
    loadLeads();
    loadFavorites();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchQuery, leads, selectedStatus, selectedType, showFavorites]);

  // ============================================
  // FAVORITES MANAGEMENT
  // ============================================
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('employeeLeadsFavorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (leadId) => {
    try {
      let newFavorites;
      if (favorites.includes(leadId)) {
        newFavorites = favorites.filter(id => id !== leadId);
      } else {
        newFavorites = [...favorites, leadId];
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem('employeeLeadsFavorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // ============================================
  // GET AUTH TOKEN
  // ============================================
  const getToken = async () => {
    let token = await AsyncStorage.getItem('employee_auth_token');
    if (!token) token = await AsyncStorage.getItem('employee_token');
    if (!token) token = await AsyncStorage.getItem('employeeToken');
    if (!token) token = await AsyncStorage.getItem('admin_token');
    if (!token) token = await AsyncStorage.getItem('adminToken');
    if (!token) token = await AsyncStorage.getItem('crm_auth_token');
    if (!token) token = await AsyncStorage.getItem('token');
    return token;
  };

  // ============================================
  // FETCH LEADS (Both Types in Parallel)
  // ============================================
  const loadLeads = async () => {
    try {
      setIsLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        setIsLoading(false);
        return;
      }

      console.log('🔄 Fetching both enquiry and client leads...');

      // Fetch both lead types in parallel
      const [enquiryResponse, clientResponse] = await Promise.all([
        // Enquiry Leads
        fetch(`${API_BASE_URL}/employee/leads/my-leads`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        // Client Leads
        fetch(`${API_BASE_URL}/employee/user-leads/my-client-leads`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      // Parse responses
      let enquiryData = { success: false, data: { assignments: [] } };
      let clientData = { success: false, data: { assignments: [] } };

      if (enquiryResponse.ok) {
        const enquiryText = await enquiryResponse.text();
        try {
          enquiryData = JSON.parse(enquiryText);
          console.log('✅ Enquiry leads fetched:', enquiryData?.data?.assignments?.length || 0);
        } catch (error) {
          console.error('Failed to parse enquiry JSON:', error);
        }
      } else {
        console.log('⚠️ Enquiry leads endpoint returned:', enquiryResponse.status);
      }

      if (clientResponse.ok) {
        const clientText = await clientResponse.text();
        try {
          clientData = JSON.parse(clientText);
          console.log('✅ Client leads fetched:', clientData?.data?.assignments?.length || 0);
        } catch (error) {
          console.error('Failed to parse client JSON:', error);
        }
      } else {
        console.log('⚠️ Client leads endpoint returned:', clientResponse.status);
      }

      // Transform and combine leads
      const transformedLeads = [];

      // Process Enquiry Leads
      if (enquiryData.success && enquiryData.data?.assignments) {
        const enquiryLeads = enquiryData.data.assignments.map(assignment => ({
          _id: assignment._id,
          leadType: 'enquiry',
          assignmentId: assignment._id,
          
          // Client Info from enquiry.buyerId
          clientName: assignment.enquiry?.buyerId?.fullName || 'N/A',
          clientPhone: assignment.enquiry?.buyerId?.phone || 'N/A',
          clientEmail: assignment.enquiry?.buyerId?.email || 'N/A',
          
          // Property Info
          propertyType: assignment.enquiry?.propertyId?.propertyType || 'N/A',
          propertyLocation: assignment.enquiry?.propertyId?.propertyLocation || 'N/A',
          propertyPrice: assignment.enquiry?.propertyId?.price || 0,
          
          // Assignment Info
          priority: assignment.priority || 'medium',
          status: assignment.status || 'active',
          assignedDate: assignment.assignedDate,
          notes: assignment.notes || '',
          message: assignment.enquiry?.message || '',
          
          // Employee Info
          employeeName: assignment.employeeId?.name || '',
          employeeEmail: assignment.employeeId?.email || '',
          
          // Raw data for reference
          rawData: assignment,
        }));
        transformedLeads.push(...enquiryLeads);
      }

      // Process Client Leads
      if (clientData.success && clientData.data?.assignments) {
        const clientLeads = clientData.data.assignments.map(assignment => ({
          _id: assignment._id,
          leadType: 'client',
          assignmentId: assignment._id,
          
          // Client Info from userId
          clientName: assignment.userId?.fullName || 'N/A',
          clientPhone: assignment.userId?.phone || 'N/A',
          clientEmail: assignment.userId?.email || 'N/A',
          
          // Location Info
          city: assignment.userId?.city || '',
          state: assignment.userId?.state || '',
          propertyLocation: `${assignment.userId?.city || ''}, ${assignment.userId?.state || ''}`.trim().replace(/^,|,$/g, '') || 'N/A',
          
          // User Verification
          isEmailVerified: assignment.userId?.isEmailVerified || false,
          isPhoneVerified: assignment.userId?.isPhoneVerified || false,
          lastLogin: assignment.userId?.lastLogin,
          
          // Assignment Info
          priority: assignment.priority || 'medium',
          status: assignment.status || 'active',
          assignedDate: assignment.assignedDate,
          notes: assignment.notes || '',
          
          // Assignment By
          assignedBy: assignment.assignedBy?.fullName || 'Admin',
          
          // Employee Info
          employeeName: assignment.employeeId?.name || '',
          employeeEmail: assignment.employeeId?.email || '',
          
          // Raw data
          rawData: assignment,
        }));
        transformedLeads.push(...clientLeads);
      }

      // Sort by assigned date (newest first)
      transformedLeads.sort((a, b) => 
        new Date(b.assignedDate) - new Date(a.assignedDate)
      );

      setLeads(transformedLeads);
      
      // Calculate statistics
      setStatsData({
        total: transformedLeads.length,
        enquiry: transformedLeads.filter(l => l.leadType === 'enquiry').length,
        client: transformedLeads.filter(l => l.leadType === 'client').length,
        active: transformedLeads.filter(l => l.status === 'active').length,
        completed: transformedLeads.filter(l => l.status === 'completed').length,
      });

      console.log('📊 Total leads loaded:', transformedLeads.length);

    } catch (error) {
      console.error('❌ Error loading leads:', error);
      Alert.alert('Error', 'Failed to load leads. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ============================================
  // FILTER LEADS
  // ============================================
  const filterLeads = () => {
    let filtered = [...leads];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === selectedStatus);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(lead => lead.leadType === selectedType);
    }

    // Filter by favorites
    if (showFavorites) {
      filtered = filtered.filter(lead => favorites.includes(lead._id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.clientName?.toLowerCase().includes(query) ||
        lead.clientPhone?.toLowerCase().includes(query) ||
        lead.clientEmail?.toLowerCase().includes(query) ||
        lead.propertyLocation?.toLowerCase().includes(query)
      );
    }

    setFilteredLeads(filtered);
  };

  // ============================================
  // UPDATE LEAD STATUS
  // ============================================
  const handleStatusChange = async (lead, newStatus) => {
    try {
      const token = await getToken();

      console.log(`🔄 Updating ${lead.leadType} lead status to:`, newStatus);

      // Different endpoints for different lead types
      const endpoint = lead.leadType === 'enquiry' 
        ? `${API_BASE_URL}/employee/leads/status/${lead.assignmentId}`
        : `${API_BASE_URL}/employee/user-leads/status/${lead.assignmentId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setLeads(prev =>
          prev.map(l =>
            l._id === lead._id ? { ...l, status: newStatus } : l
          )
        );
        Alert.alert('Success', 'Lead status updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      Alert.alert('Error', 'Failed to update lead status');
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      active: '#3B82F6',
      completed: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: 'clock-outline',
      completed: 'check-circle',
      cancelled: 'close-circle',
    };
    return icons[status] || 'help-circle';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#DC2626',
      high: '#F59E0B',
      medium: '#3B82F6',
      low: '#10B981',
    };
    return colors[priority] || '#6B7280';
  };

  const getLeadTypeColor = (type) => {
    return type === 'enquiry' ? '#8B5CF6' : '#06B6D4';
  };

  const getLeadTypeIcon = (type) => {
    return type === 'enquiry' ? 'home-search' : 'account-tie';
  };

  // ============================================
  // RENDER LEAD CARD
  // ============================================
  const renderLeadCard = ({ item }) => {
    const isFavorite = favorites.includes(item._id);

    return (
      <View style={styles.leadCard}>
        {/* Lead Header with Type Badge and Priority */}
        <View style={styles.leadHeader}>
          <View style={styles.headerLeft}>
            {/* Lead Type Badge */}
            <View style={[styles.typeBadge, { backgroundColor: `${getLeadTypeColor(item.leadType)}20` }]}>
              <Icon name={getLeadTypeIcon(item.leadType)} size={14} color={getLeadTypeColor(item.leadType)} />
              <Text style={[styles.typeText, { color: getLeadTypeColor(item.leadType) }]}>
                {item.leadType === 'enquiry' ? 'Enquiry' : 'Client'}
              </Text>
            </View>
            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(item.priority)}15` }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority?.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Favorite Button */}
          <TouchableOpacity onPress={() => toggleFavorite(item._id)}>
            <Icon 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isFavorite ? '#EF4444' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={styles.contactRow}>
            <Icon name="phone" size={14} color="#6B7280" />
            <Text style={styles.contactText}>{item.clientPhone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="email" size={14} color="#6B7280" />
            <Text style={styles.contactText}>{item.clientEmail}</Text>
          </View>
          {item.propertyLocation && item.propertyLocation !== 'N/A' && (
            <View style={styles.contactRow}>
              <Icon name="map-marker" size={14} color="#6B7280" />
              <Text style={styles.contactText}>{item.propertyLocation}</Text>
            </View>
          )}
        </View>

        {/* Property Details (Enquiry Leads) */}
        {item.leadType === 'enquiry' && (
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyLabel}>Property Type:</Text>
            <Text style={styles.propertyValue}>{item.propertyType}</Text>
            {item.propertyPrice > 0 && (
              <>
                <Text style={styles.propertyLabel}>Price:</Text>
                <Text style={styles.propertyValue}>₹{(item.propertyPrice / 100000).toFixed(2)}L</Text>
              </>
            )}
          </View>
        )}

        {/* Verification Badges (Client Leads) */}
        {item.leadType === 'client' && (
          <View style={styles.verificationInfo}>
            {item.isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-decagram" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Email Verified</Text>
              </View>
            )}
            {item.isPhoneVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-decagram" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Phone Verified</Text>
              </View>
            )}
          </View>
        )}

        {/* Status and Date */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Icon name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {/* Notes/Message */}
        {(item.notes || item.message) && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes || item.message}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B98120' }]}
            onPress={() => handleStatusChange(item, 'completed')}
            disabled={item.status === 'completed'}
          >
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={[styles.actionText, { color: '#10B981' }]}>Complete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F620' }]}
            onPress={() => handleStatusChange(item, 'active')}
            disabled={item.status === 'active'}
          >
            <Icon name="restore" size={16} color="#3B82F6" />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>Reactivate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF444420' }]}
            onPress={() => handleStatusChange(item, 'cancelled')}
            disabled={item.status === 'cancelled'}
          >
            <Icon name="close-circle" size={16} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER STATS BAR
  // ============================================
  const renderStatsBar = () => (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{statsData.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{statsData.enquiry}</Text>
        <Text style={styles.statLabel}>Enquiry</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: '#06B6D4' }]}>{statsData.client}</Text>
        <Text style={styles.statLabel}>Client</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: '#3B82F6' }]}>{statsData.active}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: '#10B981' }]}>{statsData.completed}</Text>
        <Text style={styles.statLabel}>Done</Text>
      </View>
    </View>
  );

  // ============================================
  // RENDER EMPTY STATE
  // ============================================
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="briefcase-off-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>No leads found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? 'Try adjusting your search filters' 
          : showFavorites
          ? 'No favorite leads yet'
          : 'Check back later for new assignments'}
      </Text>
    </View>
  );

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading All Leads...</Text>
        <Text style={styles.loadingSubtext}>Fetching enquiry and client leads</Text>
      </View>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Leads</Text>
            <Text style={styles.headerSubtitle}>Manage all your assignments</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => setFilterModalVisible(true)}
          >
            <Icon name="filter-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      {renderStatsBar()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Leads</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Lead Type</Text>
                <View style={styles.filterChipsContainer}>
                  {TYPE_OPTIONS.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.filterChip,
                        selectedType === item.value && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedType(item.value)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedType === item.value && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.filterChipsContainer}>
                  {STATUS_OPTIONS.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.filterChip,
                        selectedStatus === item.value && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedStatus(item.value)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedStatus === item.value && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Favorites Toggle */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Favorites</Text>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    showFavorites && styles.filterChipActive,
                  ]}
                  onPress={() => setShowFavorites(!showFavorites)}
                >
                  <Icon 
                    name={showFavorites ? 'heart' : 'heart-outline'} 
                    size={16} 
                    color={showFavorites ? '#fff' : '#374151'} 
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      showFavorites && styles.filterChipTextActive,
                      { marginLeft: 6 }
                    ]}
                  >
                    Show Favorites Only
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setShowFavorites(false);
                }}
              >
                <Icon name="refresh" size={18} color="#6B7280" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
        </Text>
        <TouchableOpacity onPress={() => loadLeads()}>
          <Icon name="refresh" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadCard}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setIsRefreshing(true);
              loadLeads();
            }}
            colors={['#4F46E5']}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default EmployeeLeads;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  
  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  
  // List Content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  
  // Lead Card
  leadCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clientInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  propertyInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  propertyLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 6,
  },
  propertyValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    marginRight: 12,
  },
  verificationInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '700',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
