# Gharplot App - Authentication API Endpoints

## Base URL
```
https://abc.ridealmobility.com
```

## Authentication Endpoints

### 1. **User Signup**
- **Endpoint**: `/auth/signup`
- **Full URL**: `https://abc.ridealmobility.com/auth/signup`
- **Method**: `POST`
- **Function**: `signup(userData)`
- **Payload**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```
- **Response**: Account creation confirmation (requires manual login)

### 2. **User Login (Email/Password)**
- **Endpoint**: `/auth/login`
- **Full URL**: `https://abc.ridealmobility.com/auth/login`
- **Method**: `POST`
- **Function**: `login(email, password)`
- **Payload**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**: JWT token + user details

### 3. **Send Email OTP**
- **Endpoint**: `/auth/send-email-otp`
- **Full URL**: `https://abc.ridealmobility.com/auth/send-email-otp`
- **Method**: `POST`
- **Function**: `sendEmailOtp(email)`
- **Payload**:
```json
{
  "email": "user@example.com"
}
```
- **Response**: OTP sent confirmation

### 4. **Verify Email OTP**
- **Endpoint**: `/auth/verify-email-otp`
- **Full URL**: `https://abc.ridealmobility.com/auth/verify-email-otp`
- **Method**: `POST`
- **Function**: `verifyEmailOtp(email, otp)`
- **Payload**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Response**: OTP verification result

### 5. **Send Phone OTP**
- **Endpoint**: `/auth/send-phone-otp`
- **Full URL**: `https://abc.ridealmobility.com/auth/send-phone-otp`
- **Method**: `POST`
- **Function**: `sendPhoneOtp(phone)`
- **Payload**:
```json
{
  "phone": "+91XXXXXXXXXX"
}
```
- **Response**: OTP sent to phone confirmation

### 6. **Verify Phone OTP**
- **Endpoint**: `/auth/verify-phone-otp`
- **Full URL**: `https://abc.ridealmobility.com/auth/verify-phone-otp`
- **Method**: `POST`
- **Function**: `verifyPhoneOtp(phone, otp)`
- **Payload**:
```json
{
  "phone": "+91XXXXXXXXXX",
  "otp": "123456"
}
```
- **Response**: 
  - If existing user: JWT token + user details
  - If new user: Success flag (requires registration)

### 7. **Complete Registration (New Users)**
- **Endpoint**: `/auth/complete-registration`
- **Full URL**: `https://abc.ridealmobility.com/auth/complete-registration`
- **Method**: `POST`
- **Function**: `completeRegistration(userData)`
- **Payload**:
```json
{
  "fullName": "User Full Name",
  "email": "user@example.com",
  "phone": "+91XXXXXXXXXX",
  "dob": "YYYY-MM-DD"
}
```
- **Response**: JWT token + user details

### 8. **User Logout**
- **Endpoint**: `/auth/logout`
- **Full URL**: `https://abc.ridealmobility.com/auth/logout`
- **Method**: `POST`
- **Function**: `logout()`
- **Payload**: `{}` (empty - token from AsyncStorage)
- **Response**: Logout confirmation

## Additional Services

### 9. **Save FCM Token (Push Notifications)**
- **Endpoint**: `/api/save-token`
- **Full URL**: `https://abc.ridealmobility.com/api/save-token`
- **Method**: `POST`
- **Function**: `sendFCMTokenToBackend(userId, fcmToken)`
- **Payload**:
```json
{
  "userId": "user_id",
  "fcmToken": "firebase_token"
}
```
- **Response**: Token save confirmation

### 10. **Token Refresh**
- **Endpoint**: `/auth/refresh-token`
- **Full URL**: `https://abc.ridealmobility.com/auth/refresh-token`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {refresh_token}`
- **Response**: New JWT token

## Usage Examples

### Import Functions
```javascript
import { 
  signup, 
  login, 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  completeRegistration,
  sendEmailOtp,
  verifyEmailOtp,
  logout 
} from '../services/authApi';
```

### Phone OTP Login Flow
```javascript
// 1. Send OTP
const otpResponse = await sendPhoneOtp("+91XXXXXXXXXX");

// 2. Verify OTP
const verifyResponse = await verifyPhoneOtp("+91XXXXXXXXXX", "123456");

// 3. Handle response
if (verifyResponse.success) {
  if (verifyResponse.isNewUser) {
    // New user - complete registration
    const userData = {
      fullName: "User Name",
      email: "user@email.com",
      phone: "+91XXXXXXXXXX",
      dob: "1990-01-01"
    };
    await completeRegistration(userData);
  } else {
    // Existing user - already logged in with token
    console.log("User logged in successfully");
  }
}
```

### Email/Password Login Flow
```javascript
// Direct login
const loginResponse = await login("user@email.com", "password123");
console.log("Token:", loginResponse.token);
console.log("User ID:", loginResponse.userId);
```

## Authentication Headers
All authenticated API calls automatically include:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

The JWT token is automatically retrieved from AsyncStorage and included in requests.