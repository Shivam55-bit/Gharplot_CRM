/**
 * Test Script for Real API Integration
 * This script tests the integrated real API endpoints for OTP authentication
 * Run with: node test-real-apis.js
 */

import { sendPhoneOtp, verifyPhoneOtp, completeRegistration } from './src/services/authApi.js';

// Test phone number (replace with your test number)
const TEST_PHONE = '+919876543210';

async function testOTPFlow() {
    console.log('🧪 Testing Real API Integration...\n');
    
    try {
        // Step 1: Send Phone OTP
        console.log('📱 Step 1: Sending OTP to', TEST_PHONE);
        const sendResult = await sendPhoneOtp(TEST_PHONE);
        console.log('Send OTP Result:', JSON.stringify(sendResult, null, 2));
        
        if (!sendResult.success) {
            console.error('❌ Failed to send OTP');
            return;
        }
        
        console.log('✅ OTP sent successfully!\n');
        
        // Step 2: Verify OTP (You'll need to manually enter the OTP received)
        console.log('📨 Step 2: Check your phone for OTP and update this script');
        console.log('💡 Replace TEST_OTP with the actual OTP received');
        
        const TEST_OTP = '000000'; // Replace with actual OTP
        
        if (TEST_OTP === '000000') {
            console.log('⚠️ Please update TEST_OTP with the real OTP before running verify step');
            return;
        }
        
        const verifyResult = await verifyPhoneOtp(TEST_PHONE, TEST_OTP);
        console.log('Verify OTP Result:', JSON.stringify(verifyResult, null, 2));
        
        if (!verifyResult.success) {
            console.error('❌ Failed to verify OTP');
            return;
        }
        
        console.log('✅ OTP verified successfully!\n');
        
        // Step 3: Complete Registration (if new user)
        if (verifyResult.isNewUser) {
            console.log('👤 Step 3: Completing registration for new user');
            
            const userData = {
                fullName: 'Test User',
                email: 'test@example.com',
                phone: TEST_PHONE,
                dob: '1990-01-01'
            };
            
            const registerResult = await completeRegistration(userData);
            console.log('Registration Result:', JSON.stringify(registerResult, null, 2));
            
            if (registerResult.success) {
                console.log('✅ Registration completed successfully!');
            } else {
                console.error('❌ Registration failed');
            }
        } else {
            console.log('✅ User already registered, login successful!');
        }
        
    } catch (error) {
        console.error('🚨 Test failed:', error.message);
    }
}

// Instructions for manual testing
console.log(`
🔧 Manual Testing Instructions:

1. Update TEST_PHONE with a real phone number
2. Run: node test-real-apis.js
3. Check your phone for OTP
4. Update TEST_OTP in this file with the received OTP
5. Run the script again to test verification

📝 Your working endpoints:
- Send OTP: https://abc.ridealmobility.com/auth/send-phone-otp
- Verify OTP: https://abc.ridealmobility.com/auth/verify-phone-otp  
- Registration: https://abc.ridealmobility.com/auth/complete-registration

✨ Development mode removed - now using real APIs!
`);

// testOTPFlow();