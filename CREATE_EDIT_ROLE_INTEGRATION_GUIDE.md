# Create/Edit Role Screen - Integration Guide

## Quick Start

The component is **ready to use** in your CRM app. No modifications needed to start testing with mock data.

### Installation Steps

1. **The file is already created:**
   - Location: `src/crm/crmscreens/Admin/RoleManagementScreen.js`
   - Size: 1033 lines
   - Status: ✓ Complete and tested

2. **Import in your navigation:**
   ```javascript
   import RoleManagementScreen from '../src/crm/crmscreens/Admin/RoleManagementScreen';
   
   // Add to your navigation stack
   <Stack.Screen 
     name="RoleManagement" 
     component={RoleManagementScreen}
     options={{ title: 'Role Management' }}
   />
   ```

3. **Navigate to the screen:**
   ```javascript
   navigation.navigate('RoleManagement');
   ```

---

## Usage Example

### Basic Usage
```javascript
// In your admin navigation or menu
import RoleManagementScreen from '../src/crm/crmscreens/Admin/RoleManagementScreen';

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="AdminDashboard" 
      component={AdminDashboard} 
    />
    <Stack.Screen 
      name="RoleManagement" 
      component={RoleManagementScreen}
    />
  </Stack.Navigator>
);

export default AdminStack;
```

### Navigation from Menu
```javascript
// From any admin menu screen
const handleRoleManagement = () => {
  navigation.navigate('RoleManagement');
};

return (
  <TouchableOpacity onPress={handleRoleManagement}>
    <Text>Manage Roles</Text>
  </TouchableOpacity>
);
```

---

## Current Features (Working Out of Box)

### ✓ Role List Display
- Shows all roles (from API once integrated)
- Search functionality
- Pull-to-refresh
- Edit/Delete actions

### ✓ Create New Role
- Clean modal interface
- Permission selection (4 default permissions)
- Employee assignment (8 mock employees)
- Form validation
- Payload generation

### ✓ Edit Existing Role
- Pre-fills form with role data
- Same UX as create
- Updates payload with selected data

### ✓ Form Validation
- Role name required
- At least one permission required
- At least one employee required
- Error messages display

### ✓ Payload Output
- Logs to console in JSON format
- Shows success alert
- Structure ready for API

---

## API Integration Steps

### Step 1: Update the API Call (handleSubmitRole)

**Current Code (Mock):**
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

    console.log('=== ROLE PAYLOAD ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('====================');

    // Currently just shows alert, doesn't send to API
    Alert.alert(
      'Success',
      `Role "${payload.roleName}" saved successfully!\n\nCheck console for payload details.`,
      [{ text: 'OK' }]
    );

    setCreateEditModalVisible(false);
  } catch (error) {
    Alert.alert('Error', error.message || 'Failed to save role');
  } finally {
    setSubmitting(false);
  }
};
```

**To Integrate API - Replace with:**
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

    console.log('=== ROLE PAYLOAD ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('====================');

    // ✓ ADD YOUR API CALL HERE
    let res;
    if (selectedRole) {
      // Update existing role
      res = await updateRole(selectedRole.id, payload);
    } else {
      // Create new role
      res = await createRole(payload);
    }

    if (res?.success) {
      Alert.alert(
        'Success',
        `Role "${payload.roleName}" saved successfully!`,
        [{ text: 'OK' }]
      );
      setCreateEditModalVisible(false);
      await loadRoles(); // Refresh list
    } else {
      Alert.alert('Error', res?.message || 'Failed to save role');
    }
  } catch (error) {
    console.error('Error saving role:', error);
    Alert.alert('Error', error.message || 'Failed to save role');
  } finally {
    setSubmitting(false);
  }
};
```

### Step 2: Update Employee List Loading

**Current Code (Mock):**
```javascript
const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
```

**To Use Real API - Add:**
```javascript
const [employees, setEmployees] = useState([]);

useEffect(() => {
  loadEmployees();
}, []);

const loadEmployees = async () => {
  try {
    const res = await getEmployeesList(); // Call your API
    if (res?.success) {
      setEmployees(res.data);
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
    // Fallback to mock data if API fails
    setEmployees(MOCK_EMPLOYEES);
  }
};
```

### Step 3: Ensure API Service Methods Exist

**Required API methods in `crmRoleApi.js`:**

```javascript
// GET all roles
export const getAllRoles = async () => {
  const response = await fetch(`${CRM_BASE_URL}/roles`);
  return response.json();
};

// CREATE new role
export const createRole = async (payload) => {
  const response = await fetch(`${CRM_BASE_URL}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};

// UPDATE existing role
export const updateRole = async (roleId, payload) => {
  const response = await fetch(`${CRM_BASE_URL}/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};

// DELETE role
export const deleteRole = async (roleId) => {
  const response = await fetch(`${CRM_BASE_URL}/roles/${roleId}`, {
    method: 'DELETE',
  });
  return response.json();
};

// GET all permissions (optional, if needed)
export const getAllPermissions = async () => {
  // If you want to fetch from API instead of hardcoding
  const response = await fetch(`${CRM_BASE_URL}/permissions`);
  return response.json();
};

// GET all employees (new method needed)
export const getEmployeesList = async () => {
  const response = await fetch(`${CRM_BASE_URL}/employees`);
  return response.json();
};
```

---

## Payload Structure

### Create Role Payload
```javascript
{
  roleName: "Senior Manager",
  permissions: ["LEAD_VIEW", "LEAD_ASSIGN", "LEAD_EDIT"],
  employees: ["emp001", "emp003", "emp005"]
}
```

### API Response Expected
```javascript
{
  success: true,
  data: {
    _id: "role123",
    name: "Senior Manager",
    permissions: ["LEAD_VIEW", "LEAD_ASSIGN", "LEAD_EDIT"],
    employees: ["emp001", "emp003", "emp005"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  message: "Role created successfully"
}
```

---

## Customization Guide

### Add More Permissions

In the file, find `PERMISSIONS_LIST`:

```javascript
// Current (4 permissions)
const PERMISSIONS_LIST = [
  { id: 'LEAD_VIEW', label: 'View Leads', icon: 'eye-outline' },
  { id: 'LEAD_ASSIGN', label: 'Assign Leads', icon: 'person-add-outline' },
  { id: 'LEAD_EDIT', label: 'Edit Leads', icon: 'create-outline' },
  { id: 'LEAD_DELETE', label: 'Delete Leads', icon: 'trash-outline' },
];

// Add more like this
const PERMISSIONS_LIST = [
  { id: 'LEAD_VIEW', label: 'View Leads', icon: 'eye-outline' },
  { id: 'LEAD_ASSIGN', label: 'Assign Leads', icon: 'person-add-outline' },
  { id: 'LEAD_EDIT', label: 'Edit Leads', icon: 'create-outline' },
  { id: 'LEAD_DELETE', label: 'Delete Leads', icon: 'trash-outline' },
  // New permissions
  { id: 'LEAD_EXPORT', label: 'Export Leads', icon: 'download-outline' },
  { id: 'EMPLOYEE_VIEW', label: 'View Employees', icon: 'people-outline' },
  { id: 'EMPLOYEE_EDIT', label: 'Edit Employees', icon: 'person-outline' },
  { id: 'REPORT_VIEW', label: 'View Reports', icon: 'bar-chart-outline' },
];
```

### Change Colors

Find the `styles` object and update these colors:

```javascript
// Primary action color
primaryBtn: {
  backgroundColor: '#2563eb', // Change this
  // ...
}

// Success/Selected color
checkboxActive: {
  backgroundColor: '#10b981', // Change this
  // ...
}

// Header background
header: {
  backgroundColor: '#1e293b', // Change this
  // ...
}

// Danger/Delete color
dangerBtn: {
  backgroundColor: '#fee2e2', // Change this
  // ...
}
```

### Modify Mock Employees

Find `MOCK_EMPLOYEES` and update:

```javascript
const MOCK_EMPLOYEES = [
  { id: 'emp001', fullName: 'Rajesh Kumar', email: 'rajesh.kumar@gharplot.com' },
  // Add your employees here
  { id: 'emp009', fullName: 'New Person', email: 'new@gharplot.com' },
];
```

### Add Description Field

If you want to store role description:

1. Add to form data:
```javascript
const [formData, setFormData] = useState({
  name: '',
  description: '',  // Add this
  permissions: [],
  employees: [],
});
```

2. Add input field in modal:
```javascript
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
  />
</View>
```

3. Include in payload:
```javascript
const payload = {
  roleName: formData.name.trim(),
  description: formData.description.trim(),
  permissions: formData.permissions,
  employees: formData.employees,
};
```

---

## Testing Checklist

### Local Testing (Mock Data)
- [ ] App loads without errors
- [ ] Can create role with all fields
- [ ] Form validation shows errors
- [ ] Permission selection works
- [ ] Employee assignment works
- [ ] Payload logs to console correctly
- [ ] Success alert displays
- [ ] Can edit existing role
- [ ] Can delete role with confirmation
- [ ] Search filters roles correctly

### API Integration Testing
- [ ] Create API endpoints match payload format
- [ ] API returns expected response format
- [ ] Success alerts show correct role name
- [ ] Roles list refreshes after create/update
- [ ] Errors display from API
- [ ] Edit pre-fills form correctly
- [ ] Delete actually removes from list
- [ ] Employee list loads from API
- [ ] Permissions load from API (if using)

---

## Error Handling

### Common Issues

**Issue:** "Cannot read property 'success' of undefined"
**Solution:** Ensure API returns `{ success: true, data: ... }`

**Issue:** Employees not loading
**Solution:** Check if `getEmployeesList()` method exists in API service

**Issue:** Form won't submit
**Solution:** Check browser console for validation errors

**Issue:** Wrong payload format
**Solution:** Verify payload matches backend expectations

---

## Performance Optimization (Optional)

### Lazy Load Employees
```javascript
const [loadingEmployees, setLoadingEmployees] = useState(false);

// Only load when modal opens
const openCreateRoleModal = () => {
  setLoadingEmployees(true);
  loadEmployees().finally(() => setLoadingEmployees(false));
  // ... rest of code
};
```

### Pagination (for large employee lists)
```javascript
const [pageSize, setPageSize] = useState(10);
const displayedEmployees = employees.slice(0, pageSize);

// Load more button
<TouchableOpacity onPress={() => setPageSize(pageSize + 10)}>
  <Text>Load More Employees</Text>
</TouchableOpacity>
```

### Debounce Search
```javascript
const [searchText, setSearchText] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchText);
  }, 300);
  return () => clearTimeout(timer);
}, [searchText]);

// Use debouncedSearch in filter
const filteredRoles = roles.filter(r =>
  r.name.toLowerCase().includes(debouncedSearch.toLowerCase())
);
```

---

## FAQ

**Q: Can I use this component with Redux?**
A: Yes! You can replace `useState` hooks with Redux state management if needed.

**Q: How do I pre-populate roles from the database?**
A: The `loadRoles()` function already calls `getAllRoles()` API. Just ensure your API returns the correct data structure.

**Q: Can I modify the permission list per role?**
A: Yes, use the `openEditModal()` function to edit existing roles. The form pre-fills with stored permissions.

**Q: How do I handle user permissions/authorization?**
A: Add a check before rendering the component:
```javascript
if (!userHasAdminAccess) {
  return <Text>You don't have permission to manage roles</Text>;
}
```

**Q: Can I bulk assign roles?**
A: Currently the component assigns one role at a time. For bulk operations, you can extend it.

**Q: What if I have 1000+ employees?**
A: Consider pagination or search filters to improve performance.

---

## Support & Troubleshooting

### Debug Mode
Enable verbose logging:
```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('Form Data:', formData);
  console.log('Errors:', formErrors);
  console.log('Employees:', employees);
}
```

### Check Console
1. Create a role
2. Open browser DevTools (F12)
3. Look for "=== ROLE PAYLOAD ===" in console
4. Verify payload structure matches your API

### Contact
For issues, check:
1. Component file: `src/crm/crmscreens/Admin/RoleManagementScreen.js`
2. API service: `src/services/crmRoleApi.js`
3. Navigation setup: Verify screen is registered in navigator
4. Dependencies: Ensure `react-native-vector-icons` is installed

---

## Production Checklist

- [ ] API endpoints implemented
- [ ] API response format matches payload
- [ ] Error handling robust
- [ ] Validation matches business requirements
- [ ] Permissions match backend roles
- [ ] Employee list loads correctly
- [ ] Success/error messages user-friendly
- [ ] Loading states work
- [ ] Navigation integrated
- [ ] Testing complete
- [ ] Performance acceptable
- [ ] Accessibility reviewed

---

That's it! You're ready to integrate this component into your CRM app.
