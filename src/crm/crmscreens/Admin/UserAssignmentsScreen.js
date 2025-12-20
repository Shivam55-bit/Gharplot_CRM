import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const USERS_DATA = [
  { id: '1', name: 'Shivam Sharma', email: 'shivam@gmail.com', phone: '9170288333', assignedTo: null, status: 'Unassigned' },
  { id: '2', name: 'Vikash Chauhan', email: 'vikash@gmail.com', phone: '7895129002', assignedTo: 'Rahul Kumar', status: 'Assigned' },
  { id: '3', name: 'Raghav Singh', email: 'raghav@gmail.com', phone: '9999856789', assignedTo: 'Priya Patel', status: 'Assigned' },
  { id: '4', name: 'Roshya Kumar', email: 'roshya@gmail.com', phone: '8359222848', assignedTo: null, status: 'Unassigned' },
  { id: '5', name: 'Arzu Mahreen', email: 'arzu@gmail.com', phone: '9467858885', assignedTo: 'Rahul Kumar', status: 'Assigned' },
  { id: '6', name: 'Rishabh Verma', email: 'rishabh@gmail.com', phone: '9588190868', assignedTo: null, status: 'Unassigned' },
  { id: '7', name: 'Udit Pal', email: 'udit@gmail.com', phone: '6548627237', assignedTo: 'Amit Singh', status: 'Assigned' },
  { id: '8', name: 'Sayeb Khan', email: 'sayeb@gmail.com', phone: '9528146204', assignedTo: null, status: 'Unassigned' },
];

const EMPLOYEES = [
  { id: 'e1', name: 'Rahul Kumar', role: 'Sales Executive', assignedUsers: 5, maxCapacity: 10 },
  { id: 'e2', name: 'Priya Patel', role: 'Senior Executive', assignedUsers: 8, maxCapacity: 12 },
  { id: 'e3', name: 'Amit Singh', role: 'Sales Manager', assignedUsers: 6, maxCapacity: 15 },
  { id: 'e4', name: 'Neha Gupta', role: 'Team Leader', assignedUsers: 3, maxCapacity: 10 },
];

const UserAssignmentsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState(USERS_DATA);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const unassignedCount = users.filter(u => u.status === 'Unassigned').length;
  const assignedCount = users.filter(u => u.status === 'Assigned').length;

  const handleAssign = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  const confirmAssignment = (employee) => {
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, assignedTo: employee.name, status: 'Assigned' }
        : u
    ));
    setShowAssignModal(false);
    setSelectedUser(null);
  };

  const handleUnassign = (user) => {
    setUsers(users.map(u => 
      u.id === user.id 
        ? { ...u, assignedTo: null, status: 'Unassigned' }
        : u
    ));
  };

  const renderUserCard = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={24} color="#fff" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userPhone}>📞 {item.phone}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.label}>Assigned To:</Text>
          <Text style={[styles.assignedText, !item.assignedTo && styles.unassignedText]}>
            {item.assignedTo || 'Not Assigned'}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, item.status === 'Assigned' ? styles.assignedBadge : styles.unassignedBadge]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {item.status === 'Unassigned' ? (
          <TouchableOpacity 
            style={styles.assignBtn}
            onPress={() => handleAssign(item)}
          >
            <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
            <Text style={styles.btnText}>Assign</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.unassignBtn}
            onPress={() => handleUnassign(item)}
          >
            <MaterialCommunityIcons name="account-minus" size={18} color="#fff" />
            <Text style={styles.btnText}>Unassign</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmployeeOption = ({ item }) => {
    const isNearCapacity = (item.assignedUsers / item.maxCapacity) > 0.8;
    const isFull = item.assignedUsers >= item.maxCapacity;

    return (
      <TouchableOpacity 
        style={[styles.employeeOption, isFull && styles.employeeOptionDisabled]}
        onPress={() => !isFull && confirmAssignment(item)}
        disabled={isFull}
      >
        <View style={styles.employeeHeader}>
          <View style={styles.employeeAvatar}>
            <MaterialCommunityIcons name="account-tie" size={28} color="#3B82F6" />
          </View>
          <View style={styles.employeeDetails}>
            <Text style={styles.employeeName}>{item.name}</Text>
            <Text style={styles.employeeRole}>{item.role}</Text>
          </View>
        </View>
        
        <View style={styles.capacityInfo}>
          <View style={styles.capacityBar}>
            <View 
              style={[
                styles.capacityFill, 
                { width: `${(item.assignedUsers / item.maxCapacity) * 100}%` },
                isNearCapacity && styles.capacityWarning,
                isFull && styles.capacityFull
              ]} 
            />
          </View>
          <Text style={styles.capacityText}>
            {item.assignedUsers}/{item.maxCapacity} users
          </Text>
        </View>

        {isFull && (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>FULL</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Assignments</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-group" size={32} color="#3B82F6" />
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, styles.assignedCard]}>
          <MaterialCommunityIcons name="account-check" size={32} color="#22C55E" />
          <Text style={styles.statNumber}>{assignedCount}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
        <View style={[styles.statCard, styles.unassignedCard]}>
          <MaterialCommunityIcons name="account-alert" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>{unassignedCount}</Text>
          <Text style={styles.statLabel}>Unassigned</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['All', 'Assigned', 'Unassigned'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, filterStatus === filter && styles.filterTabActive]}
            onPress={() => setFilterStatus(filter)}
          >
            <Text style={[styles.filterText, filterStatus === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign User to Employee</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.selectedUserInfo}>
                <Text style={styles.selectedUserText}>
                  Assigning: <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                </Text>
              </View>
            )}

            <Text style={styles.modalSubtitle}>Select an employee:</Text>
            
            <FlatList
              data={EMPLOYEES}
              keyExtractor={(item) => item.id}
              renderItem={renderEmployeeOption}
              contentContainerStyle={styles.employeeList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignedCard: {
    backgroundColor: '#F0FDF4',
  },
  unassignedCard: {
    backgroundColor: '#FEF3C7',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#374151',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  assignmentInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  assignedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  unassignedText: {
    color: '#F59E0B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  assignedBadge: {
    backgroundColor: '#22C55E',
  },
  unassignedBadge: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  assignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  unassignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
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
    color: '#111827',
  },
  selectedUserInfo: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedUserText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedUserName: {
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  employeeList: {
    paddingBottom: 20,
  },
  employeeOption: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  employeeOptionDisabled: {
    opacity: 0.5,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 13,
    color: '#6B7280',
  },
  capacityInfo: {
    marginTop: 8,
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  capacityFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  capacityWarning: {
    backgroundColor: '#F59E0B',
  },
  capacityFull: {
    backgroundColor: '#EF4444',
  },
  capacityText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  fullBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default UserAssignmentsScreen;
