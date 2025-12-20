import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://abc.bhoomitechzone.us';

const MyReminders = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statsData, setStatsData] = useState({
    totalReminders: 0,
    pending: 0,
    dueNow: 0,
    completed: 0,
  });

  const statusOptions = ['All Status', 'pending', 'completed', 'snoozed', 'dismissed'];

  // Fetch reminders data from backend
  const fetchReminders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const token = await AsyncStorage.getItem('employee_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      // Fetch both reminders and stats in parallel
      const [remindersResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reminder/list`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/api/reminder/stats`, { method: 'GET', headers })
      ]);

      const remindersData = await remindersResponse.json();
      const statsData = await statsResponse.json();
      
      console.log('📅 Reminders Response:', remindersData);
      console.log('📊 Stats Response:', statsData);
      
      if (remindersData.success) {
        const remindersList = remindersData.data?.reminders || remindersData.reminders || [];
        setReminders(remindersList);
      }
      
      if (statsData.success) {
        setStatsData({
          totalReminders: statsData.stats?.total || 0,
          pending: statsData.stats?.pending || 0,
          dueNow: statsData.stats?.due || 0,
          completed: statsData.stats?.completed || 0,
        });
      }
    } catch (error) {
      console.error('❌ Reminders fetch error:', error);
      Alert.alert('Error', 'Failed to load reminders data. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = reminders;
    
    // Apply status filter
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const title = r.title?.toLowerCase() || '';
        const description = r.description?.toLowerCase() || '';
        const clientName = r.clientName?.toLowerCase() || '';
        
        return title.includes(query) || description.includes(query) || clientName.includes(query);
      });
    }
    
    setFilteredReminders(filtered);
  }, [reminders, statusFilter, searchQuery]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders(false);
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchReminders();
  }, [statusFilter]);

  // Handle reminder completion
  const handleCompleteReminder = async (reminder) => {
    Alert.prompt(
      'Complete Reminder',
      'Add a response for this reminder:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (response) => {
            try {
              const token = await AsyncStorage.getItem('employee_token');
              const result = await fetch(`${API_BASE_URL}/api/reminder/complete/${reminder._id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({ comment: response || '' }),
              });
              
              const data = await result.json();
              if (data.success) {
                Alert.alert('Success', 'Reminder marked as completed');
                fetchReminders(false);
              } else {
                Alert.alert('Error', data.message || 'Failed to complete reminder');
              }
            } catch (error) {
              console.error('❌ Complete reminder error:', error);
              Alert.alert('Error', 'Failed to complete reminder');
            }
          }
        }
      ],
      'plain-text',
      reminder.comment
    );
  };

  // Handle reminder snooze
  const handleSnoozeReminder = async (reminder) => {
    Alert.alert(
      'Snooze Reminder',
      'How long would you like to snooze this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '15 minutes', onPress: () => snoozeReminder(reminder._id, 15) },
        { text: '30 minutes', onPress: () => snoozeReminder(reminder._id, 30) },
        { text: '1 hour', onPress: () => snoozeReminder(reminder._id, 60) },
        { text: '2 hours', onPress: () => snoozeReminder(reminder._id, 120) },
      ]
    );
  };

  const snoozeReminder = async (reminderId, minutes) => {
    try {
      const token = await AsyncStorage.getItem('employee_token');
      const response = await fetch(`${API_BASE_URL}/api/reminder/snooze/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ snoozeMinutes: minutes }),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', `Reminder snoozed for ${minutes} minutes`);
        fetchReminders(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to snooze reminder');
      }
    } catch (error) {
      console.error('❌ Snooze reminder error:', error);
      Alert.alert('Error', 'Failed to snooze reminder');
    }
  };

  // Handle reminder dismiss
  const handleDismissReminder = async (reminder) => {
    Alert.alert(
      'Dismiss Reminder',
      'Are you sure you want to dismiss this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('employee_token');
              const response = await fetch(`${API_BASE_URL}/api/reminder/dismiss/${reminder._id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : '',
                },
              });
              
              const result = await response.json();
              if (result.success) {
                Alert.alert('Success', 'Reminder dismissed');
                fetchReminders(false);
              } else {
                Alert.alert('Error', result.message || 'Failed to dismiss reminder');
              }
            } catch (error) {
              console.error('❌ Dismiss reminder error:', error);
              Alert.alert('Error', 'Failed to dismiss reminder');
            }
          }
        }
      ]
    );
  };

  // Render reminder action menu
  const renderActionMenu = (reminder) => {
    return (
      <View style={styles.actionMenu}>
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => handleCompleteReminder(reminder)}
        >
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.snoozeButton]}
          onPress={() => handleSnoozeReminder(reminder)}
        >
          <Text style={styles.actionButtonText}>Snooze</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dismissButton]}
          onPress={() => handleDismissReminder(reminder)}
        >
          <Text style={styles.actionButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render individual reminder item
  const renderReminderItem = ({ item: reminder }) => {
    const isOverdue = new Date(reminder.dateTime) < new Date() && reminder.status === 'pending';
    
    return (
      <View style={[
        styles.reminderCard,
        isOverdue && styles.overdueCard
      ]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.reminderTitle}>{reminder.title}</Text>
            <Text style={styles.reminderDate}>
              {new Date(reminder.dateTime).toLocaleString()}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            reminder.status === 'completed' && styles.completedBadge,
            reminder.status === 'snoozed' && styles.snoozedBadge,
            reminder.status === 'dismissed' && styles.dismissedBadge,
            isOverdue && styles.overdueBadge
          ]}>
            <Text style={styles.statusText}>
              {isOverdue ? 'OVERDUE' : reminder.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        {reminder.description && (
          <Text style={styles.reminderDescription}>{reminder.description}</Text>
        )}

        {/* Client Info */}
        {reminder.clientInfo && (
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>Client: {reminder.clientInfo.name}</Text>
            <Text style={styles.clientContact}>{reminder.clientInfo.phone}</Text>
          </View>
        )}

        {/* Response */}
        {reminder.response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Response:</Text>
            <Text style={styles.responseText}>{reminder.response}</Text>
          </View>
        )}

        {/* Actions (only for pending reminders) */}
        {reminder.status === 'pending' && renderActionMenu(reminder)}
      </View>
    );
  };

  const renderStatsCard = (title, count, iconName, bgColor) => (
    <View style={styles.statsCard}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Icon name={iconName} size={20} color="#fff" />
      </View>
      <Text style={styles.statsCount}>{count}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-outline" size={70} color="#1e40af" />
      <Text style={styles.emptyTitle}>No Reminders</Text>
      <Text style={styles.emptySubtitle}>
        Your follow-up reminders will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e40af" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reminders</Text>
        <Text style={styles.headerSubtitle}>Track your reminder updates</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {renderStatsCard('Total', statsData.totalReminders, 'calendar', '#6366F1')}
        {renderStatsCard('Pending', statsData.pending, 'time', '#EC4899')}
        {renderStatsCard('Due Now', statsData.dueNow, 'alert', '#F59E0B')}
        {renderStatsCard('Done', statsData.completed, 'checkmark', '#10B981')}
      </View>

      {/* SEARCH + FILTERS */}
      <View style={styles.filtersSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Search reminders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={styles.dropdownBox}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.dropdownText}>{statusFilter}</Text>
            <Icon name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownBox}>
            <Text style={styles.dropdownText}>{typeFilter}</Text>
            <Icon name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST */}
      <View style={styles.cardListArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredReminders}
            keyExtractor={(item) => item._id}
            renderItem={renderReminderItem}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={{ flexGrow: 1, padding: 18 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1e40af']}
                tintColor="#1e40af"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* TEST BUTTON */}
      <TouchableOpacity style={styles.testButton}>
        <Text style={styles.testButtonText}>🧪 Test Alert Saved</Text>
      </TouchableOpacity>

      {/* Status Filter Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.modalOption,
                  statusFilter === status && styles.selectedOption
                ]}
                onPress={() => {
                  setStatusFilter(status);
                  setShowStatusModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  statusFilter === status && styles.selectedOptionText
                ]}>
                  {status}
                </Text>
                {statusFilter === status && (
                  <Icon name="checkmark" size={20} color="#1e40af" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyReminders;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f6ff' },

  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#E9D5FF',
    marginTop: 4,
    fontSize: 13,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statsCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  statsTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  filtersSection: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  searchBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    elevation: 2,
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },

  filterRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  dropdownBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  dropdownText: {
    color: '#374151',
    fontSize: 14,
  },

  cardListArea: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 12,
    elevation: 2,
    paddingBottom: 8,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  testButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 3,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 10,
  },

  // Reminder card styles
  reminderCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overdueCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },

  // Status badge styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1e40af',
  },
  completedBadge: {
    backgroundColor: '#10B981',
  },
  snoozedBadge: {
    backgroundColor: '#F59E0B',
  },
  dismissedBadge: {
    backgroundColor: '#6B7280',
  },
  overdueBadge: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Client info styles
  clientInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  clientContact: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  // Response styles
  responseContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 18,
  },

  // Action menu styles
  actionMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  snoozeButton: {
    backgroundColor: '#F59E0B',
  },
  dismissButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#1e40af',
    fontWeight: '600',
  },
});
