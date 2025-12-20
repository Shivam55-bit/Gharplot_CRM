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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://abc.bhoomitechzone.us';

const MyLeads = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState({
    totalLeads: 0,
    enquiryLeads: 0,
    clientLeads: 0,
  });

  // Fetch leads data from backend
  const fetchLeads = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const token = await AsyncStorage.getItem('employee_token');
      const response = await fetch(`${API_BASE_URL}/employee/leads/my-leads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const result = await response.json();
      console.log('📊 My Leads Response:', result);
      
      if (result.success && result.data) {
        const leadsData = result.data.assignments || result.data || [];
        setLeads(leadsData);
        setFilteredLeads(leadsData);
        
        // Calculate stats from data
        setStatsData({
          totalLeads: leadsData.length,
          enquiryLeads: leadsData.filter(l => l.enquiryType === 'Inquiry').length,
          clientLeads: leadsData.filter(l => l.enquiryType === 'ManualInquiry').length,
        });
      } else {
        console.log('No leads found');
        setLeads([]);
        setFilteredLeads([]);
      }
    } catch (error) {
      console.error('❌ Fetch leads error:', error);
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLeads(leads);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = leads.filter(lead => {
      const clientName = lead.enquiry?.name?.toLowerCase() || '';
      const phone = lead.enquiry?.phone?.toLowerCase() || '';
      const email = lead.enquiry?.email?.toLowerCase() || '';
      const location = lead.enquiry?.location?.toLowerCase() || '';
      
      return clientName.includes(query) || 
             phone.includes(query) || 
             email.includes(query) ||
             location.includes(query);
    });
    
    setFilteredLeads(filtered);
  }, [searchQuery, leads]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads(false);
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Handle lead status update
  const updateLeadStatus = async (lead, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('employee_token');
      const response = await fetch(`${API_BASE_URL}/employee/leads/status/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'Lead status updated successfully');
        fetchLeads(false); // Refresh data
      } else {
        Alert.alert('Error', result.message || 'Failed to update lead status');
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      Alert.alert('Error', 'Failed to update lead status');
    }
  };

  const renderStatsCard = (title, count, bg) => (
    <View style={[styles.statsCard, { backgroundColor: bg }]}>
      <Text style={styles.statsCount}>{count}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderLeadCard = ({ item }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.clientName}</Text>
          <Text style={styles.leadType}>
            {item.leadType === 'enquiry' ? 'Enquiry Lead' : 'Client Lead'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.detailRow}>
          <Icon name="call" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.clientPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="mail" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.clientEmail}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="location" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.propertyLocation}</Text>
        </View>
        {item.budget && item.budget !== 'Not specified' && (
          <View style={styles.detailRow}>
            <Icon name="wallet" size={14} color="#6b7280" />
            <Text style={styles.detailText}>Budget: {item.budget}</Text>
          </View>
        )}
      </View>

      <View style={styles.leadActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => updateLeadStatus(item, item.status === 'active' ? 'completed' : 'active')}
        >
          <Icon name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.actionText}>
            {item.status === 'active' ? 'Complete' : 'Reactivate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="call" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={70} color="#1e40af" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Leads Found' : 'No Leads Assigned'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search criteria'
          : 'You don\'t have any assigned leads yet.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1e40af" barStyle="light-content" />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e40af" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Leads</Text>
        <Text style={styles.headerSubtitle}>Track your assigned leads</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {renderStatsCard('TOTAL', statsData.totalLeads, '#6366F1')}
        {renderStatsCard('ENQUIRY', statsData.enquiryLeads, '#EC4899')}
        {renderStatsCard('CLIENT', statsData.clientLeads, '#10B981')}
      </View>

      {/* SEARCH + FILTERS */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lead..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={[styles.favoriteButton, showFavorites && styles.favoriteActive]}
          onPress={() => setShowFavorites(!showFavorites)}
        >
          <Icon
            name={showFavorites ? 'heart' : 'heart-outline'}
            size={20}
            color={showFavorites ? '#DC2626' : '#6B7280'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadCard}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1e40af']}
            tintColor="#1e40af"
          />
        }
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingHorizontal: 20,
          paddingBottom: 20 
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

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
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#E9D5FF',
    fontSize: 13,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  statsCard: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  statsTitle: {
    color: '#F3F4F6',
    fontSize: 12,
    marginTop: 2,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 42,
    elevation: 2,
  },
  searchInput: {
    marginLeft: 6,
    fontSize: 15,
    flex: 1,
    color: '#374151',
  },

  favoriteButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  favoriteActive: {
    backgroundColor: '#FEE2E2',
  },

  filterButton: {
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 10,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },

  /* Loading */
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },

  /* Lead Cards */
  leadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  leadType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  leadDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default MyLeads;
