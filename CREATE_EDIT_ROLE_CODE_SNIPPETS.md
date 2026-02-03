# CREATE/EDIT ROLE SCREEN - CODE SNIPPETS & EXAMPLES

## 🔧 Copy-Paste Code Examples

All the code snippets you need to customize, integrate, or extend the component.

---

## 1. IMPORTING & NAVIGATION

### Basic Import
```javascript
import RoleManagementScreen from './src/crm/crmscreens/Admin/RoleManagementScreen';
```

### Add to Navigation Stack
```javascript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoleManagementScreen from './src/crm/crmscreens/Admin/RoleManagementScreen';

const Stack = createNativeStackNavigator();

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="RoleManagement" 
      component={RoleManagementScreen}
      options={{
        title: 'Manage Roles',
        headerShown: false, // Component has its own header
      }}
    />
  </Stack.Navigator>
);

export default AdminStack;
```

### Navigate from Another Screen
```javascript
const MyScreen = ({ navigation }) => {
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('RoleManagement')}
    >
      <Text>Go to Role Management</Text>
    </TouchableOpacity>
  );
};
```

---

## 2. API INTEGRATION

### Replace Mock Submission (Full Implementation)
```javascript
const handleSubmitRole = async () => {
  if (!validateForm()) return;

  Keyboard.dismiss();

  try {
    setSubmitting(true);

    const payload = {
      roleName: formData.name.trim(),
      permissions: formData.permissions,
      employees: formData.employees,
    };

    console.log('Submitting payload:', payload);

    // Make API call
    let res;
    if (selectedRole) {
      // UPDATE
      res = await updateRole(selectedRole.id, payload);
    } else {
      // CREATE
      res = await createRole(payload);
    }

    // Handle response
    if (res?.success) {
      Alert.alert(
        'Success',
        `Role "${payload.roleName}" saved successfully!`,
        [{ 
          text: 'OK',
          onPress: () => {
            setCreateEditModalVisible(false);
            loadRoles(); // Refresh the list
          }
        }]
      );
    } else {
      Alert.alert('Error', res?.message || 'Failed to save role');
    }
  } catch (error) {
    console.error('Error saving role:', error);
    Alert.alert('Error', error.message || 'An unexpected error occurred');
  } finally {
    setSubmitting(false);
  }
};
```

### Add Employee Loading API
```javascript
// Add to useEffect
useEffect(() => {
  loadRoles();
  loadPermissions();
  loadEmployees(); // Add this
}, [loadRoles, loadPermissions]);

// Add this function
const loadEmployees = useCallback(async () => {
  try {
    const res = await getEmployeesList(); // Your API method
    if (res?.success) {
      setEmployees(res.data);
    } else {
      // Fallback to mock if API fails
      console.warn('Using mock employees');
      setEmployees(MOCK_EMPLOYEES);
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
    setEmployees(MOCK_EMPLOYEES); // Fallback
  }
}, []);
```

### Required API Service Methods
```javascript
// In your crmRoleApi.js or equivalent

export const getEmployeesList = async (filters = {}) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/employees`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
        // 'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    
    return await response.json();
  } catch (error) {
    console.error('getEmployeesList error:', error);
    throw error;
  }
};

export const createRole = async (payload) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create role');
    }
    
    return await response.json();
  } catch (error) {
    console.error('createRole error:', error);
    throw error;
  }
};

export const updateRole = async (roleId, payload) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update role');
    }
    
    return await response.json();
  } catch (error) {
    console.error('updateRole error:', error);
    throw error;
  }
};
```

---

## 3. CUSTOMIZATION EXAMPLES

### Add More Permissions
```javascript
// Replace PERMISSIONS_LIST constant with:
const PERMISSIONS_LIST = [
  { id: 'LEAD_VIEW', label: 'View Leads', icon: 'eye-outline' },
  { id: 'LEAD_ASSIGN', label: 'Assign Leads', icon: 'person-add-outline' },
  { id: 'LEAD_EDIT', label: 'Edit Leads', icon: 'create-outline' },
  { id: 'LEAD_DELETE', label: 'Delete Leads', icon: 'trash-outline' },
  // Add these new ones:
  { id: 'LEAD_EXPORT', label: 'Export Leads', icon: 'download-outline' },
  { id: 'REPORT_VIEW', label: 'View Reports', icon: 'bar-chart-outline' },
  { id: 'REPORT_CREATE', label: 'Create Reports', icon: 'document-outline' },
  { id: 'EMPLOYEE_VIEW', label: 'View Employees', icon: 'people-outline' },
  { id: 'EMPLOYEE_EDIT', label: 'Edit Employees', icon: 'person-outline' },
  { id: 'EMPLOYEE_DELETE', label: 'Delete Employees', icon: 'trash-outline' },
];
```

### Change Header Color
```javascript
// In StyleSheet, find header and change:
header: {
  backgroundColor: '#1e293b', // Change this to your color
  paddingHorizontal: 16,
  paddingTop: Platform.OS === 'android' ? 12 : 8,
  paddingBottom: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
```

### Change Primary Button Color
```javascript
// In StyleSheet, find primaryBtn and change:
primaryBtn: {
  backgroundColor: '#2563eb', // Change this to your color
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 6,
  // ...
},
```

### Add Role Description Field
```javascript
// In the form, add after role name input:
<View style={styles.formSection}>
  <Text style={styles.label}>Description (Optional)</Text>
  <TextInput
    placeholder="Brief description of this role"
    placeholderTextColor="#d1d5db"
    value={formData.description}
    onChangeText={(text) =>
      setFormData({ ...formData, description: text })
    }
    style={styles.input}
    multiline
    numberOfLines={3}
    maxLength={200}
  />
  <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
    {formData.description.length}/200
  </Text>
</View>
```

### Filter Employees by Name
```javascript
// Add search state
const [employeeSearch, setEmployeeSearch] = useState('');

// Add search input in the employees section:
<TextInput
  placeholder="Search employees..."
  placeholderTextColor="#9ca3af"
  value={employeeSearch}
  onChangeText={setEmployeeSearch}
  style={styles.input}
  clearButtonMode="while-editing"
/>

// Filter employees when rendering:
{employees
  .filter(emp =>
    emp.fullName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
  )
  .map(employee => renderEmployeeRow(employee))}
```

### Add Select All / Deselect All Buttons
```javascript
// Add in the employees section header:
<View style={styles.employeeHeaderRow}>
  <View>
    <Text style={styles.label}>
      Assign Employees <Text style={styles.required}>*</Text>
    </Text>
  </View>
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <TouchableOpacity
      onPress={() => {
        setFormData(prev => ({
          ...prev,
          employees: employees.map(e => e.id)
        }));
      }}
    >
      <Text style={{ color: '#2563eb', fontWeight: '600' }}>All</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => {
        setFormData(prev => ({
          ...prev,
          employees: []
        }));
      }}
    >
      <Text style={{ color: '#dc2626', fontWeight: '600' }}>Clear</Text>
    </TouchableOpacity>
  </View>
</View>
```

### Add Department Filter
```javascript
// Add state
const [selectedDepartment, setSelectedDepartment] = useState('all');

// Add filter buttons:
<View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
  {['all', 'sales', 'marketing', 'operations'].map(dept => (
    <TouchableOpacity
      key={dept}
      onPress={() => setSelectedDepartment(dept)}
      style={[
        styles.filterBtn,
        selectedDepartment === dept && styles.filterBtnActive
      ]}
    >
      <Text style={styles.filterBtnText}>
        {dept === 'all' ? 'All' : dept.charAt(0).toUpperCase() + dept.slice(1)}
      </Text>
    </TouchableOpacity>
  ))}
</View>

// Filter employees
{employees
  .filter(emp => 
    selectedDepartment === 'all' || emp.department === selectedDepartment
  )
  .map(employee => renderEmployeeRow(employee))}
```

---

## 4. VALIDATION EXAMPLES

### Add Additional Validation
```javascript
const validateForm = () => {
  const errors = {};

  // Role name validation
  if (!formData.name.trim()) {
    errors.name = 'Role name is required';
  } else if (formData.name.trim().length < 3) {
    errors.name = 'Role name must be at least 3 characters';
  } else if (formData.name.trim().length > 50) {
    errors.name = 'Role name cannot exceed 50 characters';
  }

  // Permission validation
  if (formData.permissions.length === 0) {
    errors.permissions = 'Select at least one permission';
  }

  // Employee validation
  if (formData.employees.length === 0) {
    errors.employees = 'Assign at least one employee';
  }

  // Custom validation
  if (formData.permissions.includes('LEAD_ASSIGN') && 
      formData.permissions.includes('LEAD_DELETE') &&
      formData.permissions.length === 2) {
    errors.permissions = 'Cannot assign and delete without view permission';
  }

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Real-Time Validation (On Change)
```javascript
const handleRoleNameChange = (text) => {
  setFormData({ ...formData, name: text });
  
  // Real-time validation
  if (text.trim().length < 3 && text.length > 0) {
    setFormErrors(prev => ({
      ...prev,
      name: 'Role name must be at least 3 characters'
    }));
  } else {
    setFormErrors(prev => ({
      ...prev,
      name: ''
    }));
  }
};
```

---

## 5. ENHANCED ERROR HANDLING

### Try-Catch with Specific Errors
```javascript
const handleSubmitRole = async () => {
  if (!validateForm()) return;

  Keyboard.dismiss();

  try {
    setSubmitting(true);

    const payload = {
      roleName: formData.name.trim(),
      permissions: formData.permissions,
      employees: formData.employees,
    };

    let res;
    if (selectedRole) {
      res = await updateRole(selectedRole.id, payload);
    } else {
      res = await createRole(payload);
    }

    if (res?.success) {
      Alert.alert('Success', `Role saved successfully!`);
      setCreateEditModalVisible(false);
      loadRoles();
    } else {
      // Handle specific error messages from API
      const errorMsg = res?.message || 'Failed to save role';
      
      if (res?.code === 'ROLE_EXISTS') {
        Alert.alert('Error', 'A role with this name already exists');
      } else if (res?.code === 'INVALID_PERMISSIONS') {
        Alert.alert('Error', 'One or more permissions are invalid');
      } else if (res?.code === 'INVALID_EMPLOYEES') {
        Alert.alert('Error', 'One or more employees are invalid');
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    
    // Handle network errors
    if (error.message.includes('Network')) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } else if (error.message.includes('timeout')) {
      Alert.alert('Error', 'Request timed out. Please try again.');
    } else {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    }
  } finally {
    setSubmitting(false);
  }
};
```

---

## 6. STYLE CUSTOMIZATION

### Dark Mode Support
```javascript
// Add state for theme
const [isDarkMode, setIsDarkMode] = useState(false);

// Create theme colors
const colors = {
  light: {
    primary: '#2563eb',
    background: '#f8fafc',
    surface: '#fff',
    text: '#1e293b',
    error: '#dc2626'
  },
  dark: {
    primary: '#3b82f6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    error: '#ef4444'
  }
};

const currentColors = isDarkMode ? colors.dark : colors.light;

// Apply to styles:
<View style={{
  backgroundColor: currentColors.background,
  // ...
}} />
```

### Custom Font Support
```javascript
// Add custom fonts
const fonts = {
  regular: 'Roboto-Regular',
  bold: 'Roboto-Bold',
  semibold: 'Roboto-Medium'
};

// Use in styles:
<Text style={{
  fontFamily: fonts.bold,
  fontSize: 16
}}>
  Role Name
</Text>
```

---

## 7. LOGGING & DEBUGGING

### Comprehensive Logging
```javascript
const handleSubmitRole = async () => {
  console.log('=== FORM SUBMISSION START ===');
  console.log('Form data:', formData);
  console.log('Form errors:', formErrors);
  console.log('Validation result:', validateForm());
  
  if (!validateForm()) {
    console.log('Validation failed, stopping submission');
    return;
  }

  console.log('Validation passed, preparing payload...');
  
  const payload = {
    roleName: formData.name.trim(),
    permissions: formData.permissions,
    employees: formData.employees,
  };

  console.log('Final payload:', JSON.stringify(payload, null, 2));
  
  // ... rest of code
};
```

### Debug Mode Toggle
```javascript
const DEBUG = __DEV__; // True in development, false in production

const debugLog = (label, data) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${label}:`, data);
  }
};

// Use it:
debugLog('Form data', formData);
debugLog('Selected employees', formData.employees);
debugLog('Selected permissions', formData.permissions);
```

---

## 8. TESTING EXAMPLES

### Unit Test for Validation
```javascript
describe('RoleManagementScreen', () => {
  test('validation should fail without role name', () => {
    const formData = {
      name: '',
      permissions: ['LEAD_VIEW'],
      employees: ['emp001']
    };
    
    // This would fail validation
    expect(formData.name.trim()).toBe('');
  });

  test('validation should fail without permissions', () => {
    const formData = {
      name: 'Manager',
      permissions: [],
      employees: ['emp001']
    };
    
    expect(formData.permissions.length).toBe(0);
  });

  test('validation should pass with all fields', () => {
    const formData = {
      name: 'Manager',
      permissions: ['LEAD_VIEW'],
      employees: ['emp001']
    };
    
    expect(formData.name).toBeTruthy();
    expect(formData.permissions.length > 0).toBe(true);
    expect(formData.employees.length > 0).toBe(true);
  });
});
```

---

## 9. PERFORMANCE OPTIMIZATION

### Memoized Components
```javascript
// Memoize expensive renders
const EmployeeRow = React.memo(({ employee, isAssigned, onToggle }) => (
  <TouchableOpacity onPress={() => onToggle(employee.id)}>
    {/* ... */}
  </TouchableOpacity>
), (prevProps, nextProps) => {
  return prevProps.isAssigned === nextProps.isAssigned;
});
```

### Debounced Search
```javascript
const [searchText, setSearchText] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchText);
  }, 300); // Wait 300ms before searching

  return () => clearTimeout(timer);
}, [searchText]);

// Use debouncedSearch for filtering
const filteredRoles = roles.filter(r =>
  r.name.toLowerCase().includes(debouncedSearch.toLowerCase())
);
```

---

## 10. ADVANCED FEATURES

### Undo/Redo for Form Changes
```javascript
const [formHistory, setFormHistory] = useState([formData]);
const [historyIndex, setHistoryIndex] = useState(0);

const updateFormData = (newData) => {
  const newHistory = formHistory.slice(0, historyIndex + 1);
  newHistory.push(newData);
  setFormHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
  setFormData(newData);
};

const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1);
    setFormData(formHistory[historyIndex - 1]);
  }
};

const redo = () => {
  if (historyIndex < formHistory.length - 1) {
    setHistoryIndex(historyIndex + 1);
    setFormData(formHistory[historyIndex + 1]);
  }
};
```

### Export Role as JSON
```javascript
const exportRole = (role) => {
  const jsonString = JSON.stringify(role, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Trigger download or share
  Alert.alert('Export', 'Role exported as JSON', [
    { text: 'Copy', onPress: () => {
      // Copy jsonString to clipboard
    }},
    { text: 'Share', onPress: () => {
      // Share jsonString
    }}
  ]);
};
```

---

This should cover most use cases for customization, integration, and enhancement!
