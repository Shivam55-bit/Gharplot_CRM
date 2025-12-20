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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { 
  getAllRoles, 
  deleteRole, 
  getAllPermissions,
  createRole,
  updateRole 
} from '../../services/crmRoleApi';
import { CRM_BASE_URL } from '../../services/crmAPI';

const RoleManagementScreen = ({ navigation }) => {
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissions, setPermissions] = useState({ modules: [], actions: [] });

  // Helper function to get role colors
  const getRoleColor = (roleName) => {
    const colors = {
      'admin': '#ef4444',
      'manager': '#3b82f6',
      'agent': '#10b981',
      'viewer': '#6b7280',
      'employee': '#f59e0b',
      'supervisor': '#8b5cf6'
    };
    return colors[roleName.toLowerCase()] || '#6b7280';
  };

  // Load roles from API
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading roles from API...');
      
      const rolesResponse = await getAllRoles();
      console.log('Roles response:', rolesResponse);
      
      if (rolesResponse && rolesResponse.success && rolesResponse.data) {
        console.log('Raw roles data:', JSON.stringify(rolesResponse.data, null, 2));
        
        // Transform backend data to match frontend structure
        const transformedRoles = rolesResponse.data.map(role => ({
          id: role._id,
          name: role.name,
          description: role.description,
          permissions: role.permissions && Array.isArray(role.permissions) ? 
            role.permissions.map((p, index) => {
              if (typeof p === 'object' && p.module) {
                const moduleName = p.module.charAt(0).toUpperCase() + p.module.slice(1).replace(/-/g, ' ');
                const actionsText = Array.isArray(p.actions) ? 
                  p.actions.map(action => action.charAt(0).toUpperCase() + action.slice(1)).join(', ') :
                  'Read';
                return `${moduleName}: ${actionsText}`;
              } else {
                // Fallback for unexpected permission format
                return typeof p === 'string' ? p : `Permission ${index + 1}`;
              }
            }) : ['No permissions'],
          userCount: role.employeeCount || 0,
          color: getRoleColor(role.name),
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        }));
        
        console.log('Transformed roles:', transformedRoles);
        setRoles(transformedRoles);
      } else {
        console.log('No roles found or invalid response');
        // Use fallback demo data if API fails
        setRoles([
          {
            id: 'demo1',
            name: 'Admin',
            description: 'Full system access (Demo)',
            permissions: ['Dashboard: Read, Write', 'Users: Read, Write, Delete', 'Settings: Read, Write'],
            userCount: 2,
            color: '#ef4444',
            isActive: true
          },
          {
            id: 'demo2', 
            name: 'Manager',
            description: 'Management access (Demo)',
            permissions: ['Dashboard: Read', 'Users: Read', 'Reports: Read'],
            userCount: 5,
            color: '#3b82f6',
            isActive: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      Alert.alert('API Error', `Failed to connect to server. Using demo data.`);
      // Use fallback demo data if API fails
      setRoles([
        {
          id: 'demo1',
          name: 'Admin',
          description: 'Full system access (Demo)',
          permissions: ['Dashboard: Read, Write', 'Users: Read, Write, Delete', 'Settings: Read, Write'],
          userCount: 2,
          color: '#ef4444',
          isActive: true
        },
        {
          id: 'demo2',
          name: 'Manager', 
          description: 'Management access (Demo)',
          permissions: ['Dashboard: Read', 'Users: Read', 'Reports: Read'],
          userCount: 5,
          color: '#3b82f6',
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load permissions/modules
  const loadPermissions = useCallback(async () => {
    try {
      console.log('Loading permissions from:', `${CRM_BASE_URL}/api/roles/permissions`);
      const response = await getAllPermissions();
      console.log('Permissions response:', response);
      
      if (response && response.success && response.data) {
        setPermissions(response.data);
      } else {
        console.log('No permissions found, using empty state');
        setPermissions({ modules: [], actions: [] });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Don't show alert for permissions error, just log it
      setPermissions({ modules: [], actions: [] });
    }
  }, []);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRoles(), loadPermissions()]);
    setRefreshing(false);
  }, [loadRoles, loadPermissions]);

  // Load data on component mount
  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles, loadPermissions]);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchText.toLowerCase()) ||
    role.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRolePress = (role) => {
    setSelectedRole(role);
    setModalVisible(true);
  };

  const handleDeleteRole = async (roleId) => {
    Alert.alert(
      'Delete Role',
      'Are you sure you want to delete this role? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await deleteRole(roleId);
              
              if (response.success) {
                Alert.alert('Success', 'Role deleted successfully');
                await loadRoles(); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to delete role');
              }
            } catch (error) {
              console.error('Error deleting role:', error);
              Alert.alert('Error', error.message || 'Failed to delete role');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderRoleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.roleCard}
      onPress={() => handleRolePress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.roleIndicator, { backgroundColor: item.color }]} />
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{item.name}</Text>
          <Text style={styles.roleDescription}>{item.description}</Text>
        </View>
        <View style={styles.userCountBadge}>
          <Text style={styles.userCountText}>{item.userCount}</Text>
        </View>
      </View>
      
      <View style={styles.permissionsContainer}>
        <Text style={styles.permissionsLabel}>Permissions:</Text>
        <View style={styles.permissionsList}>
          {item.permissions.slice(0, 3).map((permission, index) => (
            <View key={index} style={styles.permissionBadge}>
              <Text style={styles.permissionText}>{permission}</Text>
            </View>
          ))}
          {item.permissions.length > 3 && (
            <View style={styles.permissionBadge}>
              <Text style={styles.permissionText}>+{item.permissions.length - 3}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // TODO: Implement EditRole screen
            Alert.alert(
              'Coming Soon',
              'Edit Role feature is under development. Please use the API or admin panel to edit roles.',
              [{ text: 'OK' }]
            );
            // navigation.navigate('EditRole', { role: item, onRoleUpdated: loadRoles });
          }}
        >
          <Icon name="create" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteRole(item.id)}
        >
          <Icon name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const RoleDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedRole?.name} Role</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalDescription}>{selectedRole?.description}</Text>
            
            <Text style={styles.sectionTitle}>All Permissions:</Text>
            <View style={styles.allPermissionsList}>
              {selectedRole?.permissions.map((permission, index) => (
                <View key={index} style={styles.fullPermissionBadge}>
                  <Icon name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.fullPermissionText}>{permission}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.modalStats}>
              <Text style={styles.statsText}>Users with this role: {selectedRole?.userCount}</Text>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.editRoleButton}
              onPress={() => {
                setModalVisible(false);
                Alert.alert(
                  'Coming Soon',
                  'Edit Role feature is under development. Please use the API or admin panel to edit roles.',
                  [{ text: 'OK' }]
                );
                // navigation.navigate('EditRole', { role: selectedRole, onRoleUpdated: loadRoles });
              }}
            >
              <Text style={styles.editRoleButtonText}>Edit Role</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
        <Text style={styles.headerTitle}>Role Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            // TODO: Implement CreateRole screen
            Alert.alert(
              'Coming Soon',
              'Create Role feature is under development. Please use the API or admin panel to create roles.',
              [{ text: 'OK' }]
            );
            // navigation.navigate('CreateRole', { onRoleCreated: loadRoles });
          }}
        >
          <Icon name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{roles.length}</Text>
            <Text style={styles.statLabel}>Total Roles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{roles.reduce((sum, role) => sum + role.userCount, 0)}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading roles...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRoles}
            renderItem={renderRoleItem}
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
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Icon name="briefcase-outline" size={64} color="#9ca3af" />
                  <Text style={styles.emptyText}>No roles found</Text>
                  <Text style={styles.emptySubText}>Create a new role to get started</Text>
                </View>
              )
            }
          />
        )}
      </View>
      
      <RoleDetailModal />
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  roleCard: {
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
    marginBottom: 12,
  },
  roleIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  userCountBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  permissionsContainer: {
    marginBottom: 12,
  },
  permissionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 12,
    color: '#1e40af',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
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
    marginBottom: 12,
  },
  allPermissionsList: {
    marginBottom: 20,
  },
  fullPermissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fullPermissionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  modalStats: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  editRoleButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editRoleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default RoleManagementScreen;
