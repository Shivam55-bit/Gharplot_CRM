# CRM API Integration - LocalStorage to AsyncStorage Fix

## Problem Statement
The React Native app was crashing with error: `JSON Parse error: Unexpected character: <`

**Root Cause:** 
- Backend APIs return HTML error pages (404 pages) when authentication fails
- Previous code tried to parse HTML as JSON, causing parse errors
- Used incorrect token storage keys and base URLs

## Changes Made

### 1. Updated `src/crm/services/crmAPI.js`
**Changes:**
- ✅ Added multiple token key checking (crm_auth_token, adminToken, employee_auth_token)
- ✅ Implemented safe JSON parsing with HTML detection
- ✅ Added proper error messages for different HTTP status codes
- ✅ Detects HTML responses by checking if response starts with `<`

**Key Function:**
```javascript
export const handleCRMResponse = async (response) => {
  // Get response as text first
  const textResponse = await response.text();
  
  // Check if response is HTML (error page)
  if (textResponse.trim().startsWith('<')) {
    // Handle session expiry, 404, etc.
  }
  
  // Safely parse JSON
  const data = JSON.parse(textResponse);
  return data;
};
```

### 2. Updated `src/services/apiClient.js`
**Complete rewrite from axios to fetch API:**

**Before:**
- ❌ Used axios library
- ❌ Base URL: `https://api.gharplot.com` (wrong)
- ❌ Token key: `authToken` (wrong)
- ❌ No HTML response handling

**After:**
- ✅ Uses native fetch API
- ✅ Base URL: `https://abc.bhoomitechzone.us` (correct)
- ✅ Checks multiple token keys: crm_auth_token, adminToken, employee_auth_token, authToken
- ✅ Safe JSON parsing with HTML detection
- ✅ Automatic session expiry handling
- ✅ Clears all auth tokens on 401/403 errors
- ✅ Request timeout (10 seconds)

**Key Features:**
```javascript
async handleResponse(response) {
  const textResponse = await response.text();
  
  // Detect HTML error pages
  if (textResponse.trim().startsWith('<')) {
    if (response.status === 401 || response.status === 403) {
      // Clear all tokens and throw session expired error
    }
  }
  
  // Safe JSON parsing
  const data = JSON.parse(textResponse);
  return data;
}
```

### 3. Updated `src/crm/crmscreens/Admin/UserManagementScreen.js`
**Enhanced error handling:**

**Added Session Expiry Detection:**
```javascript
catch (error) {
  // Check for session expiry
  if (error.message.includes('Session expired') || 
      error.message.includes('Please login again') ||
      error.message.includes('Invalid token')) {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please login again.',
      [{
        text: 'OK',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminLogin' }],
          });
        },
      }],
      { cancelable: false }
    );
    return;
  }
  
  // Handle 404 (API not implemented)
  if (error.message.includes('404')) {
    Alert.alert(
      'API Not Available',
      'User Management API is not yet implemented on the backend.'
    );
  }
}
```

**Applied to both:**
- ✅ `fetchUsers()` function
- ✅ `handleDeactivate()` function

## Token Storage Strategy

The app now checks multiple token keys in order of priority:

1. **crm_auth_token** - Primary CRM authentication token
2. **adminToken** - Admin-specific token
3. **employee_auth_token** - Employee authentication token
4. **authToken** - Legacy/fallback token

When any API returns 401/403, all tokens are cleared and user is redirected to login.

## Error Response Handling Flow

```
API Request
    ↓
Response received
    ↓
Convert to text
    ↓
Check if starts with '<'?
    ├─ YES → HTML Error Page
    │   ├─ 401/403 → Clear tokens → "Session expired"
    │   ├─ 404 → "API not found"
    │   └─ Other → "Invalid response"
    │
    └─ NO → Try JSON.parse()
        ├─ Success → Return data
        └─ Fail → "Invalid JSON format"
```

## Testing Checklist

### Before Testing:
1. ✅ Ensure you have valid CRM admin token in AsyncStorage
2. ✅ Check backend API is running at https://abc.bhoomitechzone.us
3. ✅ Verify User Management APIs are implemented on backend

### Test Cases:

#### 1. Valid Token Test
- [ ] Open UserManagementScreen
- [ ] Should see loading spinner
- [ ] Should fetch users successfully OR show "API not available" if 404

#### 2. Session Expiry Test
- [ ] Manually clear AsyncStorage tokens
- [ ] Open UserManagementScreen
- [ ] Should show "Session Expired" alert
- [ ] Click OK → Should redirect to AdminLogin screen

#### 3. Network Error Test
- [ ] Turn off WiFi/Mobile data
- [ ] Open UserManagementScreen
- [ ] Should show network error alert

#### 4. Activate/Deactivate Test
- [ ] Click toggle button on any user
- [ ] Confirm action
- [ ] Should show success OR session expiry if token invalid

## Files Modified

| File | Status | Purpose |
|------|--------|---------|
| `src/crm/services/crmAPI.js` | ✅ Updated | Safe JSON parsing, HTML detection |
| `src/services/apiClient.js` | ✅ Rewritten | fetch API, correct base URL, multi-token support |
| `src/crm/crmscreens/Admin/UserManagementScreen.js` | ✅ Updated | Session expiry handling, better error messages |

## Known Issues & Limitations

1. **Backend APIs Not Implemented**: If User Management APIs return 404, app will show "API Not Available" message. This is expected until backend team implements the endpoints.

2. **Multiple Token Keys**: App checks multiple token keys for backward compatibility. Once authentication is standardized, this can be simplified to single key.

3. **No Refresh Token**: Current implementation doesn't support refresh tokens. When session expires, user must login again.

## Next Steps

1. **Test with Real Backend**: Once User Management APIs are implemented on backend, test all CRUD operations
2. **Update Other Screens**: Apply same error handling pattern to all other CRM screens
3. **Standardize Token Keys**: Decide on single token key (recommend `crm_auth_token`) and update all authentication flows
4. **Add Token Refresh**: Implement automatic token refresh before expiry

## Migration Notes for Other Developers

If you're working on other CRM screens, follow this pattern:

```javascript
import { getAllXXX } from '@/crm/services/crmXXXApi';

const fetchData = async () => {
  try {
    const data = await getAllXXX();
    // Handle success
  } catch (error) {
    // Check for session expiry
    if (error.message.includes('Session expired')) {
      Alert.alert('Session Expired', 'Please login again', [{
        text: 'OK',
        onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: 'AdminLogin' }],
        }),
      }]);
      return;
    }
    
    // Handle other errors
    Alert.alert('Error', error.message);
  }
};
```

## Support

If you encounter issues:
1. Check console logs - all API calls are logged with emojis (🔐, 📥, ❌, ✅)
2. Verify token exists in AsyncStorage
3. Check backend API is running
4. Verify API endpoints are implemented on backend

---

**Status:** ✅ All fixes completed and ready for testing
**Date:** $(Get-Date -Format "yyyy-MM-dd")
**Developer:** GitHub Copilot (Claude Sonnet 4.5)
