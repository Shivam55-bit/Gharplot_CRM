/**
 * Employee Follow-ups Screen
 * Manage follow-up activities with leads and contacts
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  getMyFollowUps, 
  updateFollowUpStatus, 
  addFollowUpComment,
  deleteFollowUp 
} from '../../services/employeeApiService';

const EmployeeFollowUps = ({ navigation }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    my_followups: 0,
    open: 0,
    closed: 0,
  });

  // Modal States
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [resultText, setResultText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Options
  const FILTER_OPTIONS = [
    { label: 'All', value: 'all', icon: 'format-list-bulleted' },
    { label: 'Open', value: 'open', icon: 'clock-outline' },
    { label: 'Closed', value: 'close', icon: 'check-circle-outline' },
    { label: 'Not Interested', value: 'not-interested', icon: 'close-circle-outline' },
  ];

  // ============================================
  // LIFECYCLE
  // ============================================
  useEffect(() => {
    loadFollowUps();
  }, [selectedFilter]);

  // ============================================
  // FETCH FOLLOW-UPS
  // ============================================
  const loadFollowUps = async () => {
    try {
      console.log('🔄 Starting to load follow-ups...');
      setIsLoading(true);

      // Build query params
      const params = { limit: 100 };
      if (selectedFilter !== 'all') {
        params.caseStatus = selectedFilter;
      }

      console.log('📞 Calling getMyFollowUps with params:', params);
      const response = await getMyFollowUps(params);
      console.log('📞 Follow-ups Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const followUpList = response.data.followUps || response.data || [];
        const statistics = response.data.statistics || { my_followups: followUpList.length };
        
        console.log('✅ Loaded follow-ups:', followUpList.length);
        console.log('📊 Statistics:', statistics);
        
        setFollowUps(followUpList);
        setStats({
          my_followups: statistics.my_followups || followUpList.length,
          open: followUpList.filter(f => f.caseStatus === 'open').length,
          closed: followUpList.filter(f => f.caseStatus === 'close').length,
        });
      } else {
        console.log('⚠️ No success or no data in response:', response);
        setFollowUps([]);
      }
    } catch (error) {
      console.error('❌ Error loading follow-ups:', error);
      Alert.alert('Error', error.message || 'Failed to load follow-ups');
      setFollowUps([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ============================================
  // REFRESH HANDLER
  // ============================================
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFollowUps();
  }, [selectedFilter]);

  // ============================================
  // FILTERED DATA
  // ============================================
  const getFilteredFollowUps = () => {
    if (!searchQuery.trim()) return followUps;
    
    const query = searchQuery.toLowerCase();
    return followUps.filter(item => {
      const clientName = item.leadData?.clientName?.toLowerCase() || '';
      const clientPhone = item.leadData?.clientPhone || '';
      const comment = item.comment?.toLowerCase() || '';
      const location = item.leadData?.location?.toLowerCase() || '';
      
      return clientName.includes(query) || 
             clientPhone.includes(query) ||
             comment.includes(query) ||
             location.includes(query);
    });
  };

  // ============================================
  // CLOSE FOLLOW-UP WITH RESULT
  // ============================================
  const handleCloseFollowUp = (followUp) => {
    setSelectedFollowUp(followUp);
    setResultText('');
    setShowResultModal(true);
  };

  const submitCloseFollowUp = async () => {
    if (!resultText.trim()) {
      Alert.alert('Required', 'Please enter a result/outcome for this follow-up');
      return;
    }

    try {
      setIsSubmitting(true);
      const wordCount = resultText.trim().split(/\s+/).length;
      
      const response = await updateFollowUpStatus(selectedFollowUp._id, {
        caseStatus: 'close',
        result: resultText.trim(),
        wordCount: wordCount,
      });

      if (response.success) {
        setShowResultModal(false);
        setSelectedFollowUp(null);
        setResultText('');
        loadFollowUps();
        Alert.alert('Success', 'Follow-up closed successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to close follow-up');
      }
    } catch (error) {
      console.error('Error closing follow-up:', error);
      Alert.alert('Error', error.message || 'Failed to close follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // MARK NOT INTERESTED
  // ============================================
  const handleMarkNotInterested = async (followUpId, title) => {
    Alert.alert(
      'Mark as Not Interested',
      `Mark "${title}" as not interested?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await updateFollowUpStatus(followUpId, {
                caseStatus: 'not-interested',
                result: 'Client marked as not interested',
                wordCount: 5,
              });

              if (response.success) {
                loadFollowUps();
                Alert.alert('Success', 'Marked as not interested');
              }
            } catch (error) {
              console.error('Error updating follow-up:', error);
              Alert.alert('Error', error.message || 'Failed to update follow-up');
            }
          },
        },
      ]
    );
  };

  // ============================================
  // DELETE FOLLOW-UP
  // ============================================
  const handleDeleteFollowUp = async (followUpId, title) => {
    Alert.alert(
      'Delete Follow-up',
      `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteFollowUp(followUpId);

              if (response.success) {
                setFollowUps(prev => prev.filter(f => f._id !== followUpId));
                Alert.alert('Success', 'Follow-up deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete follow-up');
              }
            } catch (error) {
              console.error('Error deleting follow-up:', error);
              Alert.alert('Error', error.message || 'Failed to delete follow-up');
            }
          },
        },
      ]
    );
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      open: '#10B981',
      close: '#6B7280',
      'not-interested': '#F59E0B',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      close: 'Closed',
      'not-interested': 'Not Interested',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      urgent: '#DC2626',
    };
    return colors[priority] || '#6B7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // ============================================
  // RENDER FOLLOW-UP CARD
  // ============================================
  const renderFollowUpCard = ({ item }) => {
    const clientName = item.leadData?.clientName || item.title || 'Follow-up';
    const overdue = item.caseStatus === 'open' && isOverdue(item.nextFollowUpDate);
    
    return (
      <TouchableOpacity
        style={[styles.followUpCard, overdue && styles.overdueCard]}
        onPress={() => {
          // Navigate to details if available
          if (navigation.navigate) {
            try {
              navigation.navigate('FollowUpDetails', { followUpId: item._id, followUp: item });
            } catch (e) {
              console.log('FollowUpDetails screen not available');
            }
          }
        }}
        activeOpacity={0.7}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: getStatusColor(item.caseStatus) + '20' }]}>
              <Icon 
                name={item.caseStatus === 'open' ? 'phone-clock' : item.caseStatus === 'close' ? 'phone-check' : 'phone-off'} 
                size={20} 
                color={getStatusColor(item.caseStatus)} 
              />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
              {item.leadData?.clientPhone && (
                <Text style={styles.clientPhone}>{item.leadData.clientPhone}</Text>
              )}
            </View>
          </View>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.caseStatus) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.caseStatus) }]}>
              {getStatusLabel(item.caseStatus)}
            </Text>
          </View>
        </View>

        {/* Comment */}
        {item.comment && (
          <View style={styles.commentSection}>
            <Icon name="comment-text-outline" size={14} color="#6B7280" />
            <Text style={styles.commentText} numberOfLines={2}>{item.comment}</Text>
          </View>
        )}

        {/* Meta Info Row */}
        <View style={styles.metaRow}>
          {/* Location */}
          {item.leadData?.location && (
            <View style={styles.metaItem}>
              <Icon name="map-marker-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.leadData.location}</Text>
            </View>
          )}
          
          {/* Lead Type */}
          <View style={styles.metaItem}>
            <Icon name="tag-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.leadType || 'enquiry'}</Text>
          </View>
          
          {/* Priority */}
          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Next Follow-up Date */}
        {item.nextFollowUpDate && (
          <View style={[styles.dateRow, overdue && styles.overdueDateRow]}>
            <Icon 
              name="calendar-clock" 
              size={16} 
              color={overdue ? '#EF4444' : '#4F46E5'} 
            />
            <Text style={[styles.dateText, overdue && styles.overdueText]}>
              Next: {formatDate(item.nextFollowUpDate)}
              {overdue && ' (Overdue)'}
            </Text>
          </View>
        )}

        {/* Action Buttons (Only for Open status) */}
        {item.caseStatus === 'open' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={() => handleCloseFollowUp(item)}
            >
              <Icon name="check-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.notInterestedButton]}
              onPress={() => handleMarkNotInterested(item._id, clientName)}
            >
              <Icon name="close-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Not Interested</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteFollowUp(item._id, clientName)}
            >
              <Icon name="delete" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Result for closed follow-ups */}
        {item.caseStatus !== 'open' && item.result && (
          <View style={styles.resultSection}>
            <Icon name="text-box-check-outline" size={14} color="#10B981" />
            <Text style={styles.resultText} numberOfLines={2}>{item.result}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ============================================
  // RENDER EMPTY STATE
  // ============================================
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="phone-off-outline" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyText}>No follow-ups found</Text>
      <Text style={styles.emptySubtext}>
        {selectedFilter !== 'all' 
          ? `No ${getStatusLabel(selectedFilter).toLowerCase()} follow-ups` 
          : searchQuery 
            ? 'Try a different search term'
            : 'Your follow-ups will appear here'}
      </Text>
      {selectedFilter !== 'all' && (
        <TouchableOpacity 
          style={styles.clearFilterButton}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={styles.clearFilterText}>Show All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ============================================
  // RENDER RESULT MODAL
  // ============================================
  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowResultModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Close Follow-up</Text>
            <TouchableOpacity onPress={() => setShowResultModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Enter the result/outcome for: {selectedFollowUp?.leadData?.clientName || 'this follow-up'}
          </Text>
          
          <TextInput
            style={styles.resultInput}
            placeholder="Enter result (e.g., Customer purchased property, Scheduled site visit, etc.)"
            placeholderTextColor="#9CA3AF"
            value={resultText}
            onChangeText={setResultText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowResultModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={submitCloseFollowUp}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Close Follow-up</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading Follow-ups...</Text>
      </View>
    );
  }

  const filteredData = getFilteredFollowUps();

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EF4444" />
      
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
            <Text style={styles.headerTitle}>Follow-ups</Text>
            <Text style={styles.headerSubtitle}>Stay connected with your leads</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.my_followups}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.closed}</Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, location..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Icon 
                name={item.icon} 
                size={16} 
                color={selectedFilter === item.value ? '#fff' : '#64748B'} 
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterListContent}
        />
      </View>

      {/* Follow-ups List */}
      <FlatList
        data={filteredData}
        renderItem={renderFollowUpCard}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Result Modal */}
      {renderResultModal()}
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Header
  header: {
    backgroundColor: '#EF4444',
    paddingBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  
  // Filter Chips
  filterContainer: {
    paddingBottom: 12,
  },
  filterListContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  
  // Follow-up Card
  followUpCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  overdueCard: {
    borderColor: '#FEE2E2',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  clientPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  
  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // Comment
  commentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  commentText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  
  // Meta Row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Priority Badge
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // Date Row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  overdueDateRow: {
    backgroundColor: '#FEF2F2',
  },
  dateText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  overdueText: {
    color: '#EF4444',
  },
  
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  closeButton: {
    backgroundColor: '#10B981',
    flex: 2,
  },
  notInterestedButton: {
    backgroundColor: '#F59E0B',
    flex: 2,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    flex: 1,
    maxWidth: 50,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Result Section
  resultSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  clearFilterButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EF4444',
    borderRadius: 20,
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  resultInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default EmployeeFollowUps;
