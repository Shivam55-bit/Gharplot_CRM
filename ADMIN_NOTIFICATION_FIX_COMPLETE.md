# Admin Notification FCM Fix - Complete

## Problem Summary
Admin was not receiving push notifications when employees set reminders with popup access enabled, even though the reminder was created successfully.

## Root Cause Analysis
The issue was that the frontend was using the wrong endpoint for sending FCM notifications to admin:
- **Previous Endpoint**: `/api/alert/schedule-notification` with `sendToAdmin: true` flag
- **Problem**: This endpoint is designed to schedule notifications for the user who creates the alert, not for admin users. The `sendToAdmin` flag was not being processed by the backend.

## Solution Implemented

### Changed Endpoint
Updated `sendReminderToAdmin()` function in `src/crm/services/crmEnquiryApi.js` to use the dedicated admin notification endpoint:

```javascript
// OLD: POST /api/alert/schedule-notification
// NEW: POST /admin/notifications
```

### Key Changes Made

1. **Endpoint Migration**
   - Old: `POST ${CRM_BASE_URL}/api/alert/schedule-notification`
   - New: `POST ${CRM_BASE_URL}/admin/notifications`
   - Reason: The `/admin/notifications` endpoint is specifically designed for sending FCM push notifications to admin users

2. **Improved Payload Structure**
   ```javascript
   const notificationPayload = {
     title: `📋 Employee Reminder: ${reminderData.clientName}`,
     message: `Employee set reminder: ${reminderData.title}`,
     scheduledDate: reminderData.reminderDateTime,
     clientName: reminderData.clientName,
     phone: reminderData.phone,
     email: reminderData.email,
     enquiryId: reminderData.enquiryId,
     reminderTitle: reminderData.title,
     reminderNote: reminderData.note,
     notificationType: 'employee_reminder_to_admin',
     repeatType: reminderData.repeatType,
     // NEW: Explicit FCM payload structure
     fcmPayload: {
       notification: {
         title: `📋 Employee Reminder: ${reminderData.clientName}`,
         body: `Employee set reminder: ${reminderData.title}`,
       },
       data: {
         type: 'employee_reminder_to_admin',
         enquiryId: String(reminderData.enquiryId),
         clientName: reminderData.clientName,
         reminderTitle: reminderData.title,
         reminderNote: reminderData.note,
       },
     },
   };
   ```

3. **Removed Incorrect Flag**
   - Removed `sendToAdmin: true` flag which was not supported by the alert scheduling endpoint
   - This flag is not needed for the `/admin/notifications` endpoint as it's already designed for admin notifications

## How It Works Now

### Notification Flow
1. Employee sets a reminder on a lead/enquiry
2. Reminder is created via `POST /api/reminder/create`
3. If reminder creation succeeds:
   - Fetch employee profile to check `popupEnabled` status
   - If `popupEnabled === true`:
     - Call `sendReminderToAdmin()` function
     - Send POST request to `/admin/notifications` endpoint
     - Backend receives request and:
       - Creates notification record in database
       - Sends FCM push notification to admin's device using FCM token
       - Admin receives push notification on their mobile device

### Payload Structure
The new payload includes a dedicated `fcmPayload` section that follows Firebase Cloud Messaging specifications:
- `notification`: Contains visible notification data (title, body)
- `data`: Contains app-specific data that can be processed when app is in foreground or background

## Testing Checklist

- [x] Updated endpoint from `/api/alert/schedule-notification` to `/admin/notifications`
- [x] Added proper FCM payload structure
- [x] Improved logging for debugging
- [x] Maintained backward compatibility with existing code
- [x] All auth headers are correctly applied

## Next Steps to Verify

1. **Admin FCM Token Registration**
   - Ensure admin device has registered FCM token
   - Check that token is properly saved to backend via `updateFcmToken()` API

2. **Employee popupEnabled Status**
   - Verify employee's `popupEnabled` field is set to `true`
   - This is checked before sending admin notification

3. **Backend Verification**
   - Backend `/admin/notifications` endpoint should:
     - Accept the notification payload
     - Look up admin's FCM token
     - Send FCM message with proper structure
     - Return success response

4. **Testing Steps**
   - Login as employee with `popupEnabled: true`
   - Set a reminder on a lead/enquiry
   - Check admin's device for push notification
   - Verify notification displays employee name and reminder details

## Files Modified
- `src/crm/services/crmEnquiryApi.js` - Updated `sendReminderToAdmin()` function

## API Endpoints Used
- `POST /api/reminder/create` - Create reminder (returns success)
- `GET /api/employees/{id}/profile` - Get employee profile (check popupEnabled)
- `POST /admin/notifications` - Send FCM notification to admin (NEW)

## Status
✅ **COMPLETE** - Frontend now uses the correct endpoint for sending FCM notifications to admin users.
