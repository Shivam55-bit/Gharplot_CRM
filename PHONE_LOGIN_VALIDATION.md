# Phone Login Validation Implementation Guide

## Overview
This document describes the phone number validation flow that checks if a user account exists before sending OTP during login.

## Flow Diagram
```
User enters phone number → Click "Send OTP"
    ↓
Check if phone exists (POST /auth/check-phone-exists)
    ↓
    ├─ Account exists → Send OTP → Navigate to OTP screen
    │
    └─ Account NOT exists → Show alert "Create account first" with Sign Up button
```

## Frontend Changes (Already Implemented)

### 1. New API Function in `authApi.js`
```javascript
/**
 * Check if phone number has an account
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} The API response with exists flag.
 */
export async function checkPhoneExists(phone) {
    try {
        const response = await post(CHECK_PHONE_EXISTS_ENDPOINT, { phone });
        console.log('Phone check response:', response);
        return response;
    } catch (error) {
        console.error("Check Phone Exists Error:", error.message);
        throw error;
    }
}
```

### 2. Updated Login Flow in `LoginScreen.js`
```javascript
if (loginMode === "phone") {
    // First check if phone number has an account
    try {
        const checkRes = await authApi.checkPhoneExists(phone.trim());
        
        if (!checkRes.exists) {
            // Show alert: Account not found
            Alert.alert(
                'Account Not Found',
                'No account exists with this phone number. Please create an account first.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Up', onPress: () => navigation.navigate('SignupScreen') }
                ]
            );
            return;
        }
    } catch (checkError) {
        // If check fails, continue with OTP (fallback behavior)
    }
    
    // If account exists, send OTP
    const res = await authApi.sendPhoneOtp(phone.trim());
    // ... rest of the code
}
```

## Backend Implementation Required

### New Endpoint: Check Phone Exists

**Endpoint:** `POST /auth/check-phone-exists`

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Response (Account Exists):**
```json
{
  "success": true,
  "exists": true,
  "message": "Phone number is registered"
}
```

**Response (Account Not Exists):**
```json
{
  "success": true,
  "exists": false,
  "message": "Phone number not found"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid phone number format",
  "error": "Validation error"
}
```

### Backend Code Example (Node.js/Express)

#### Route Definition
```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/check-phone-exists', authController.checkPhoneExists);

module.exports = router;
```

#### Controller Implementation
```javascript
// controllers/authController.js

/**
 * Check if a phone number has an associated account
 * @route POST /auth/check-phone-exists
 */
exports.checkPhoneExists = async (req, res) => {
    try {
        const { phone } = req.body;

        // Validation
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
                error: 'Validation error'
            });
        }

        // Validate phone format (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.toString().trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Must be 10 digits.',
                error: 'Validation error'
            });
        }

        // Check if user exists in database
        const user = await User.findOne({ phone: phone.trim() });

        if (user) {
            // Account exists
            return res.status(200).json({
                success: true,
                exists: true,
                message: 'Phone number is registered'
            });
        } else {
            // Account doesn't exist
            return res.status(200).json({
                success: true,
                exists: false,
                message: 'Phone number not found'
            });
        }

    } catch (error) {
        console.error('Check phone exists error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while checking phone number',
            error: error.message
        });
    }
};
```

#### Database Model Reference
```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        unique: true,
        sparse: true,  // Allow null but enforce uniqueness when present
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    // ... other fields
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

## Testing Instructions

### Test Case 1: Existing Account
1. Use phone number that has an account (e.g., registered user)
2. Enter phone in login screen
3. Click "Send OTP"
4. **Expected:** OTP should be sent, navigate to OTP screen
5. **Console:** Should show "Phone number is registered"

### Test Case 2: Non-Existing Account
1. Use phone number that doesn't have an account (e.g., 1234567890)
2. Enter phone in login screen
3. Click "Send OTP"
4. **Expected:** Alert dialog shows "Account Not Found" with Sign Up button
5. **Console:** Should show "Phone number not found"
6. Click "Sign Up" button → Should navigate to SignupScreen

### Test Case 3: Invalid Phone Number
1. Enter invalid phone (e.g., "123" or "abcd")
2. Click "Send OTP"
3. **Expected:** Frontend validation prevents submission OR backend returns error
4. **Console:** Should show validation error

### Test Case 4: Network Error/Backend Down
1. Stop backend server
2. Enter phone number
3. Click "Send OTP"
4. **Expected:** Frontend falls back to sending OTP (graceful degradation)
5. **Console:** Should show "Phone check error" but continue with OTP flow

## Postman Testing

### Request
```
POST http://localhost:5000/auth/check-phone-exists
Content-Type: application/json

{
  "phone": "9876543210"
}
```

### Expected Response (Exists)
```json
{
  "success": true,
  "exists": true,
  "message": "Phone number is registered"
}
```

### Expected Response (Not Exists)
```json
{
  "success": true,
  "exists": false,
  "message": "Phone number not found"
}
```

## Security Considerations

1. **Rate Limiting:** Add rate limiting to prevent abuse (max 5 checks per minute per IP)
2. **Phone Privacy:** Don't expose user details in response, only existence flag
3. **Logging:** Log suspicious patterns (multiple checks for different numbers)
4. **Input Sanitization:** Always trim and validate phone format
5. **No Password/OTP:** This endpoint should NOT return any sensitive data

## Frontend Fallback Behavior

If the backend endpoint is not available or returns an error, the frontend will:
1. Log the error to console
2. Continue with OTP sending (original behavior)
3. Let backend handle validation during OTP send

This ensures the app doesn't break if the new endpoint isn't ready yet.

## Implementation Checklist

### Backend Tasks
- [ ] Create `/auth/check-phone-exists` endpoint
- [ ] Add phone validation logic
- [ ] Query database for user by phone
- [ ] Return appropriate JSON response
- [ ] Add rate limiting middleware
- [ ] Test with Postman/curl
- [ ] Deploy to production server

### Frontend Tasks (Already Done ✅)
- [x] Add `checkPhoneExists()` function to authApi.js
- [x] Update LoginScreen to check phone before OTP
- [x] Show alert dialog for non-existing accounts
- [x] Add Sign Up button in alert
- [x] Implement fallback behavior for errors

## Related Files
- Frontend: `src/services/authApi.js`
- Frontend: `src/screens/LoginScreen.js`
- Backend: `routes/auth.js` (to be created)
- Backend: `controllers/authController.js` (to be updated)
- Backend: `models/User.js` (existing)

## Support
For any issues or questions, contact the development team.
