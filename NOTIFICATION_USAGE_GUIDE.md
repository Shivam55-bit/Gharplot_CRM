# 🔔 Notification Service Usage Guide

## Overview
App me comprehensive notification system integrate kiya gaya hai jo backend ke existing APIs ke saath work karta hai.

## Backend APIs Used
Backend me ye APIs ready hain:
1. **FCMtokensave** - FCM token save karne ke liye
2. **systemupdate** - System updates ke liye ✅ INTEGRATED
3. **add new property** - Nai property add hone par ✅ AUTO-NOTIFICATION
4. **inquiry** - Property inquiry notifications
5. **chat** - Chat message notifications
6. **service cancel** - Service cancellation
7. **service complete** - Service completion

### ✅ **Auto-Integrated Features:**
- **New Property**: Backend automatically sends notifications when properties are added
- **System Update**: Direct API integration with http://abc.ridealmobility.com/application/notify-update

## Notification Types Implemented

### 1. New Property Notification ✅ **AUTOMATED**
```javascript
// ⚠️ NO MANUAL CALL NEEDED - Backend automatically handles this!
// When a property is added via addProperty API, backend automatically:
// 1. Sends notification to all users except property owner
// 2. Filters out invalid/empty FCM tokens
// 3. Tracks sent/failed counts
// 4. Includes propertyId in notification data for navigation

// Backend notification format:
// {
//   title: "🏠 New Property Added!",
//   body: "A new property has just been listed.",
//   data: { propertyId: "property_id_here" }
// }

// App automatically navigates to PropertyDetailsScreen when tapped
```

### 2. Inquiry Notification
```javascript
import { sendInquiryNotification } from '../services/notificationService';

// Usage example
await sendInquiryNotification(
  'property_owner_fcm_token',
  {
    inquiryId: '456',
    propertyId: '123',
    inquirerName: 'John Doe',
    inquirerPhone: '+91 9876543210',
    message: 'Interested in viewing this property'
  }
);
```

### 3. Chat Notification
```javascript
import { sendChatNotification } from '../services/notificationService';

// Usage example
await sendChatNotification(
  'receiver_fcm_token',
  {
    chatId: '789',
    senderId: 'user123',
    senderName: 'John Doe',
    message: 'Hello, is this property still available?'
  }
);
```

### 4. Service Cancel Notification
```javascript
import { sendServiceCancelNotification } from '../services/notificationService';

// Usage example
await sendServiceCancelNotification(
  'user_fcm_token',
  {
    serviceId: '101',
    serviceName: 'Property Inspection',
    appointmentDate: '2024-01-15',
    cancelReason: 'Customer request'
  }
);
```

### 5. Service Complete Notification
```javascript
import { sendServiceCompleteNotification } from '../services/notificationService';

// Usage example
await sendServiceCompleteNotification(
  'user_fcm_token',
  {
    serviceId: '101',
    serviceName: 'Property Inspection',
    completedDate: '2024-01-15',
    rating: '4.5'
  }
);
```

### 6. System Update Notification
```javascript
import { sendSystemUpdateNotification, broadcastAppUpdate } from '../services/notificationService';

// Direct API usage
await sendSystemUpdateNotification({
  title: 'New App Update Available!',
  message: 'A new version of the Real Estate app is now available. Update to enjoy the latest features and improvements.'
});

// Convenient broadcast function
await broadcastAppUpdate('2.1.0', 'Major update with new features!');
```

**Real API Endpoint:** `POST http://abc.ridealmobility.com/application/notify-update`

## Notification Actions (Auto Navigation)

Jab user notification par tap karta hai, automatically relevant screen par navigate ho jata hai:

- **New Property** → PropertyDetailsScreen
- **Inquiry** → PropertyInquiryFormScreen  
- **Chat** → ChatDetailScreen
- **Service Cancel/Complete** → MyBookingsScreen
- **System Update** → Settings or TestFCM screen

## Testing Notifications

### Method 1: TestFCMScreen se
1. App me TestFCMScreen par jao
2. Different notification types test kar sakte ho
3. Current FCM token dekh sakte ho

### Method 2: Backend se Direct
Backend developer ye APIs call kar ke notifications send kar sakte hain:

```javascript
// Backend example for sending new property notification
POST /api/notifications/new-property
{
  "fcmToken": "user_fcm_token",
  "propertyData": {
    "propertyId": "123",
    "title": "Villa in Mumbai",
    "location": "Bandra West",
    "price": "2.5 Crore"
  }
}
```

## Implementation Status
✅ **Completed:**
- FCM service fully integrated
- 6 notification types implemented
- Auto navigation on notification tap
- Error handling and fallbacks
- Backend API integration ready

## Next Steps
1. Backend team ko ye notification service integrate karna hai
2. Test karna hai ki sab APIs properly work kar rahi hain
3. Production me deploy karne se pehle thorough testing

## API Endpoints (For Backend Team)
Notification service ye backend endpoints expect karti hai:

```
POST /api/fcm/save-token
POST /api/notifications/new-property  
POST /api/notifications/inquiry
POST /api/notifications/chat
POST /api/notifications/service-cancel
POST /api/notifications/service-complete

# REAL INTEGRATED API:
POST http://abc.ridealmobility.com/application/notify-update (✅ WORKING)
```

### Real API Response Example:
```json
{
  "success": true,
  "message": "App update notification sent to all users!",
  "sentCount": 1,
  "failedCount": 1
}
```

## Sample Payload Structure
```javascript
{
  "fcmToken": "string",
  "title": "string",
  "body": "string", 
  "data": {
    "type": "new_property|inquiry|chat|service_cancel|service_complete|system_update",
    "screen": "target_screen_name",
    // additional data based on notification type
  }
}
```

App ab fully ready hai notifications ke liye! 🚀