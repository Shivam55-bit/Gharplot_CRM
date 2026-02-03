# Employee Leads API - Status Update Guide

## Overview
Employee Leads screen में तीन status options हैं:
- **Active** (Default) - Lead is in progress
- **Completed** - Lead task completed
- **Cancelled** - Lead is cancelled/rejected

## Endpoints

### Enquiry Leads Status Update
```
PUT /employee/leads/status/{assignmentId}
```

### Client Leads Status Update
```
PUT /employee/user-leads/status/{assignmentId}
```

## API Requests

### 1. Complete a Lead (Enquiry or Client)

#### Enquiry Lead
```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/leads/status/ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "completed"}'
```

#### Client Lead
```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/user-leads/status/ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "completed"}'
```

---

### 2. Reactive a Lead (Mark as Active Again)

#### Enquiry Lead
```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/leads/status/ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "active"}'
```

#### Client Lead
```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/user-leads/status/ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "active"}'
```

---

### 3. Cancel a Lead

#### Enquiry Lead
```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/leads/status/ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "cancelled"}'
```

#### Client Lead
```bash
curl -X PUT "https://abc.bhoomitechzone.us/employee/user-leads/status/ASSIGNMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "cancelled"}'
```

---

## Success Response
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "_id": "lead_id",
    "status": "completed",
    "clientName": "John Doe",
    "propertyLocation": "Mumbai",
    "updatedAt": "2026-02-03T12:00:00Z"
  }
}
```

## Error Response
```json
{
  "success": false,
  "message": "Invalid status value"
}
```

---

## Testing Steps

1. **Get Employee Token**
   - Login via `/api/auth/employee-login`
   - Copy the JWT token from response

2. **Get Assignment ID**
   - Open Employee Leads screen
   - Find any lead and note its `assignmentId` or `_id`

3. **Test Update**
   - Replace `ASSIGNMENT_ID` with actual ID
   - Replace `TOKEN` with actual JWT
   - Run curl command
   - Check response status

4. **Verify in App**
   - Refresh the Employee Leads screen
   - Status should be updated immediately

---

## Common Issues & Solutions

### ❌ 401 Unauthorized
- **Cause**: Invalid or missing token
- **Fix**: Get fresh token from login endpoint

### ❌ 404 Not Found
- **Cause**: Invalid assignmentId
- **Fix**: Verify assignmentId exists and is correct format

### ❌ 400 Bad Request
- **Cause**: Invalid status value
- **Fix**: Use only: "active", "completed", or "cancelled"

### ❌ Lead Status Not Updating in App
- **Cause**: App cache or state not refreshing
- **Fix**: Pull-to-refresh or restart app

---

## Debugging in App Console

The app logs all status update attempts. Check console for:
```
🔄 Updating enquiry lead status to: completed
📡 Request URL: https://abc.bhoomitechzone.us/employee/leads/status/...
📡 Response Status: 200
✅ Status updated successfully
```

If you see error logs, check the specific error message for debugging.

---

## Notes
- All requests require valid JWT authentication
- Status changes are immediate and persist on server
- App automatically refreshes after successful update
- Both enquiry and client leads use same status logic
