# CRM API Integration - Pending List

## 📊 Integration Status Overview

**Last Updated:** December 15, 2025

---

## ✅ Already Integrated APIs

### 1. Authentication APIs ✅
**File:** `src/services/authApi.js`
- ✅ POST `/auth/signup` - User signup
- ✅ POST `/auth/login` - User login
- ✅ POST `/auth/send-phone-otp` - Send phone OTP
- ✅ POST `/auth/verify-phone-otp` - Verify phone OTP
- ✅ POST `/auth/send-email-otp` - Send email OTP
- ✅ POST `/auth/verify-email-otp` - Verify email OTP
- ✅ POST `/auth/complete-registration` - Complete registration
- ✅ POST `/auth/logout` - User logout
- ✅ POST `/auth/refresh-token` - Token refresh

### 2. Property APIs ✅
**File:** `src/services/propertyapi.js`, `propertyService.js`
- ✅ POST `/api/property/add` - Add property
- ✅ PUT `/property/edit/:propertyId` - Update property
- ✅ GET `/api/properties/allOther` - Get all marketplace properties
- ✅ GET `/api/properties/my-rent` - Get my rent properties
- ✅ GET `/api/properties/my-sell-properties` - Get my sell properties
- ✅ GET `/api/properties/saved/all` - Get saved properties
- ✅ GET `/property/nearby` - Get nearby properties
- ✅ POST `/api/properties/save` - Save/unsave property
- ✅ DELETE `/api/properties/remove` - Remove saved property

### 3. Dashboard APIs ✅
**File:** `src/services/dashboardService.js`
- ✅ GET `/api/crm/dashboard` - Employee dashboard data
- ✅ GET `/api/crm/dashboard/stats` - Dashboard statistics

### 4. Leads APIs ✅ (Partial)
**File:** `src/services/leadsService.js`
- ✅ GET `/api/crm/leads` - Get employee leads
- ✅ GET `/api/crm/leads/stats` - Lead statistics (employee view)

### 5. Reminders APIs ✅
**File:** `src/services/remindersService.js`
- ✅ GET `/api/crm/reminders` - Get reminders
- ✅ POST `/api/crm/reminders` - Create reminder
- ✅ PUT `/api/crm/reminders/:id` - Update reminder
- ✅ DELETE `/api/crm/reminders/:id` - Delete reminder
- ✅ GET `/api/crm/reminders/stats` - Reminder statistics

### 6. Payment APIs ✅
**File:** `src/services/paymentapi.js`
- ✅ POST `/payment/create-order` - Create payment order
- ✅ POST `/payment/verify` - Verify payment
- ✅ POST `/service-request` - Submit service request

### 7. Chat & Notifications APIs ✅
**File:** `src/services/chatApi.js`, `chatNotificationService.js`
- ✅ POST `/api/chat/send` - Send chat message
- ✅ GET `/api/chat/messages` - Get chat messages
- ✅ POST `/api/save-token` - Save FCM token
- ✅ POST `/api/notifications/send` - Send notification

---

## ❌ Pending APIs for Integration

### 1. User Management APIs ❌
**Screen:** `UserManagementScreen.js`
**Priority:** 🔴 HIGH
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/users` - Get all users with pagination & filters
  - Query params: `page`, `limit`, `status`, `search`
  - Response: User list with stats
  
- ❌ GET `/api/crm/users/:userId` - Get single user details
  - Response: Full user profile
  
- ❌ POST `/api/crm/users` - Create new user
  - Body: `name`, `email`, `phone`, `role`, `status`
  
- ❌ PUT `/api/crm/users/:userId` - Update user details
  - Body: User update fields
  
- ❌ DELETE `/api/crm/users/:userId` - Delete user (soft delete)
  
- ❌ POST `/api/crm/users/:userId/deactivate` - Deactivate user account
  
- ❌ POST `/api/crm/users/:userId/activate` - Activate user account
  
- ❌ GET `/api/crm/users/stats` - Get user statistics
  - Response: `totalUsers`, `activeUsers`, `inactiveUsers`, `newUsers`

**Service File to Create:** `src/services/userManagementService.js`

---

### 2. User Assignment APIs ❌
**Screen:** `UserAssignmentsScreen.js`
**Priority:** 🔴 HIGH
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/assignments` - Get all user-employee assignments
  - Query params: `status` (assigned/unassigned)
  
- ❌ POST `/api/crm/assignments/assign` - Assign user to employee
  - Body: `userId`, `employeeId`
  
- ❌ POST `/api/crm/assignments/unassign` - Unassign user from employee
  - Body: `userId`, `employeeId`
  
- ❌ GET `/api/crm/employees/capacity` - Get employees with capacity info
  - Response: Employee list with `assignedUsers`, `maxCapacity`
  
- ❌ GET `/api/crm/assignments/stats` - Assignment statistics
  - Response: `totalAssignments`, `unassignedUsers`, `employeeLoad`

**Service File to Create:** `src/services/assignmentService.js`

---

### 3. Employee Management APIs ❌
**Screen:** `EmployeeManagementScreen.js`
**Priority:** 🔴 HIGH
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/employees` - Get all employees
  - Query params: `page`, `limit`, `department`, `status`, `search`
  
- ❌ GET `/api/crm/employees/:empId` - Get employee details
  
- ❌ POST `/api/crm/employees` - Create new employee
  - Body: `name`, `email`, `phone`, `department`, `role`, `salary`
  
- ❌ PUT `/api/crm/employees/:empId` - Update employee
  
- ❌ DELETE `/api/crm/employees/:empId` - Delete employee
  
- ❌ GET `/api/crm/employees/:empId/performance` - Get performance metrics
  - Response: `totalLeads`, `conversions`, `rating`, `attendance`
  
- ❌ GET `/api/crm/employees/stats` - Employee statistics
  - Response: `totalEmployees`, `activeEmployees`, `departments`
  
- ❌ POST `/api/crm/employees/:empId/status` - Update employee status
  - Body: `status` (active/inactive/leave)

**Service File to Create:** `src/services/employeeManagementService.js`

---

### 4. Role Management APIs ❌
**Screen:** `RoleManagementScreen.js`
**Priority:** 🟡 MEDIUM
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/roles` - Get all roles
  
- ❌ GET `/api/crm/roles/:roleId` - Get role details with permissions
  
- ❌ POST `/api/crm/roles` - Create new role
  - Body: `name`, `description`, `permissions[]`
  
- ❌ PUT `/api/crm/roles/:roleId` - Update role
  
- ❌ DELETE `/api/crm/roles/:roleId` - Delete role
  
- ❌ GET `/api/crm/permissions` - Get all available permissions
  
- ❌ POST `/api/crm/roles/:roleId/permissions` - Assign permissions to role
  - Body: `permissions[]`
  
- ❌ GET `/api/crm/roles/stats` - Role usage statistics

**Service File to Create:** `src/services/roleManagementService.js`

---

### 5. All Leads Management APIs (Admin) ❌
**Screen:** `AllLeadsScreen.js`
**Priority:** 🔴 HIGH
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/admin/leads` - Get all leads (admin view)
  - Query params: `page`, `limit`, `status`, `priority`, `assignedTo`, `search`
  
- ❌ GET `/api/crm/admin/leads/stats` - Lead statistics (admin view)
  - Response: `totalLeads`, `hotLeads`, `warmLeads`, `coldLeads`
  
- ❌ POST `/api/crm/admin/leads` - Create manual lead entry
  - Body: Lead details
  
- ❌ PUT `/api/crm/admin/leads/:leadId/assign` - Assign lead to employee
  - Body: `employeeId`
  
- ❌ PUT `/api/crm/admin/leads/:leadId/status` - Update lead status
  - Body: `status` (hot/warm/cold)
  
- ❌ PUT `/api/crm/admin/leads/:leadId/priority` - Update lead priority
  - Body: `priority` (high/medium/low)
  
- ❌ DELETE `/api/crm/admin/leads/:leadId` - Delete lead
  
- ❌ GET `/api/crm/admin/leads/:leadId/history` - Get lead activity history

**Service File to Create:** `src/services/adminLeadsService.js`

---

### 6. Performance Alerts APIs ❌
**Screen:** `BadAttendantAlertsScreen.js`
**Priority:** 🟡 MEDIUM
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/alerts/performance` - Get performance alerts
  - Query params: `severity`, `status`, `employeeId`
  
- ❌ GET `/api/crm/alerts/performance/stats` - Alert statistics
  - Response: `totalAlerts`, `critical`, `high`, `medium`, `low`, `pending`
  
- ❌ PUT `/api/crm/alerts/:alertId/status` - Update alert status
  - Body: `status` (pending/reviewed/escalated/resolved)
  
- ❌ POST `/api/crm/alerts/:alertId/action` - Take action on alert
  - Body: `action` (warning/meeting/escalate/resolve), `notes`
  
- ❌ POST `/api/crm/alerts/:alertId/escalate` - Escalate alert to manager
  - Body: `managerId`, `reason`
  
- ❌ POST `/api/crm/alerts/:alertId/resolve` - Mark alert as resolved
  - Body: `resolution`, `notes`
  
- ❌ GET `/api/crm/employees/:empId/alerts` - Get alerts for specific employee

**Service File to Create:** `src/services/performanceAlertsService.js`

---

### 7. Property Listings Management APIs (Admin) ❌
**Screen:** `PropertyListingsScreen.js`
**Priority:** 🟡 MEDIUM
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/admin/properties` - Get all properties (admin view)
  - Query params: `page`, `limit`, `status`, `type`, `featured`, `search`
  
- ❌ GET `/api/crm/admin/properties/stats` - Property statistics (admin)
  - Response: `totalProperties`, `active`, `sold`, `pending`, `featured`
  
- ❌ PUT `/api/crm/admin/properties/:propId/status` - Update property status
  - Body: `status` (active/pending/sold/inactive)
  
- ❌ PUT `/api/crm/admin/properties/:propId/feature` - Mark as featured
  - Body: `featured` (true/false)
  
- ❌ DELETE `/api/crm/admin/properties/:propId` - Delete property (admin)
  
- ❌ GET `/api/crm/admin/properties/pending` - Get pending approval properties
  
- ❌ POST `/api/crm/admin/properties/:propId/approve` - Approve property
  - Body: `approved` (true/false), `notes`
  
- ❌ GET `/api/crm/admin/properties/:propId/views` - Get property view analytics

**Service File to Create:** `src/services/adminPropertyService.js`

---

### 8. Admin Reminder Control APIs ❌
**Screen:** `AdminReminderControlScreen.js`
**Priority:** 🟡 MEDIUM
**Status:** Screen functional, needs admin-specific APIs

#### Required Endpoints:
- ❌ GET `/api/crm/admin/reminders` - Get all reminders (admin view)
  - Query params: `page`, `limit`, `status`, `employeeId`, `dateRange`
  
- ❌ POST `/api/crm/admin/reminders/bulk` - Create bulk reminders
  - Body: Array of reminder objects
  
- ❌ PUT `/api/crm/admin/reminders/:id/reassign` - Reassign reminder to different employee
  - Body: `newEmployeeId`
  
- ❌ DELETE `/api/crm/admin/reminders/bulk` - Delete multiple reminders
  - Body: `reminderIds[]`
  
- ❌ GET `/api/crm/admin/reminders/analytics` - Reminder analytics
  - Response: Completion rates, response times, etc.
  
- ❌ POST `/api/crm/admin/reminders/template` - Create reminder template
  - Body: Template details

**Service File to Update:** `src/services/remindersService.js` (add admin methods)

---

### 9. Admin Reminder Monitor APIs ❌
**Screen:** `AdminReminderMonitorScreen.js`
**Priority:** 🟡 MEDIUM
**Status:** Screen functional, needs monitoring APIs

#### Required Endpoints:
- ❌ GET `/api/crm/admin/reminders/monitor` - Monitor all reminders in real-time
  - Response: Live reminder status, completion rates
  
- ❌ GET `/api/crm/admin/reminders/compliance` - Compliance statistics
  - Response: 10-word rule compliance, response rates
  
- ❌ GET `/api/crm/admin/employees/reminder-stats` - Per-employee reminder stats
  - Response: Each employee's reminder performance
  
- ❌ GET `/api/crm/admin/reminders/overdue` - Get overdue reminders
  
- ❌ GET `/api/crm/admin/reminders/trends` - Get reminder trends over time
  - Query params: `startDate`, `endDate`, `employeeId`

**Service File to Update:** `src/services/remindersService.js` (add monitoring methods)

---

### 10. System Alerts Management APIs ❌
**Screen:** `Alerts.js` (Admin)
**Priority:** 🟢 LOW
**Status:** Screen ready with mock data

#### Required Endpoints:
- ❌ GET `/api/crm/admin/alerts` - Get system alerts
  - Query params: `type`, `severity`, `status`
  
- ❌ POST `/api/crm/admin/alerts` - Create system alert
  - Body: `title`, `message`, `type`, `severity`, `targetUsers[]`
  
- ❌ PUT `/api/crm/admin/alerts/:alertId` - Update alert
  
- ❌ DELETE `/api/crm/admin/alerts/:alertId` - Delete alert
  
- ❌ POST `/api/crm/admin/alerts/broadcast` - Broadcast alert to all users
  - Body: `message`, `priority`, `channels[]`
  
- ❌ GET `/api/crm/admin/alerts/stats` - Alert engagement statistics

**Service File to Create:** `src/services/systemAlertsService.js`

---

## 📊 Summary Statistics

### Integration Progress
- **Total API Groups:** 10
- **Fully Integrated:** 7 groups (Auth, Property, Dashboard, Leads-partial, Reminders, Payment, Chat)
- **Pending Integration:** 10 groups (CRM Admin specific)
- **Completion:** ~40%

### API Endpoints Count
- **Already Integrated:** ~35 endpoints
- **Pending Integration:** ~65 endpoints
- **Total Required:** ~100 endpoints

### Priority Breakdown
- 🔴 **High Priority:** 4 API groups (Users, Assignments, Employees, Admin Leads)
- 🟡 **Medium Priority:** 5 API groups (Roles, Alerts, Properties Admin, Reminders Admin)
- 🟢 **Low Priority:** 1 API group (System Alerts)

---

## 🎯 Next Steps

### Phase 1 - High Priority (Week 1-2)
1. ✅ Create service files for User Management
2. ✅ Create service files for Employee Management
3. ✅ Create service files for User Assignments
4. ✅ Create service files for Admin Leads

### Phase 2 - Medium Priority (Week 3-4)
1. ⏳ Create service files for Performance Alerts
2. ⏳ Create service files for Admin Property Management
3. ⏳ Enhance Reminders service with admin features
4. ⏳ Create Role Management service

### Phase 3 - Low Priority (Week 5)
1. ⏳ Create System Alerts service
2. ⏳ Add analytics and reporting endpoints
3. ⏳ Optimize and test all integrations

---

## 📝 Notes

### Backend Requirements
- All CRM admin APIs need proper authentication & authorization
- Role-based access control (RBAC) must be implemented
- Pagination required for list endpoints (default: 10 items per page)
- Search and filter functionality needed
- Real-time updates via WebSocket for monitoring screens

### Frontend Integration Pattern
```javascript
// Example service file structure
import apiClient from './apiClient';

export const serviceName = {
  getAll: async (params) => {
    const response = await apiClient.get('/endpoint', params);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/endpoint/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/endpoint', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/endpoint/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/endpoint/${id}`);
    return response.data;
  }
};
```

### Testing Requirements
- Unit tests for all service methods
- Integration tests with mock API responses
- End-to-end testing for critical flows
- Performance testing for large datasets

---

## 🔗 Related Files

- **API Client:** `src/crm/services/apiClient.js`
- **Auth Service:** `src/crm/services/authService.js`
- **Main Services Directory:** `src/services/`
- **Screen Files:** `src/crm/crmscreens/Admin/`

---

**Document Status:** Active
**Maintained By:** Development Team
**Review Frequency:** Weekly updates
