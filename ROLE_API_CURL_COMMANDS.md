# Role Management - CURL Commands

Based on the UI from RoleManagementScreen.js - UPDATED with Backend Format

## API Configuration
- **Base URL**: `https://abc.bhoomitechzone.us`
- **Auth Header**: `Authorization: Bearer YOUR_TOKEN_HERE`
- **Admin Endpoint**: `/admin/roles`

---

## ⚠️ IMPORTANT: Payload Format

The backend expects permissions in **module + actions** format:

```json
{
  "name": "Role Name",
  "description": "Description",
  "permissions": [
    {
      "module": "leads",
      "actions": ["read", "update", "assign"]
    },
    {
      "module": "properties",
      "actions": ["read", "create", "update"]
    }
  ]
}
```

---

## 1. CREATE NEW ROLE

### Command 1: Sales Manager Role
```bash
curl -X POST "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Sales Manager",
    "description": "Manages leads and properties for sales team",
    "permissions": [
      {
        "module": "leads",
        "actions": ["read", "assign", "update"]
      },
      {
        "module": "properties",
        "actions": ["read", "update"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      }
    ]
  }'
```

### Command 2: Property Manager Role
```bash
curl -X POST "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Property Manager",
    "description": "Full control over properties and related operations",
    "permissions": [
      {
        "module": "properties",
        "actions": ["read", "create", "update", "delete"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      },
      {
        "module": "reports",
        "actions": ["read"]
      }
    ]
  }'
```

### Command 3: Employee Viewer Role
```bash
curl -X POST "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Employee Viewer",
    "description": "Can view employee information only",
    "permissions": [
      {
        "module": "employees",
        "actions": ["read"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      }
    ]
  }'
```

### Command 4: Admin Role (Full Permissions)
```bash
curl -X POST "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Administrator",
    "description": "Complete system access with all permissions",
    "permissions": [
      {
        "module": "leads",
        "actions": ["read", "assign", "update", "delete"]
      },
      {
        "module": "properties",
        "actions": ["read", "create", "update", "delete"]
      },
      {
        "module": "employees",
        "actions": ["read", "create", "update", "delete"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      },
      {
        "module": "reports",
        "actions": ["read"]
      },
      {
        "module": "users",
        "actions": ["read", "create", "update"]
      }
    ]
  }'
```

### Command 5: Leads Team Role
```bash
curl -X POST "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Leads Manager",
    "description": "Complete leads management with view/create/edit/delete",
    "permissions": [
      {
        "module": "leads",
        "actions": ["read", "create", "update", "delete", "assign"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      }
    ]
  }'
```

---

## 2. UPDATE EXISTING ROLE

### Command 1: Update Role with Different Permissions
```bash
curl -X PUT "https://abc.bhoomitechzone.us/admin/roles/ROLE_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Sales Manager",
    "description": "Updated sales manager with enhanced permissions",
    "permissions": [
      {
        "module": "leads",
        "actions": ["read", "assign", "update", "delete"]
      },
      {
        "module": "properties",
        "actions": ["read", "create", "update"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      },
      {
        "module": "reports",
        "actions": ["read"]
      }
    ]
  }'
```

### Command 2: Update Role Name & Description Only
```bash
curl -X PUT "https://abc.bhoomitechzone.us/admin/roles/ROLE_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Senior Sales Manager",
    "description": "Senior manager responsible for large sales teams",
    "permissions": [
      {
        "module": "leads",
        "actions": ["read", "assign", "update"]
      },
      {
        "module": "properties",
        "actions": ["read", "update"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      },
      {
        "module": "reports",
        "actions": ["read"]
      }
    ]
  }'
```

### Command 3: Revoke Permissions from Role
```bash
curl -X PUT "https://abc.bhoomitechzone.us/admin/roles/ROLE_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Property Viewer",
    "description": "Can only view properties",
    "permissions": [
      {
        "module": "properties",
        "actions": ["read"]
      },
      {
        "module": "dashboard",
        "actions": ["read"]
      }
    ]
  }'
```

---

## Available Permissions Mapping

### UI Permission IDs → Backend Format

| UI Permission ID | Module | Actions |
|---|---|---|
| LEAD_VIEW | leads | read |
| LEAD_ASSIGN | leads | assign |
| LEAD_EDIT | leads | update |
| LEAD_DELETE | leads | delete |
| PROPERTY_VIEW | properties | read |
| PROPERTY_CREATE | properties | create |
| PROPERTY_EDIT | properties | update |
| PROPERTY_DELETE | properties | delete |
| EMPLOYEE_VIEW | employees | read |
| EMPLOYEE_CREATE | employees | create |
| EMPLOYEE_EDIT | employees | update |
| EMPLOYEE_DELETE | employees | delete |
| DASHBOARD_VIEW | dashboard | read |
| REPORTS_VIEW | reports | read |
| USER_VIEW | users | read |
| USER_CREATE | users | create |
| USER_EDIT | users | update |

---

## Modules Supported

1. **leads** - Actions: read, create, update, delete, assign
2. **properties** - Actions: read, create, update, delete
3. **employees** - Actions: read, create, update, delete
4. **dashboard** - Actions: read
5. **reports** - Actions: read
6. **users** - Actions: read, create, update, delete

---

## Success Response Format
```json
{
  "success": true,
  "message": "Role created/updated successfully",
  "data": {
    "_id": "role_id",
    "name": "Role Name",
    "description": "Role description",
    "permissions": [
      {
        "module": "leads",
        "actions": ["read", "update"]
      }
    ],
    "createdAt": "2026-02-03T10:00:00Z",
    "updatedAt": "2026-02-03T10:00:00Z"
  }
}
```

---

## Testing Sequence

### Step 1: Create Admin Role
```bash
curl -X POST "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Administrator",
    "description": "Complete system access with all permissions",
    "permissions": [
      {"module": "leads", "actions": ["read", "assign", "update", "delete"]},
      {"module": "properties", "actions": ["read", "create", "update", "delete"]},
      {"module": "employees", "actions": ["read", "create", "update", "delete"]},
      {"module": "dashboard", "actions": ["read"]},
      {"module": "reports", "actions": ["read"]},
      {"module": "users", "actions": ["read", "create", "update"]}
    ]
  }'
```

**Save the returned role `_id`**

### Step 2: Verify Role Created
```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/roles" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### Step 3: Get Single Role Details
```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/roles/SAVED_ROLE_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### Step 4: Update the Role (Optional)
```bash
curl -X PUT "https://abc.bhoomitechzone.us/admin/roles/SAVED_ROLE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Administrator",
    "description": "Complete system access with all permissions",
    "permissions": [
      {"module": "leads", "actions": ["read", "assign", "update", "delete"]},
      {"module": "properties", "actions": ["read", "create", "update", "delete"]},
      {"module": "employees", "actions": ["read", "create", "update", "delete"]},
      {"module": "dashboard", "actions": ["read"]},
      {"module": "reports", "actions": ["read"]},
      {"module": "users", "actions": ["read", "create", "update"]}
    ]
  }'
```

### Step 5: Delete Role (if needed)
```bash
curl -X DELETE "https://abc.bhoomitechzone.us/admin/roles/SAVED_ROLE_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

---

## Common Use Cases

### 1. Viewer Only Role
```json
{
  "name": "Viewer",
  "description": "Can only view data",
  "permissions": [
    {"module": "leads", "actions": ["read"]},
    {"module": "properties", "actions": ["read"]},
    {"module": "dashboard", "actions": ["read"]}
  ]
}
```

### 2. Editor Role
```json
{
  "name": "Editor",
  "description": "Can view and edit data",
  "permissions": [
    {"module": "leads", "actions": ["read", "update"]},
    {"module": "properties", "actions": ["read", "update"]},
    {"module": "dashboard", "actions": ["read"]}
  ]
}
```

### 3. Creator Role
```json
{
  "name": "Creator",
  "description": "Can create and manage data",
  "permissions": [
    {"module": "leads", "actions": ["read", "create", "update"]},
    {"module": "properties", "actions": ["read", "create", "update"]},
    {"module": "dashboard", "actions": ["read"]}
  ]
}
```

### 4. Full Control Role
```json
{
  "name": "Manager",
  "description": "Complete control with delete permissions",
  "permissions": [
    {"module": "leads", "actions": ["read", "create", "update", "delete", "assign"]},
    {"module": "properties", "actions": ["read", "create", "update", "delete"]},
    {"module": "employees", "actions": ["read", "create", "update", "delete"]},
    {"module": "dashboard", "actions": ["read"]},
    {"module": "reports", "actions": ["read"]}
  ]
}
```

---

## Notes

1. **UI Conversion**: The React Native UI automatically converts simple permission IDs (like LEAD_VIEW) to module+actions format before sending to backend
2. **Duplicate Actions**: Duplicate actions in a module are automatically removed
3. **Token Required**: All requests require valid admin authentication token
4. **Validation**: Backend validates all modules and actions exist before creating/updating role



