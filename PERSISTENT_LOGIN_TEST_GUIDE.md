/**
 * HOW TO TEST PERSISTENT LOGIN FUNCTIONALITY
 * ==========================================
 * 
 * CORRECT FLOW:
 * 
 * 1. LOGIN TEST:
 *    - Open app → Login with phone + OTP → Go to Home
 *    - Close app completely (kill from background)
 *    - Reopen app → SplashScreen → Should go directly to Home (NO LOGIN REQUIRED)
 * 
 * 2. LOGOUT TEST:
 *    - From Home screen → Go to Settings → Logout
 *    - App should go to LoginScreen
 *    - Close app completely (kill from background)
 *    - Reopen app → SplashScreen → Should go to LoginScreen (LOGIN REQUIRED)
 * 
 * WHAT'S HAPPENING NOW:
 * - When you logout, credentials are cleared from storage
 * - So when you reopen app, it correctly shows LoginScreen
 * - This is the EXPECTED behavior after logout
 * 
 * TO TEST PERSISTENT LOGIN:
 * - Login successfully
 * - DON'T logout
 * - Close app and reopen
 * - Should go directly to Home
 */