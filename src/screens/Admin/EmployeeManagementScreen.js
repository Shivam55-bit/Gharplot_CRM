import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { 
  getAllEmployees,
  getEmployeeDashboardStats,
  deleteEmployee,
  updateEmployee
} from '../../crm/services/crmEmployeeManagementApi';

const EmployeeManagementScreen = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    avgPerformance: 0,
  });

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  // Load employees and stats on component mount
  useEffect(() => {
    loadEmployees();
    loadDashboardStats();
  }, []);

  // Load employees from backend
  const loadEmployees = async (page = 1, search = searchText, statusFilter = filterStatus) => {
    try {
      setLoading(page === 1);
      
      const params = {
        page,
        limit: pagination.limit,
        search,
        isActive: statusFilter === 'All' ? undefined : statusFilter === 'Active',
      };

      const { employees: fetchedEmployees, pagination: newPagination } = await getAllEmployees(params);
      
      setEmployees(fetchedEmployees.map(emp => ({
        id: emp._id || emp.id,
        name: emp.name || 'Unknown',
        email: emp.email || '',
        phone: emp.phone || '',
        role: emp.role?.name || emp.role || 'Agent',
        department: emp.department || 'General',
        status: emp.isActive ? 'Active' : 'Inactive',
        joinDate: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '',
        avatar: emp.profilePicture || null,
        performance: emp.performance || Math.floor(Math.random() * 40) + 60, // Default random if not available
      })));
      
      setPagination(newPagination);
    } catch (error) {
      console.error('❌ Load employees error:', error);
      Alert.alert('Error', 'Failed to load employees. Please try again.');
      
      // Fallback to empty array
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      const stats = await getEmployeeDashboardStats();
      setDashboardStats({
        totalEmployees: stats.totalEmployees || 0,
        activeEmployees: stats.activeEmployees || 0,
        inactiveEmployees: stats.inactiveEmployees || 0,
        avgPerformance: stats.avgPerformance || 0,
      });
    } catch (error) {
      console.error('❌ Load stats error:', error);
      // Keep default stats on error
    }
  };

  // Handle search
  const handleSearch = (text) => {
    setSearchText(text);
    // Debounced search - reload after user stops typing for 500ms
    setTimeout(() => {
      loadEmployees(1, text, filterStatus);
    }, 500);
  };

  // Handle filter change
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    loadEmployees(1, searchText, status);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadEmployees();
    loadDashboardStats();
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#10b981' : '#ef4444';
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return '#10b981';
    if (performance >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const handleEmployeePress = (employee) => {
    Alert.alert(
      'Employee Details',
      `Name: ${employee.name}\nRole: ${employee.role}\nDepartment: ${employee.department}\nJoin Date: ${employee.joinDate}\nPerformance: ${employee.performance}%\nStatus: ${employee.status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => handleEditEmployee(employee),
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteEmployee(employee),
        },
      ]
    );
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    // Navigate to edit screen or open edit modal
    Alert.alert('Edit Employee', `Edit functionality for ${employee.name} - Coming soon!`);
  };

  // Handle delete employee
  const handleDeleteEmployee = (employee) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${employee.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(employee.id);
              Alert.alert('Success', `${employee.name} has been deleted.`);
              loadEmployees(); // Refresh list
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Error', 'Failed to delete employee. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() => handleEmployeePress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.name}</Text>
          <Text style={styles.employeeEmail}>{item.email}</Text>
          <Text style={styles.employeePhone}>{item.phone}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
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
        
        <View style={styles.performanceContainer}>
          <Text style={styles.performanceLabel}>Performance</Text>
          <View style={styles.performanceBar}>
            <View style={[
              styles.performanceFill,
              {
                width: `${item.performance}%`,
                backgroundColor: getPerformanceColor(item.performance)
              }
            ]} />
          </View>
          <Text style={[styles.performanceText, { color: getPerformanceColor(item.performance) }]}>
            {item.performance}%
          </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="create" size={18} color="#3b82f6" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="mail" size={18} color="#10b981" />
          <Text style={styles.actionText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="bar-chart" size={18} color="#f59e0b" />
          <Text style={styles.actionText}>Reports</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Management</Text>
        <TouchableOpacity style={styles.addButton}>
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
            onChangeText={handleSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.filterContainer}>
          {['All', 'Active', 'Inactive'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.activeFilterButton
              ]}
              onPress={() => handleFilterChange(status)}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === status && styles.activeFilterButtonText
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboardStats.totalEmployees}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {dashboardStats.activeEmployees}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {Math.round(dashboardStats.avgPerformance) || 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Avg Performance</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No employees found</Text>
            <Text style={styles.emptySubText}>
              {searchText || filterStatus !== 'All' 
                ? 'Try adjusting your search or filters'
                : 'Add your first employee to get started'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            renderItem={renderEmployeeItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={() => {
              if (pagination.currentPage < pagination.totalPages) {
                loadEmployees(pagination.currentPage + 1);
              }
            }}
            onEndReachedThreshold={0.3}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
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
    marginBottom: 16,
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  activeFilterButtonText: {
    color: '#ffffff',
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 70,
  },
  performanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
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
});

export default EmployeeManagementScreen;
