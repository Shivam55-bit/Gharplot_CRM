# Reminder Notification API Endpoints - Complete CURL Reference

## Base URL
```
https://abc.bhoomitechzone.us
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer YOUR_TOKEN
```

---

## 📋 Employee Reminder APIs

### 1. Get All Reminders (List)
Fetch paginated list of reminders for employee.

```bash
curl -X GET "https://abc.bhoomitechzone.us/employee/reminders/list?page=1&limit=20&status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending/completed/cancelled)
- `assignmentType` (optional): Filter by assignment type

**Response:**
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "_id": "reminder_id",
        "title": "Follow up with client",
        "description": "Call regarding property",
        "reminderDate": "2026-01-10T10:30:00.000Z",
        "status": "pending",
        "clientInfo": {
          "name": "John Doe",
          "phone": "9876543210"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReminders": 100,
      "limit": 20
    }
  }
}
```

---

### 2. Get Reminder Statistics
Get summary statistics of employee reminders.

```bash
curl -X GET "https://abc.bhoomitechzone.us/employee/reminders/stats" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 45,
    "completed": 100,
    "cancelled": 5,
    "overdue": 10,
    "dueToday": 8
  }
}
```

---

### 3. Create Reminder
Create a new reminder for employee.

```bash
curl --location 'https://abc.bhoomitechzone.us/api/reminder/create' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "Follow up with John Doe",
    "clientName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "location": "New York",
    "reminderDateTime": "2026-01-30T10:30:00.000Z",
    "note": "Call back regarding pricing",
    "isRepeating": false
  }'
```

**Request Body:**
```json
{
  "title": "string (required)",
  "clientName": "string (required)",
  "email": "string (optional)",
  "phone": "string (required)",
  "location": "string (optional)",
  "reminderDateTime": "ISO date string (required)",
  "note": "string (optional)",
  "isRepeating": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "_id": "reminder_id",
    "title": "Follow up with client",
    "reminderDate": "2026-01-10T10:30:00.000Z",
    "status": "pending"
  }
}
```

---

### 4. Get Employee Own Reminders
Fetch reminders created by logged-in employee.

```bash
curl -X GET "https://abc.bhoomitechzone.us/employee/reminders?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 5. Update Employee Reminder
Update reminder status or details.

```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/reminders/REMINDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Successfully contacted client"
  }'
```

**Request Body:**
```json
{
  "status": "completed|pending|cancelled",
  "notes": "string (optional)",
  "completedAt": "ISO date string (optional)"
}
```

---

### 6. Delete Employee Reminder
Delete a reminder.

```bash
curl -X DELETE "https://abc.bhoomitechzone.us/employee/reminders/REMINDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 👨‍💼 Admin Reminder APIs

### 7. Get Admin Reminder Stats
Get overall reminder statistics for all employees.

```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/reminders/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reminders": {
      "total": 500,
      "pending": 120,
      "currentlyDue": 25,
      "completed": 350,
      "byStatus": [
        { "status": "pending", "count": 120 },
        { "status": "completed", "count": 350 }
      ]
    },
    "employees": {
      "total": 15,
      "withReminders": 12
    }
  }
}
```

---

### 8. Get Employees Reminder Status
Get reminder status for all employees.

```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/reminders/employees-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "employee_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "adminReminderPopupEnabled": true,
      "reminderStats": {
        "total": 25,
        "pending": 10,
        "completed": 15,
        "overdue": 2
      }
    }
  ]
}
```

---

### 9. Get All Due Reminders (Admin)
Get all currently due reminders across all employees.

```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/reminders/due-all" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "employee": {
        "_id": "employee_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "reminders": [
        {
          "_id": "reminder_id",
          "title": "Follow up call",
          "reminderDate": "2026-01-07T10:00:00.000Z",
          "status": "pending",
          "clientInfo": {
            "name": "Client Name",
            "phone": "9876543210"
          }
        }
      ]
    }
  ]
}
```

---

### 10. Get Employee Reminders (Admin View)
Get all reminders for a specific employee.

```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/reminders/employee/EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Replace `EMPLOYEE_ID`** with actual employee ObjectId.

---

### 11. Get Employee Due Reminders
Get due reminders for a specific employee.

```bash
curl -X GET "https://abc.bhoomitechzone.us/admin/reminders/employee/EMPLOYEE_ID/due" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 👤 User (Customer) Reminder APIs

### 12. Get User Reminders
Get reminders created by normal app user.

```bash
curl -X GET "https://abc.bhoomitechzone.us/api/reminder?page=1&limit=20" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 13. Create User Reminder
Create reminder for property visit or inquiry.

```bash
curl -X POST "https://abc.bhoomitechzone.us/api/reminder" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visit property at Bandra",
    "description": "Check 2BHK flat near station",
    "reminderDate": "2026-01-10T15:00:00.000Z",
    "propertyId": "property_123"
  }'
```

---

### 14. Update User Reminder
Update user's reminder.

```bash
curl -X PUT "https://abc.bhoomitechzone.us/api/reminder/REMINDER_ID" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Visited property successfully"
  }'
```

---

### 15. Delete User Reminder
Delete user's reminder.

```bash
curl -X DELETE "https://abc.bhoomitechzone.us/api/reminder/REMINDER_ID" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔔 FCM Notification Integration

### Reminder Date Format
All `reminderDate` fields should be in **ISO 8601** format:
```
2026-01-10T10:30:00.000Z
```

### Creating Reminder with Notification
```javascript
// JavaScript Example
const reminderData = {
  title: "Follow up with client",
  description: "Call regarding property inquiry",
  reminderDate: new Date("2026-01-10 10:30 AM").toISOString(),
  enquiryId: "enquiry_123",
  clientInfo: {
    name: "John Doe",
    phone: "9876543210"
  }
};

const response = await fetch('https://abc.bhoomitechzone.us/employee/reminders/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reminderData)
});
```

---

## 📊 API Summary

| Endpoint | Method | User Type | Purpose |
|----------|--------|-----------|---------|
| `/employee/reminders/list` | GET | Employee | Get paginated reminders |
| `/employee/reminders/stats` | GET | Employee | Get reminder statistics |
| `/employee/reminders/create` | POST | Employee | Create new reminder |
| `/employee/reminders` | GET | Employee | Get own reminders |
| `/employee/reminders/:id` | PUT | Employee | Update reminder |
| `/employee/reminders/:id` | DELETE | Employee | Delete reminder |
| `/admin/reminders/stats` | GET | Admin | Overall stats |
| `/admin/reminders/employees-status` | GET | Admin | All employees status |
| `/admin/reminders/due-all` | GET | Admin | All due reminders |
| `/admin/reminders/employee/:id` | GET | Admin | Employee's reminders |
| `/admin/reminders/employee/:id/due` | GET | Admin | Employee's due reminders |
| `/api/reminder` | GET | User | Get user reminders |
| `/api/reminder` | POST | User | Create user reminder |
| `/api/reminder/:id` | PUT | User | Update user reminder |
| `/api/reminder/:id` | DELETE | User | Delete user reminder |

---

## 🔑 Token Types

1. **Employee Token**: `employeeToken` (from AsyncStorage)
2. **Admin Token**: `adminToken` (from AsyncStorage)
3. **User Token**: `token` (from AsyncStorage after OTP login)

---

## ⚠️ Error Responses

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

**Common Error Codes:**
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (reminder/employee not found)
- `500`: Internal Server Error

---

## 📱 React Native Integration Example

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get reminders
const getReminders = async () => {
  const token = await AsyncStorage.getItem('employeeToken');
  
  const response = await fetch(
    'https://abc.bhoomitechzone.us/employee/reminders/list?page=1&limit=20',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
};

// Create reminder
const createReminder = async (reminderData) => {
  const token = await AsyncStorage.getItem('employeeToken');
  
  const response = await fetch(
    'https://abc.bhoomitechzone.us/employee/reminders/create',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reminderData)
    }
  );
  
  return await response.json();
};
```

---

## 🎯 Quick Test Commands

### Test Employee Reminder Creation
```bash
TOKEN="your_employee_token_here"

curl -X POST "https://abc.bhoomitechzone.us/employee/reminders/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Reminder",
    "description": "This is a test reminder",
    "reminderDate": "2026-01-08T12:00:00.000Z"
  }'
```

### Test Admin Stats
```bash
ADMIN_TOKEN="your_admin_token_here"

curl -X GET "https://abc.bhoomitechzone.us/admin/reminders/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

**Last Updated:** January 7, 2026  
**Project:** GharPlot React Native App
