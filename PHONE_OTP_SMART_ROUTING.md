# Phone OTP with Smart Routing (Registered vs New User)

## Overview
This feature allows any phone number to receive OTP. After OTP verification, the backend determines if the user is registered or new, and the app routes accordingly:
- **Registered User** → Home Screen (with login)
- **New User** → Signup Screen (with phone pre-filled)

## Flow Diagram
```
User enters phone → Send OTP → User enters OTP
                                      ↓
                            Backend verifies OTP
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            User Registered?                    User NOT Registered?
            (has account)                       (new user)
                    ↓                                   ↓
            Return token + user                 Return success (no token)
                    ↓                                   ↓
            Save token                          Navigate to SignupScreen
            Navigate to Home                    (phone pre-filled)
```

## Backend Implementation Required

### 1. Send OTP Endpoint - MUST SEND TO ANY NUMBER

**Endpoint:** `POST /auth/send-phone-otp`

**⚠️ CRITICAL REQUIREMENT:** This endpoint MUST send OTP to ANY phone number - regardless of whether it's registered or not. Do NOT check registration status here.

**Why?** Registration status is checked AFTER OTP verification, not before. This provides better UX and allows both login and signup through the same flow.

**Behavior:** 
- Accept any valid phone number
- Generate OTP (4 digits)
- Send OTP via SMS
- Store OTP temporarily (cache/database with expiry)
- Return success response
- **NO registration check at this stage**

**Request:**
```json
{
  "phone": "9876543210"
}
```

**Response (Always same for any number):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Backend Pseudo-code:**
```javascript
async function sendPhoneOtp(req, res) {
  const { phone } = req.body;
  
  // Validate phone format
  if (!isValidPhone(phone)) {
    return res.json({
      success: false,
      message: "Invalid phone number format"
    });
  }
  
  // Generate OTP (4 digits)
  const otp = generateOTP(); // e.g., "1234"
  
  // Store OTP temporarily (5 min expiry)
  await storeOTP(phone, otp, 300); // 300 seconds = 5 minutes
  
  // Send SMS
  await sendSMS(phone, `Your OTP is: ${otp}`);
  
  // ⚠️ DO NOT CHECK if user exists here
  // Return success for ANY valid phone number
  return res.json({
    success: true,
    message: "OTP sent successfully"
  });
}
```

### 2. Verify OTP Endpoint (CRITICAL - Updated Logic)

**Endpoint:** `POST /auth/verify-phone-otp`

**Behavior:** 
- Verify the OTP
- Check if phone number is registered in database
- Return different responses based on registration status

**Request:**
```json
{
  "phone": "9876543210",
  "otp": "1234"
}
```

#### Response Case 1: Registered User (Existing Account)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "name": "John Doe",
    "email": "john@example.com",
    "isPhoneVerified": true
  }
}
```

**Frontend Action:** 
- Save token and userId to AsyncStorage
- Send FCM token to backend
- Navigate to Home Screen

#### Response Case 2: New User (Not Registered)
```json
{
  "success": true,
  "message": "OTP verified. Please complete your profile.",
  "isNewUser": true
  // NO token or user object
}
```

**Frontend Action:**
- Navigate to SignupScreen with phone number pre-filled
- User completes profile
- Backend creates account

#### Response Case 3: Invalid OTP
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

**Frontend Action:**
- Show error toast
- Stay on OTP screen

## Backend Logic Implementation

```javascript
// Pseudo-code for verify-phone-otp endpoint
async function verifyPhoneOtp(req, res) {
  const { phone, otp } = req.body;
  
  // 1. Verify OTP from cache/database
  const isValidOtp = await verifyOtpFromCache(phone, otp);
  
  if (!isValidOtp) {
    return res.json({
      success: false,
      message: "Invalid OTP. Please try again."
    });
  }
  
  // 2. Check if user exists in database
  const user = await User.findOne({ phone });
  
  if (user) {
    // User is REGISTERED - Return token
    const token = generateJWT(user._id);
    
    return res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isPhoneVerified: true
      }
    });
  } else {
    // User is NEW - Return success without token
    return res.json({
      success: true,
      message: "OTP verified. Please complete your profile.",
      isNewUser: true
    });
  }
}
```

## Frontend Flow

### LoginScreen
```javascript
// User enters phone and clicks "Send OTP"
const handleLogin = async () => {
  if (loginMode === "phone") {
    // Always allow OTP send
    showToast("OTP sent successfully! ✅", "success");
    navigation.navigate("OtpScreen", { phone: phone.trim() });
  }
};
```

### OtpScreen (Smart Routing)
```javascript
const verifyOtp = async () => {
  const response = await authApi.verifyPhoneOtp(phone, otp);
  
  if (response.success) {
    // Check if user is registered
    if (response.token && response.user) {
      // REGISTERED USER
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userId', response.user._id);
      // Send FCM token
      await sendFCMTokenToBackend(response.user._id, fcmToken);
      // Navigate to Home
      navigation.reset({ routes: [{ name: 'Home' }] });
    } else {
      // NEW USER
      // Navigate to Signup with phone pre-filled
      navigation.replace('SignupScreen', { phoneNumber: phone });
    }
  }
};
```

### SignupScreen
```javascript
const SignupScreen = ({ route }) => {
  const phoneNumber = route?.params?.phoneNumber || "";
  
  const [form, setForm] = useState({
    phone: phoneNumber, // Pre-filled from OTP
    fullName: "",
    email: "",
    address: "",
    password: ""
  });
  
  // Phone field is disabled (already verified via OTP)
};
```

## Testing Guide

### Test Case 1: Registered User Login
```bash
# 1. Send OTP to registered number
curl -X POST http://localhost:5000/auth/send-phone-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Response: {"success": true, "message": "OTP sent successfully"}

# 2. Verify OTP
curl -X POST http://localhost:5000/auth/verify-phone-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "1234"}'

# Expected Response:
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "phone": "9876543210",
    "name": "John Doe",
    "email": "john@example.com"
  }
}

# Frontend: Saves token → Navigates to Home
```

### Test Case 2: New User Signup Flow
```bash
# 1. Send OTP to NEW number
curl -X POST http://localhost:5000/auth/send-phone-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'

# Response: {"success": true, "message": "OTP sent successfully"}

# 2. Verify OTP
curl -X POST http://localhost:5000/auth/verify-phone-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "otp": "1234"}'

# Expected Response:
{
  "success": true,
  "message": "OTP verified. Please complete your profile.",
  "isNewUser": true
}

# Frontend: Navigates to SignupScreen with phone "1234567890" pre-filled
```

### Test Case 3: Invalid OTP
```bash
curl -X POST http://localhost:5000/auth/verify-phone-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "9999"}'

# Expected Response:
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}

# Frontend: Shows error toast, stays on OTP screen
```

## User Experience Flow

### Scenario 1: Existing User
```
1. User enters phone: 9876543210
2. Clicks "Send OTP" → Toast: "OTP sent successfully! ✅"
3. Enters OTP: 1234
4. Clicks "Verify OTP" → Toast: "Login successful! Welcome! 🎉"
5. Automatically navigates to Home Screen
6. User is logged in
```

### Scenario 2: New User
```
1. User enters phone: 1234567890
2. Clicks "Send OTP" → Toast: "OTP sent successfully! ✅"
3. Enters OTP: 1234
4. Clicks "Verify OTP" → Toast: "OTP verified! Complete your profile 📝"
5. Automatically navigates to SignupScreen
6. Phone field shows: 1234567890 ✅ (disabled, green)
7. User fills: Name, Email, Address, Password
8. Clicks "Sign Up"
9. Account created → Navigates to Home Screen
```

## Key Features

✅ **Single OTP for all** - Both registered and new users get OTP  
✅ **Smart routing** - Backend decides navigation based on registration status  
✅ **No duplicate checks** - Phone verified once via OTP, no need to re-verify  
✅ **Seamless UX** - User doesn't know if they're "signing up" or "logging in"  
✅ **Secure** - OTP verification ensures phone ownership  
✅ **Pre-filled phone** - SignupScreen gets verified phone number  

## Benefits

1. **Unified Experience**: Same flow for new and existing users
2. **Reduced Friction**: No "Are you registered?" checks upfront
3. **Better Conversion**: New users don't abandon due to confusion
4. **Secure**: Phone verification via OTP before any action
5. **Flexible**: Easy to add more checks (email verification, etc.)

## Error Handling

| Scenario | Response | Frontend Action |
|----------|----------|-----------------|
| OTP expired | `{success: false, message: "OTP expired"}` | Show error, allow resend |
| Invalid OTP | `{success: false, message: "Invalid OTP"}` | Show error, stay on screen |
| Network error | Exception thrown | Show generic error |
| Server error | `{success: false, message: "Server error"}` | Show error, retry option |

## Database Schema

### User Model
```javascript
{
  phone: { type: String, required: true, unique: true },
  isPhoneVerified: { type: Boolean, default: false },
  name: { type: String, required: false },
  email: { type: String, required: false },
  password: { type: String, required: false },
  address: { type: String, required: false },
  createdVia: { type: String, enum: ['email', 'phone-otp'], default: 'phone-otp' },
  createdAt: { type: Date, default: Date.now }
}
```

## Notes

- Frontend handles routing logic based on presence of `token` in response
- If `response.token` exists → User is registered → Login flow
- If `response.token` is absent → User is new → Signup flow
- Phone number is verified via OTP, so no need for email verification initially
- FCM token is saved after successful login (registered users only)
