# ⚠️ Backend API Implementation Required

## 🔴 Current Status: 404 Error Fixed (Mock Mode)

The app is now running in **mock mode** for service bookings because the backend endpoint is missing.

---

## 📋 Required Backend Endpoint

### **Endpoint Details:**
- **Method:** `POST`
- **URL:** `https://abc.ridealmobility.com/api/services/request`
- **Auth:** Bearer Token (from AsyncStorage)

### **Request Payload Example:**

```json
{
  "serviceId": "67890",
  "serviceName": "House Cleaning",
  "propertyType": "apartment",
  "place": "Apartment",
  "address": "123 Main Street, Building A",
  "city": "Delhi",
  "pincode": "110001",
  "landmark": "Near Metro Station",
  "fullName": "Raj Kumar",
  "phone": "9876543210",
  "alternatePhone": "9876543211",
  "email": "raj@email.com",
  "alternateEmail": "raj2@email.com",
  "propertySize": "2 BHK",
  "preferredDate": "Nov 15, 2025",
  "preferredTime": "Morning (8AM-12PM)",
  "specialInstructions": "Please use eco-friendly products",
  "estimatedCost": 5000,
  "requestedAt": "2025-11-04T10:30:00.000Z",
  "payment": {
    "method": "cod",  // or "upi" or "card"
    "amount": 5000
  },
  "orderId": "order_xyz123",
  "razorpayKey": "rzp_test_key"
}
```

---

## ✅ Expected Response Format

### **Success Response:**

```json
{
  "success": true,
  "status": "success",
  "message": "Booking confirmed successfully",
  "data": {
    "bookingId": "BK1234567890",
    "serviceId": "67890",
    "serviceName": "House Cleaning",
    "customerName": "Raj Kumar",
    "scheduledDate": "Nov 15, 2025",
    "scheduledTime": "Morning (8AM-12PM)",
    "amount": 5000,
    "paymentMethod": "cod",
    "status": "confirmed",
    "createdAt": "2025-11-04T10:30:00.000Z"
  }
}
```

### **Error Response:**

```json
{
  "success": false,
  "status": "error",
  "message": "Booking failed",
  "error": "Detailed error message"
}
```

---

## 📧 Backend Should Send 2 Emails

After successful booking, backend must send:

### 1. **Admin Email**
- To: `admin@yourcompany.com`
- Subject: `🔔 New Service Booking - [Service Name]`
- Content: All booking details + payment method

### 2. **Customer Email**
- To: Customer's email
- Subject: `✅ Booking Confirmed - [Service Name]`
- Content: Booking confirmation with booking ID

**📄 Complete email templates are available in:** `BACKEND_EMAIL_IMPLEMENTATION.md`

---

## 🔧 Current App Behavior

### **While Backend is Missing (Mock Mode):**

✅ **Working:**
- Service selection
- Property type selection
- Form validation
- Payment method selection (UPI/Card/COD)
- Success modal display
- All booking data logged in console

⚠️ **Mock Response:**
- Booking shows success with warning
- Data logged in console (check Metro logs)
- No actual database save
- No emails sent

### **Console Output in Mock Mode:**

```
[paymentapi] submitServiceRequest payload: {...}
[paymentapi] Backend endpoint not ready. Using mock success response.
[paymentapi] ⚠️ IMPORTANT: Implement backend endpoint /api/services/request
[paymentapi] Booking data that should be saved: {...}
[ServicesScreen] ⚠️ Mock Response: Backend endpoint /api/services/request not implemented yet
[ServicesScreen] 📝 Booking data saved locally (needs backend): {...}
```

---

## 🚀 How to Implement Backend

### **Step 1: Create Route**

```javascript
// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();

router.post('/api/services/request', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Generate booking ID
        const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Save to database
        const booking = await BookingModel.create({
            bookingId,
            ...bookingData
        });
        
        // Send emails (see BACKEND_EMAIL_IMPLEMENTATION.md)
        await sendAdminNotification(bookingData);
        await sendCustomerConfirmation(bookingData);
        
        // Return success
        res.json({
            success: true,
            status: 'success',
            message: 'Booking confirmed successfully',
            data: {
                bookingId,
                ...booking
            }
        });
    } catch (error) {
        console.error('Booking failed:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Failed to process booking',
            error: error.message
        });
    }
});

module.exports = router;
```

### **Step 2: Add to Express App**

```javascript
// app.js or server.js
const serviceRoutes = require('./routes/serviceRoutes');
app.use(serviceRoutes);
```

### **Step 3: Create Database Model**

```javascript
// models/Booking.js
const BookingSchema = new mongoose.Schema({
    bookingId: { type: String, required: true, unique: true },
    serviceId: String,
    serviceName: String,
    customerName: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    pincode: String,
    propertyType: String,
    propertySize: String,
    scheduledDate: String,
    scheduledTime: String,
    estimatedCost: Number,
    paymentMethod: String,
    paymentStatus: { type: String, default: 'pending' },
    status: { type: String, default: 'confirmed' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
```

---

## 🧪 Testing

### **Test with Postman:**

```bash
POST https://abc.ridealmobility.com/api/services/request
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN

Body: (Use example payload from above)
```

### **Test from App:**

1. Select a service
2. Choose property type
3. Fill form
4. Select payment method (COD recommended for testing)
5. Confirm booking
6. Check console logs
7. Verify backend receives data

---

## 📝 Database Schema Recommendation

```sql
CREATE TABLE service_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    service_id VARCHAR(50),
    service_name VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    alternate_phone VARCHAR(15),
    email VARCHAR(255) NOT NULL,
    alternate_email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark VARCHAR(255),
    property_type VARCHAR(50) NOT NULL,
    property_size VARCHAR(50) NOT NULL,
    scheduled_date VARCHAR(50) NOT NULL,
    scheduled_time VARCHAR(50) NOT NULL,
    special_instructions TEXT,
    estimated_cost DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    order_id VARCHAR(100),
    razorpay_key VARCHAR(100),
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## ⚡ Quick Fix Applied

**File Modified:** `src/services/paymentapi.js`

**What it does:**
- Catches 404 error from missing endpoint
- Returns mock success response
- Logs all booking data to console
- Shows warning in development mode
- App continues to work for UI testing

**When to Remove:**
Once backend endpoint is implemented and tested, you can remove the mock response handling.

---

## 📞 Support

If you need help implementing the backend:
1. Check `BACKEND_EMAIL_IMPLEMENTATION.md` for complete email code
2. Use the request/response examples above
3. Test with Postman first
4. Then test from app

---

## ✅ Checklist

- [ ] Create `/api/services/request` endpoint
- [ ] Add authentication middleware
- [ ] Create database model/table
- [ ] Implement save booking logic
- [ ] Add email service (see BACKEND_EMAIL_IMPLEMENTATION.md)
- [ ] Send admin email on booking
- [ ] Send customer confirmation email
- [ ] Test with Postman
- [ ] Test from React Native app
- [ ] Remove mock mode from paymentapi.js (optional)
- [ ] Deploy to production

---

*Last Updated: November 4, 2025*
