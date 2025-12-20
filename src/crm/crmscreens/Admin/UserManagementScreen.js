import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAllUsers, activateUser, deactivateUser } from '../../services/crmUserManagementApi';

const { width } = Dimensions.get('window');

/* ===================== SCREEN ===================== */
const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Format date from ISO to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users - Page:', currentPage);
      
      const response = await getAllUsers({
        page: currentPage,
        limit: 5,
      });

      console.log('✅ API Response:', JSON.stringify(response, null, 2));

      // Backend returns { success: true, totalUsers: count, users: [...] }
      if (response && response.users && Array.isArray(response.users)) {
        // Map API response to UI format
        const mappedUsers = response.users.map(user => ({
          id: user._id,
          name: user.fullName || user.name || 'N/A',
          email: user.email || 'N/A',
          phone: user.phone || 'N/A',
          location: 'N/A, N/A',
          signupDate: formatDate(user.createdAt),
          lastSeen: formatDate(user.lastLogin),
          accountStatus: user.isPhoneVerified ? 'ACTIVE' : 'INACTIVE',
        }));

        console.log('📋 Mapped Users:', mappedUsers.length, 'users');
        console.log('📊 Total Users from backend:', response.totalUsers);
        setUsers(mappedUsers);
        
        // Calculate total pages based on totalUsers
        if (response.totalUsers) {
          const calculatedPages = Math.ceil(response.totalUsers / 5);
          setTotalPages(calculatedPages);
          console.log('📄 Total Pages:', calculatedPages);
        }
      } else if (response && response.success === false) {
        console.log('⚠️ Backend returned no users');
        setUsers([]);
        setTotalPages(1);
      } else {
        console.log('⚠️ Unexpected response format:', response);
        setUsers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('Error details:', error.message);
      
      // Check for session expiry
      if (error.message.includes('Session expired') || 
          error.message.includes('Please login again') ||
          error.message.includes('Invalid token')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to AdminLogin screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'AdminLogin' }],
                });
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }
      
      // Check if it's a 404 error (API not implemented)
      if (error.message.includes('404') || 
          error.message.includes('not found') ||
          error.message.includes('Backend may not be ready')) {
        console.log('⚠️ User Management API not yet implemented on backend');
        console.log('📋 Backend APIs are pending - showing empty state');
        
        Alert.alert(
          'API Not Available',
          'User Management API is not yet implemented on the backend. Please check with the backend team.',
          [{ text: 'OK' }]
        );
        
        // Just show empty state, don't block the user
        setUsers([]);
        setTotalPages(1);
      } else {
        // For other real errors, show alert
        let errorMessage = 'Failed to load users. ';
        if (error.message.includes('Network') || error.message.includes('connection')) {
          errorMessage += 'Please check your internet connection.';
        } else {
          errorMessage += error.message;
        }
        
        Alert.alert(
          'Error',
          errorMessage,
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on mount and when page changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  // Handle activate/deactivate user
  const handleDeactivate = async (item) => {
    try {
      const isActive = item.accountStatus === 'ACTIVE';
      const action = isActive ? 'deactivate' : 'activate';
      
      Alert.alert(
        `${isActive ? 'Deactivate' : 'Activate'} User`,
        `Are you sure you want to ${action} ${item.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                if (isActive) {
                  await deactivateUser(item.id);
                } else {
                  await activateUser(item.id);
                }
                
                Alert.alert('Success', `User ${action}d successfully`);
                fetchUsers(); // Refresh the list
              } catch (error) {
                console.error(`Error ${action}ing user:`, error);
                
                // Check for session expiry
                if (error.message.includes('Session expired') || 
                    error.message.includes('Please login again') ||
                    error.message.includes('Invalid token')) {
                  Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please login again.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          navigation.reset({
                            index: 0,
                            routes: [{ name: 'AdminLogin' }],
                          });
                        },
                      },
                    ],
                    { cancelable: false }
                  );
                } else {
                  Alert.alert('Error', error.message || `Failed to ${action} user. Please try again.`);
                }
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleDeactivate:', error);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      {/* TOP */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={22} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            item.accountStatus === 'ACTIVE'
              ? styles.active
              : styles.inactive,
          ]}
        >
          <Text style={styles.statusText}>{item.accountStatus}</Text>
        </View>
      </View>

      {/* INFO */}
      <View style={styles.infoRow}>
        <Text style={styles.info}>📞 {item.phone}</Text>
        <Text style={styles.info}>📍 {item.location}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.meta}>Signup: {item.signupDate}</Text>
        <Text style={styles.meta}>Last: {item.lastSeen}</Text>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.assignBtn}
          onPress={() => navigation.navigate('UserAssignments', { userId: item.id, userName: item.name })}
        >
          <Text style={styles.assignText}>ASSIGN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deactivateBtn,
            item.accountStatus === 'INACTIVE' && styles.activateBtn,
          ]}
          onPress={() => handleDeactivate(item)}
        >
          <Text style={styles.deactivateText}>
            {item.accountStatus === 'ACTIVE' ? 'DEACTIVATE' : 'ACTIVATE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>User Management</Text>

        <View style={styles.placeholder} />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* PAGINATION */}
      <View style={styles.pagination}>
        <TouchableOpacity
          disabled={currentPage === 1}
          style={[
            styles.pageBtn,
            currentPage === 1 && styles.pageDisabled,
          ]}
          onPress={() => setCurrentPage((p) => p - 1)}
        >
          <Text style={styles.pageText}>PREV</Text>
        </TouchableOpacity>

        <Text style={styles.pageCount}>
          {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          disabled={currentPage === totalPages}
          style={[
            styles.pageBtn,
            currentPage === totalPages && styles.pageDisabled,
          ]}
          onPress={() => setCurrentPage((p) => p + 1)}
        >
          <Text style={styles.pageText}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserManagementScreen;

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  header: {
    backgroundColor: '#0F172A',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 36,
  },

  list: {
    padding: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  email: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  active: {
    backgroundColor: '#DCFCE7',
  },
  inactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  info: {
    fontSize: 13,
    color: '#334155',
  },
  meta: {
    fontSize: 12,
    color: '#64748B',
  },

  actions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  assignBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  assignText: {
    color: '#fff',
    fontWeight: '700',
  },
  deactivateBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  deactivateText: {
    color: '#fff',
    fontWeight: '700',
  },
  activateBtn: {
    backgroundColor: '#10B981',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pageDisabled: {
    backgroundColor: '#CBD5E1',
  },
  pageText: {
    color: '#fff',
    fontWeight: '700',
  },
  pageCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
