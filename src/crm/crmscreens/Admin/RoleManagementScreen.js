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
  ScrollView,
  Switch,
  Platform,
  StatusBar,
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
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState({ modules: [], actions: [] });
  
  // Form data state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [formErrors, setFormErrors] = useState({});

  // Helper function to toggle permission
  const togglePermission = (moduleKey, action, checked) => {
    const newPermissions = [...formData.permissions];
    const existingIndex = newPermissions.findIndex(p => p.module === moduleKey);
    
    if (existingIndex >= 0) {
      if (checked) {
        if (!newPermissions[existingIndex].actions.includes(action)) {
          newPermissions[existingIndex].actions.push(action);
        }
      } else {
        newPermissions[existingIndex].actions = newPermissions[existingIndex].actions.filter(a => a !== action);
        if (newPermissions[existingIndex].actions.length === 0) {
          newPermissions.splice(existingIndex, 1);
        }
      }
    } else if (checked) {
      newPermissions.push({ module: moduleKey, actions: [action] });
    }
    
    setFormData(prev => ({ ...prev, permissions: newPermissions }));
  };

  // Check if permission is selected
  const isPermissionSelected = (moduleKey, action) => {
    const modulePermission = formData.permissions.find(p => p.module === moduleKey);
    return modulePermission ? modulePermission.actions.includes(action) : false;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Show alert function
  const showAlert = (type, message) => {
    if (type === 'success') {
      Alert.alert('Success', message);
    } else {
      Alert.alert('Error', message);
    }
  };

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
          originalPermissions: role.permissions || [], // Keep original format for editing
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
            originalPermissions: [
              { module: 'dashboard', actions: ['read', 'create', 'update'] },
              { module: 'leads', actions: ['read', 'create', 'update', 'delete'] },
              { module: 'employees', actions: ['read', 'create', 'update'] }
            ],
            permissions: ['Dashboard: Read, Create, Update', 'Leads: Read, Create, Update, Delete', 'Employees: Read, Create, Update'],
            userCount: 2,
            color: '#ef4444',
            isActive: true
          },
          {
            id: 'demo2', 
            name: 'Manager',
            description: 'Management access (Demo)',
            originalPermissions: [
              { module: 'dashboard', actions: ['read'] },
              { module: 'leads', actions: ['read', 'create'] },
              { module: 'reports', actions: ['read'] }
            ],
            permissions: ['Dashboard: Read', 'Leads: Read, Create', 'Reports: Read'],
            userCount: 5,
            color: '#3b82f6',
            isActive: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      showAlert('error', 'Error fetching roles');
      // Use fallback demo data if API fails
      setRoles([
        {
          id: 'demo1',
          name: 'Admin',
          description: 'Full system access (Demo)',
          originalPermissions: [
            { module: 'dashboard', actions: ['read', 'create', 'update'] },
            { module: 'leads', actions: ['read', 'create', 'update', 'delete'] },
            { module: 'employees', actions: ['read', 'create', 'update'] }
          ],
          permissions: ['Dashboard: Read, Create, Update', 'Leads: Read, Create, Update, Delete', 'Employees: Read, Create, Update'],
          userCount: 2,
          color: '#ef4444',
          isActive: true
        },
        {
          id: 'demo2',
          name: 'Manager', 
          description: 'Management access (Demo)',
          originalPermissions: [
            { module: 'dashboard', actions: ['read'] },
            { module: 'leads', actions: ['read', 'create'] },
            { module: 'reports', actions: ['read'] }
          ],
          permissions: ['Dashboard: Read', 'Leads: Read, Create', 'Reports: Read'],
          userCount: 5,
          color: '#3b82f6',
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load permissions/modules with fallback
  const loadPermissions = useCallback(async () => {
    try {
      console.log('Loading permissions...');
      
      let response;
      try {
        // Try admin endpoint first
        response = await getAllPermissions();
      } catch (adminError) {
        console.log('Admin endpoint failed, trying public endpoint...');
        // Fallback to public endpoint
        const publicUrl = `${CRM_BASE_URL}/api/roles/permissions`;
        const publicResponse = await fetch(publicUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        response = await publicResponse.json();
      }
      
      console.log('Permissions response:', response);
      
      if (response && response.success && response.data) {
        setPermissions(response.data);
      } else {
        // Fallback permissions structure if API fails
        console.log('Using fallback permissions');
        setPermissions({
          modules: [
            { value: 'dashboard', label: 'Dashboard', description: 'Dashboard access and overview' },
            { value: 'leads', label: 'Leads', description: 'Lead management' },
            { value: 'properties', label: 'Properties', description: 'Property management' },
            { value: 'employees', label: 'Employees', description: 'Employee management' },
            { value: 'assignments', label: 'Assignments', description: 'Assignment management' },
            { value: 'reports', label: 'Reports', description: 'Reports and analytics' },
            { value: 'settings', label: 'Settings', description: 'System settings' }
          ],
          actions: [
            { value: 'read', label: 'View' },
            { value: 'create', label: 'Create' },
            { value: 'update', label: 'Update' },
            { value: 'delete', label: 'Delete' }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Use minimal fallback if everything fails
      setPermissions({
        modules: [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'leads', label: 'Leads' },
          { value: 'properties', label: 'Properties' }
        ],
        actions: [
          { value: 'read', label: 'View' },
          { value: 'create', label: 'Create' }
        ]
      });
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

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setFormErrors({});
    setSelectedRole(null);
    setCreateEditModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (role) => {
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.originalPermissions || []
    });
    setFormErrors({});
    setSelectedRole(role);
    setCreateEditModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert('error', 'Role name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      if (selectedRole) {
        // Update role
        const response = await updateRole(selectedRole.id, formData);
        if (response.success) {
          showAlert('success', 'Role updated successfully!');
          setTimeout(() => {
            setCreateEditModalVisible(false);
            loadRoles();
          }, 1500);
        } else {
          showAlert('error', response.message || 'An error occurred while updating the role');
        }
      } else {
        // Create role
        const response = await createRole(formData);
        if (response.success) {
          showAlert('success', 'Role created successfully!');
          setTimeout(() => {
            setCreateEditModalVisible(false);
            loadRoles();
          }, 1500);
        } else {
          showAlert('error', response.message || 'An error occurred while creating the role');
        }
      }
    } catch (error) {
      console.error('Error submitting role:', error);
      showAlert('error', error.message || 'An error occurred while saving the role');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchText.toLowerCase()) ||
    role.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRolePress = (role) => {
    setSelectedRole(role);
    setModalVisible(true);
  };

  const handleDeleteRole = async (role) => {
    const roleName = role.name;
    
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${roleName}"? Note: You cannot delete a role if employees are still assigned to it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await deleteRole(role.id);
              
              if (response.success) {
                showAlert('success', 'Role deleted successfully!');
                await loadRoles(); // Refresh the list
              } else {
                // Handle backend constraint errors
                const errorMessage = response.message || 'Failed to delete role';
                if (response.status === 400 && errorMessage.includes('employee')) {
                  showAlert('error', `Cannot delete "${roleName}": ${errorMessage} — Please reassign all employees from this role first, then try again.`);
                } else {
                  showAlert('error', errorMessage);
                }
              }
            } catch (error) {
              console.error('Error deleting role:', error);
              const errorMessage = error.message || 'Failed to delete role';
              if (errorMessage.includes('employee')) {
                showAlert('error', `Cannot delete "${roleName}": ${errorMessage} — Please reassign all employees from this role first, then try again.`);
              } else {
                showAlert('error', errorMessage);
              }
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
          onPress={() => openEditModal(item)}
        >
          <Icon name="create" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteRole(item)}
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
          
          <ScrollView style={styles.modalBody}>
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
              <Text style={styles.statsText}>Status: {selectedRole?.isActive ? 'Active' : 'Inactive'}</Text>
              {selectedRole?.createdAt && (
                <Text style={styles.statsText}>
                  Created: {new Date(selectedRole.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.editRoleButton}
              onPress={() => {
                setModalVisible(false);
                openEditModal(selectedRole);
              }}
            >
              <Text style={styles.editRoleButtonText}>Edit Role</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Create/Edit Role Modal
  const CreateEditRoleModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={createEditModalVisible}
      onRequestClose={() => setCreateEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedRole ? 'Edit Role' : 'Create New Role'}
            </Text>
            <TouchableOpacity
              onPress={() => setCreateEditModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Role Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Role Name *</Text>
              <TextInput
                style={[styles.formInput, formErrors.name && styles.formInputError]}
                placeholder="Enter role name"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, name: text }));
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                }}
                placeholderTextColor="#9ca3af"
              />
              {formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 80 }]}
                placeholder="Enter role description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Permissions Matrix */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Permissions</Text>
              <Text style={styles.formSubLabel}>Select permissions for each module</Text>
              
              {permissions.modules.map((module) => (
                <View key={module.value} style={styles.permissionModule}>
                  <View style={styles.moduleHeader}>
                    <Text style={styles.moduleName}>{module.label}</Text>
                    {module.description && (
                      <Text style={styles.moduleDescription}>{module.description}</Text>
                    )}
                  </View>
                  
                  <View style={styles.actionsContainer}>
                    {permissions.actions.map((action) => (
                      <TouchableOpacity
                        key={`${module.value}-${action.value}`}
                        style={styles.permissionCheckbox}
                        onPress={() => {
                          const isSelected = isPermissionSelected(module.value, action.value);
                          togglePermission(module.value, action.value, !isSelected);
                        }}
                      >
                        <Icon
                          name={isPermissionSelected(module.value, action.value) ? "checkbox" : "square-outline"}
                          size={20}
                          color={isPermissionSelected(module.value, action.value) ? "#3b82f6" : "#9ca3af"}
                        />
                        <Text style={styles.permissionLabel}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          
          {/* Fixed Action Buttons */}
          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCreateEditModalVisible(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!formData.name.trim() || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!formData.name.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {selectedRole ? 'Update Role' : 'Create Role'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1e293b" 
        translucent={false}
      />
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
          onPress={openCreateModal}
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
      <CreateEditRoleModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
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
    flex: 1,
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
    marginBottom: 4,
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
  // Form styles
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formSubLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  formInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  // Permission styles
  permissionModule: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  moduleHeader: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  moduleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  // Modal action buttons (fixed at bottom)
  modalActionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default RoleManagementScreen;
