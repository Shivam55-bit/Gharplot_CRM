# Backend Endpoints Required for Admin Reminders

## ⚠️ CRITICAL ISSUE - Database Not Saving!

### Current Status:
✅ API call succeeds: `PUT /admin/employees/:id` returns `{success: true}`
❌ Database NOT saving: `adminReminderPopupEnabled` field remains `undefined` after update
❌ After page refresh: Value resets to `false` (default)

### Console Evidence:
```
✅ Update response: {success: true, message: 'Employee updated successfully'}
🔍 Verified after save: undefined  ← FIELD NOT SAVED!
⚠️ Value not persisted! Expected: true Got: undefined
```

### Root Cause:
Backend's `PUT /admin/employees/:id` endpoint is NOT saving the `adminReminderPopupEnabled` field to database.

### Required Fix in Backend:
In your employee update controller, ensure `adminReminderPopupEnabled` is included in allowed update fields:

```javascript
// Example fix needed in backend
const updateEmployee = async (req, res) => {
  const { adminReminderPopupEnabled, name, email, phone, department, role } = req.body;
  
  const updateData = {
    name,
    email,
    phone,
    department,
    role,
    adminReminderPopupEnabled  // ← MAKE SURE THIS IS INCLUDED!
  };
  
  const updatedEmployee = await Employee.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.json({ success: true, data: updatedEmployee });
};
```

### Test After Fix:
1. Call: `PUT /admin/employees/:id` with `{ adminReminderPopupEnabled: true }`
2. Verify: `GET /admin/employees/:id` should return `adminReminderPopupEnabled: true`
3. Database check: Field should persist in MongoDB

---

## Alternative: Use Dedicated Toggle Endpoint (Recommended)

Instead of fixing the general employee update, create a dedicated endpoint:

```javascript
// Backend Controller
exports.toggleAdminPopup = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.employeeId,
      { adminReminderPopupEnabled: enabled },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({
      success: true,
      message: `Admin reminder popup ${enabled ? 'enabled' : 'disabled'} for employee`,
      data: {
        employeeId: employee._id,
        name: employee.name,
        adminReminderPopupEnabled: employee.adminReminderPopupEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Backend Route
router.put('/admin/reminders/employee/:employeeId/toggle-popup', auth, toggleAdminPopup);
```

---

## Missing Endpoints (404 errors):

### 1. Toggle Employee Popup (PRIORITY 1)
```
PUT /admin/reminders/employee/:employeeId/toggle-popup
Body: { enabled: true/false }
Headers: { Authorization: Bearer <token> }

Response:
{
  "success": true,
  "message": "Admin reminder popup enabled for employee",
  "data": {
    "employeeId": "...",
    "adminReminderPopupEnabled": true
  }
}
```

### 2. Get Employees with Reminder Stats
```
GET /admin/reminders/employees-status?page=1&limit=20&search=
Headers: { Authorization: Bearer <token> }

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Employee Name",
      "email": "email@example.com",
      "department": "Sales",
      "adminReminderPopupEnabled": true,
      "reminderStats": {
        "totalPending": 5,
        "currentlyDue": 2
      }
    }
  ],
  "pagination": { ... }
}
```

### 3. Get All Due Reminders
```
GET /admin/reminders/due-all
Headers: { Authorization: Bearer <token> }

Response:
{
  "success": true,
  "count": 10,
  "totalEmployees": 3,
  "data": [
    {
      "employee": { ... },
      "reminders": [ ... ]
    }
  ]
}
```

## Temporary Workaround (Currently Using):
Using `/admin/employees/:id` endpoint to update `adminReminderPopupEnabled` field.
But this doesn't persist after refresh - field not being saved in database.

## Action Required:
1. Deploy the 3 endpoints above
2. Ensure `adminReminderPopupEnabled` field is saved when updating employee via `/admin/employees/:id`
