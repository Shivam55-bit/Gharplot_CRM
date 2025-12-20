import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FollowUps = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [followUps] = useState([]);

  const statsData = {
    myFollowUps: 0,
    total: 0,
  };

  const renderStatsCard = (title, count) => (
    <View style={styles.statsCard}>
      <View style={styles.statsIconBox}>
        <Icon name="analytics-outline" size={24} color="#1e40af" />
      </View>
      <Text style={styles.statsCount}>{count}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="search-outline" size={70} color="#A3A3A3" />
      <Text style={styles.emptyTitle}>No follow-ups found</Text>
      <Text style={styles.emptySubtitle}>
        You have no follow-ups assigned to you yet.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Icon name="target" size={28} color="#1e40af" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Follow-ups</Text>
          <Text style={styles.headerSubtitle}>
            Track and manage all your follow-ups easily
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {renderStatsCard('My Follow-ups', statsData.myFollowUps)}
        {renderStatsCard('Total', statsData.total)}
      </View>

      {/* Search + Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by client name, phone..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.listWrapper}>
        <FlatList
          data={followUps}
          renderItem={() => null}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Test Alert */}
      <TouchableOpacity style={styles.testButton}>
        <Text style={styles.testButtonText}>🧪 Test Alert Saved</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default FollowUps;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 1,
  },
  statsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f2f6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statsCount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Search & Filters
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 1,
    height: 46,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterButton: {
    width: 46,
    height: 46,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },

  // List Wrapper
  listWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    elevation: 1,
  },
  listContainer: {
    flexGrow: 1,
    padding: 20,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  // Test Button
  testButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F97316',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
