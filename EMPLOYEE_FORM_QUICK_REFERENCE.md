# Employee Form - Quick Reference

## Files Created

1. **`src/crm/components/EmployeeForm.js`** - Main form component
2. **`src/crm/utils/employeeFormValidation.js`** - Validation utilities

## How to Use

### Basic Usage in Any Component

```javascript
import EmployeeForm from '../../components/EmployeeForm';

function MyComponent() {
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);

  const handleSubmit = async (submitData) => {
    setSubmitting(true);
    try {
      // Call your API
      const response = await createEmployee(submitData);
      if (response.success) {
        Alert.alert('Success', 'Employee created!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmployeeForm
      isEditing={false}
      roles={roles}
      onSubmit={handleSubmit}
      onCancel={() => {/* handle cancel */}}
      submitting={submitting}
    />
  );
}
```

### In Modal (Recommended)

```javascript
const CreateEditEmployeeModal = () => (
  <Modal
    animationType="slide"
    transparent={false}
    visible={createEditModalVisible}
  >
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {selectedEmployee ? 'Edit Employee' : 'Create Employee'}
        </Text>
        <TouchableOpacity onPress={() => setCreateEditModalVisible(false)}>
          <Icon name="close" size={24} />
        </TouchableOpacity>
      </View>

      <EmployeeForm
        isEditing={!!selectedEmployee}
        initialData={selectedEmployee}
        roles={roles}
        onSubmit={handleEmployeeSubmit}
        onCancel={() => setCreateEditModalVisible(false)}
        submitting={submitting}
      />
    </SafeAreaView>
  </Modal>
);
```

## Props Documentation

```typescript
interface EmployeeFormProps {
  isEditing?: boolean;              // Set true for edit mode
  initialData?: EmployeeData | null; // Employee data to edit
  roles?: Array<{ _id: string; name: string }>; // Available roles
  onSubmit: (data: FormData) => Promise<void>; // Submit handler
  onCancel: () => void;             // Cancel handler
  submitting?: boolean;             // Show loading state
}
```

## Form Data Structure

### Input Format (initialData)
```javascript
{
  id: "emp_123",
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  roleId: "role_123",
  department: "Sales",
  giveAdminAccess: false,
  address: {
    street: "123 Main St",
    city: "Delhi",
    state: "Delhi",
    zipCode: "110001",
    country: "India"
  }
}
```

### Output Format (onSubmit data)
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  role: "role_123",
  department: "Sales",
  giveAdminAccess: false,
  password: "securePassword", // Only if provided
  address: {
    street: "123 Main St",
    city: "Delhi",
    state: "Delhi",
    zipCode: "110001",
    country: "India"
  }
}
```

## Validation Functions

### Using Validation Utilities

```javascript
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateEmployeeForm,
  prepareEmployeeSubmitData
} from '../../utils/employeeFormValidation';

// Individual field validation
if (!validateEmail(email)) {
  console.log('Invalid email');
}

if (!validatePhone(phone)) {
  console.log('Invalid phone');
}

// Complete form validation
const formData = { /* ... */ };
const { isValid, errors } = validateEmployeeForm(formData, isEditing);

if (!isValid) {
  console.log('Validation errors:', errors);
}

// Prepare data for submission
const submitData = prepareEmployeeSubmitData(formData, isEditing);
```

## Validation Rules

### Email
- Required
- Must be valid format (user@domain.com)

### Phone
- Required
- Must be 10-11 digits

### Password (New Employee)
- Required
- Minimum 6 characters
- Must match confirmation

### Password (Edit)
- Optional
- If provided: minimum 6 characters
- Must match confirmation if provided

### Name
- Required
- Minimum 2 characters

### Role
- Required
- Must select from list

### Department
- Required
- Minimum 1 character

## Styling Integration

The form uses its own StyleSheet but can be customized:

```javascript
// Modify EmployeeForm.js styles for custom theming
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb', // Your background color
  },
  // ... other styles
});
```

### Recommended Colors
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Neutral: `#6b7280` (Gray)

## Examples

### Example 1: Create Employee
```javascript
const handleCreateEmployee = async (formData) => {
  try {
    setSubmitting(true);
    const response = await createEmployee(formData);
    
    if (response.success) {
      Alert.alert('Success', 'Employee created successfully!');
      setCreateModalVisible(false);
      loadEmployees(); // Refresh list
    } else {
      Alert.alert('Error', response.message || 'Failed to create employee');
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setSubmitting(false);
  }
};
```

### Example 2: Edit Employee
```javascript
const handleEditEmployee = async (formData) => {
  try {
    setSubmitting(true);
    const response = await updateEmployee(selectedEmployee.id, formData);
    
    if (response.success) {
      Alert.alert('Success', 'Employee updated successfully!');
      setEditModalVisible(false);
      loadEmployees(); // Refresh list
    } else {
      Alert.alert('Error', response.message || 'Failed to update employee');
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setSubmitting(false);
  }
};
```

## Common Issues & Solutions

### Issue: Form not showing validation errors
**Solution**: Ensure validation functions are called before submit

### Issue: Password fields not toggling visibility
**Solution**: Check that Icon library is properly imported (react-native-vector-icons/Ionicons)

### Issue: Form data not persisting on edit
**Solution**: Pass complete initialData object with all required fields

### Issue: Keyboard not dismissing
**Solution**: Add `keyboardShouldPersistTaps="handled"` to parent ScrollView

## Performance Tips

1. **Lazy load roles**
   ```javascript
   useEffect(() => {
     if (!roles.length) {
       loadRoles();
     }
   }, []);
   ```

2. **Memoize callbacks**
   ```javascript
   const handleSubmit = useCallback(async (data) => {
     // Your handler
   }, [dependencies]);
   ```

3. **Use proper key prop**
   ```javascript
   {roles.map(role => (
     <option key={role._id} value={role._id}>
       {role.name}
     </option>
   ))}
   ```

## Debugging

Enable logging by checking console:

```javascript
// In EmployeeForm.js
console.log('Form initialized with:', initialData);
console.log('Form errors:', errors);
console.log('Submitting form with:', submitData);
```

---

**Version**: 1.0  
**Status**: Production Ready  
**Last Updated**: February 2, 2026
