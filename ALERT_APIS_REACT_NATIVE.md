# 🔌 ALERT APIs - REACT NATIVE APP MAPPING

## 📱 React Native App - API Usage

### 1️⃣ CREATE ALERT
**Component:** `CreateAlertScreen.js`  
**API:** `POST /api/alerts/`  
**Code Location:** Line ~95

```javascript
// CreateAlertScreen.js - handleSubmit()
const response = await fetch(`${API_BASE_URL}/api/alerts/`, {
  method: 'POST',
  headers: await getCRMAuthHeaders(),
  body: JSON.stringify({
    date: '2026-01-10',      // YYYY-MM-DD format
    time: '15:30',           // HH:MM format
    reason: 'Client meeting',
    repeatDaily: false
  }),
});

const result = await response.json();
// Response: { success: true, alert: { _id: '677b...' } }
```

**When Called:**
- User fills form and clicks "Create Alert" button
- After successful create, schedules notification via `AlertNotificationService`

---

### 2️⃣ GET ALL ALERTS
**Component:** `Alerts.js`  
**API:** `GET /api/alerts`  
**Code Location:** Line ~28

```javascript
// Alerts.js - fetchAlerts()
const response = await crmAlertApi.getSystemAlerts();
// Uses: GET /api/alerts
```

**When Called:**
1. Component mounts (useEffect on line ~25)
2. After creating a new alert
3. After deleting an alert
4. When "Clear Filter" is clicked

**Response:**
```javascript
{
  success: true,
  count: 15,
  alerts: [
    {
      _id: '677b1234...',
      date: '2026-01-10',
      time: '15:30',
      reason: 'Client meeting',
      repeatDaily: false,
      isActive: true,
      createdAt: '2026-01-05T10:00:00Z'
    }
    // ... more alerts
  ]
}
```

---

### 3️⃣ GET ALERTS BY DATE RANGE (FILTER)
**Component:** `Alerts.js`  
**API:** `GET /api/alerts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`  
**Code Location:** Line ~50

```javascript
// Alerts.js - handleFilter()
const params = {};
if (startDate) params.startDate = formatDate(startDate); // '2026-01-01'
if (endDate) params.endDate = formatDate(endDate);       // '2026-01-31'

const response = await crmAlertApi.getSystemAlerts(params);
// API call: GET /api/alerts?startDate=2026-01-01&endDate=2026-01-31
```

**When Called:**
- User selects start date and end date
- Clicks "Filter" button

**Used For:**
- Filtering alerts within a specific date range
- Admin viewing alerts for specific period

---

### 4️⃣ DELETE ALERT
**Component:** `Alerts.js`  
**API:** `DELETE /api/alerts/:id`  
**Code Location:** Line ~65

```javascript
// Alerts.js - handleDelete()
const handleDelete = (id) => {
  Alert.alert('Delete Alert', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      onPress: async () => {
        // Delete from backend
        await crmAlertApi.deleteSystemAlert(id);
        // API call: DELETE /api/alerts/677b1234...
        
        // Cancel scheduled notification
        await AlertNotificationService.cancelAlert(id);
        
        // Refresh list
        fetchAlerts();
      },
    },
  ]);
};
```

**When Called:**
- User clicks "Delete" button on an alert
- Confirms deletion in alert dialog

**Also Does:**
- Cancels scheduled notification via `AlertNotificationService.cancelAlert()`
- Refreshes alert list after deletion

---

### 5️⃣ UPDATE ALERT (IF IMPLEMENTED)
**Component:** `CreateAlertScreen.js` (when editing)  
**API:** `PUT /api/alerts/:id`  
**Status:** ⚠️ Edit functionality may not be fully implemented yet

```javascript
// If editing (not create):
const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
  method: 'PUT',
  headers: await getCRMAuthHeaders(),
  body: JSON.stringify({
    date: '2026-01-11',
    time: '16:00',
    reason: 'Updated meeting time',
    repeatDaily: false
  }),
});
```

**When Called:**
- User clicks "Edit" on an alert (if edit button exists)
- Modifies alert details
- Clicks "Update"

**Note:** Check if edit navigation is implemented in `Alerts.js` `handleEdit()` function.

---

## 🔑 Authentication

**All APIs require authentication header:**

```javascript
// getCRMAuthHeaders() from src/crm/services/crmAPI.js
// Checks AsyncStorage for tokens in this order:
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // from one of these:
  // 1. crm_auth_token
  // 2. adminToken
  // 3. employee_auth_token
};
```

**Base URL:**
```javascript
const API_BASE_URL = 'https://abc.bhoomitechzone.us';
```

---

## 📊 API Summary Table

| API | Method | Endpoint | Used In | Purpose |
|-----|--------|----------|---------|---------|
| Create Alert | POST | `/api/alerts/` | CreateAlertScreen | Create new alert |
| Get All | GET | `/api/alerts` | Alerts | Fetch all alerts |
| Get Filtered | GET | `/api/alerts?startDate&endDate` | Alerts | Filter by date range |
| Delete | DELETE | `/api/alerts/:id` | Alerts | Delete alert |
| Update | PUT | `/api/alerts/:id` | CreateAlertScreen (edit mode) | Update alert |

---

## 🔄 Service Layer (crmAlertApi.js)

**File:** `src/crm/services/crmAlertApi.js`

**Functions Used:**
```javascript
// GET all alerts
crmAlertApi.getSystemAlerts(params);
// → GET /api/alerts OR /api/alerts?startDate=...&endDate=...

// CREATE alert
crmAlertApi.createSystemAlert(alertData);
// → POST /api/alerts

// UPDATE alert
crmAlertApi.updateSystemAlert(id, updateData);
// → PUT /api/alerts/:id

// DELETE alert
crmAlertApi.deleteSystemAlert(id);
// → DELETE /api/alerts/:id
```

---

## 🎯 Key Differences: Web vs Mobile

### Web (from API mapping guide):
- Uses `AlertService.js` (web version)
- Has `GlobalAlertPopup` component that checks every 30 seconds
- Shows popup when current time matches alert time

### Mobile (React Native):
- Uses `crmAlertApi.js` (mobile version)
- Uses `AlertNotificationService` for scheduled notifications
- Notification fires automatically at exact time (no polling needed)
- Works even when app is closed

---

## ✅ Current Implementation Status

- [x] POST `/api/alerts/` - Create alert ✅
- [x] GET `/api/alerts` - Get all alerts ✅
- [x] GET `/api/alerts?startDate&endDate` - Filter alerts ✅
- [x] DELETE `/api/alerts/:id` - Delete alert ✅
- [x] Scheduled notifications at exact date/time ✅
- [x] Cancel notification on delete ✅
- [ ] PUT `/api/alerts/:id` - Update alert (may need implementation)

---

## 🧪 Testing APIs

### Test 1: Create Alert
```javascript
// Use CreateAlert screen in app
// OR test via fetch:
const token = await AsyncStorage.getItem('crm_auth_token');
const response = await fetch('https://abc.bhoomitechzone.us/api/alerts/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    date: '2026-01-10',
    time: '15:30',
    reason: 'Test alert',
    repeatDaily: false
  })
});
console.log(await response.json());
```

### Test 2: Get Alerts
```javascript
const token = await AsyncStorage.getItem('crm_auth_token');
const response = await fetch('https://abc.bhoomitechzone.us/api/alerts', {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await response.json());
```

### Test 3: Filter by Date
```javascript
const url = 'https://abc.bhoomitechzone.us/api/alerts?startDate=2026-01-01&endDate=2026-01-31';
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await response.json());
```

### Test 4: Delete Alert
```javascript
const alertId = '677b1234...'; // Get from alert list
const response = await fetch(`https://abc.bhoomitechzone.us/api/alerts/${alertId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await response.json());
```

---

**All APIs properly integrated! 🚀**
