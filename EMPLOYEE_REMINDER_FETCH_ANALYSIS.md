# Employee Reminder Fetch Analysis

## Curl Command Provided
```bash
curl --location 'https://abc.bhoomitechzone.us/api/reminder/employee/696b869560c90a398567116d' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MjMwZWM5OWU0NDM4YzhlNGE3M2IzZSIsImlhdCI6MTc2OTI0ODM1NSwiZXhwIjoxNzY5ODUzMTU1fQ.a7uQgPsNQGQF7rlTsawOHJtcgbeNckdXTIHyfaQRtV4'
```

## Endpoint
- **GET** `/api/reminder/employee/{employeeId}`
- **Purpose**: Fetch all reminders for a specific employee
- **Response**: Returns 15 active reminders with detailed information

## Employee Details (from response)
- **Employee ID**: `696b869560c90a398567116d`
- **Employee Name**: `shivam`
- **Employee Email**: `shivam@gmail.com`
- **Total Reminders**: 15

## Reminder Data Structure

Each reminder contains:
```json
{
  "_id": "696bbc0e60c90a3985672a0f",
  "employeeId": {
    "_id": "696b869560c90a398567116d",
    "name": "shivam",
    "email": "shivam@gmail.com"
  },
  "title": "Follow up with Shivam",
  "comment": "Reminder to follow up with Shivam",
  "note": "",
  "clientName": "Shivam",
  "phone": "9717208313",
  "email": "shivamsoftage2000@gmail.com",
  "location": "N/A",
  "reminderDateTime": "2026-01-17T22:13:00.000Z",
  "timezone": "UTC",
  "isRepeating": false,
  "repeatType": "daily",
  "isActive": true,
  "status": "pending",
  "responseWordCount": 0,
  "responseColor": "red",
  "snoozeCount": 3,
  "triggerCount": 157,
  "notifications": [
    {
      "triggeredAt": "2026-01-17T18:13:36.049Z",
      "acknowledged": true,
      "acknowledgedAt": "2026-01-17T18:13:36.049Z",
      "action": "snoozed",
      "_id": "696bd15060c90a3985672f44"
    }
  ],
  "createdAt": "2026-01-17T16:42:54.887Z",
  "updatedAt": "2026-01-24T10:37:00.176Z",
  "__v": 3,
  "lastTriggered": "2026-01-24T10:37:00.068Z"
}
```

## Key Observations

### 1. Reminders Are Being Tracked
- Employee has 15 active reminders
- Each reminder tracks notification history
- System logs trigger counts and snooze counts

### 2. Notification Tracking
- Reminders have a `notifications` array
- Each notification event includes:
  - `triggeredAt`: When the notification was sent
  - `acknowledged`: Whether the employee acknowledged it
  - `acknowledgedAt`: When it was acknowledged
  - `action`: What action was taken (e.g., "snoozed")

### 3. Reminder States
- `isActive`: true (reminders are active)
- `status`: "pending" (waiting for trigger time)
- `triggerCount`: Number of times notification was triggered
- `snoozeCount`: Number of times user snoozed

## Next Steps for Admin Notification Implementation

1. **Verify Admin FCM Token**
   - Check if admin has FCM token registered
   - Use: `GET /api/fcm-token/{adminId}`

2. **Test Admin Notification Endpoint**
   - Use: `POST /admin/notifications` with the updated payload structure
   - Should trigger FCM notification to admin device

3. **Verify popupEnabled Status**
   - Check employee profile for `popupEnabled` field
   - Use: `GET /api/employees/{employeeId}/profile`

4. **Monitor Notification Flow**
   - Create a reminder with `popupEnabled: true`
   - Check if admin receives FCM notification
   - Verify notification payload in logs

## API Endpoints Referenced
- `GET /api/reminder/employee/{employeeId}` - Get employee reminders
- `GET /api/employees/{employeeId}/profile` - Get employee profile
- `POST /api/reminder/create` - Create new reminder
- `POST /admin/notifications` - Send admin notification (FCM)
- `GET /api/fcm-token/{userId}` - Get FCM token
- `POST /api/fcm-token` - Register/update FCM token
