# Quick Testing Guide - CRM API Fix

## What Was Fixed?
The app was crashing with `JSON Parse error: Unexpected character: <` because:
1. API returned HTML error pages instead of JSON when auth failed
2. Code tried to parse HTML as JSON → crash
3. Used wrong base URL and token keys

## Changes Summary
✅ **crmAPI.js** - Safe JSON parsing with HTML detection  
✅ **apiClient.js** - Rewritten to use fetch, correct base URL, multi-token support  
✅ **UserManagementScreen.js** - Session expiry handling with login redirect

## How to Test

### Step 1: Check Current Token
Open React Native Debugger console and run:
```javascript
AsyncStorage.getItem('crm_auth_token').then(token => console.log('Token:', token));
```

### Step 2: Test User Management Screen
1. Navigate to Management → Users
2. **Expected Results:**
   - **With valid token**: Loading → List of users OR "API Not Available" if backend not ready
   - **With invalid/no token**: "Session Expired" alert → Redirected to AdminLogin
   - **Network error**: "Network error" alert

### Step 3: Test Activate/Deactivate
1. Click toggle button on any user
2. Confirm action
3. **Expected Results:**
   - **Success**: "User activated/deactivated successfully"
   - **Session expired**: "Session Expired" alert → Login redirect
   - **Error**: Specific error message

## Console Logs to Watch For

```
🔐 Token found, length: 123          ← Token retrieved successfully
❌ No authentication token found     ← No token in AsyncStorage
🔄 Fetching users - Page: 1         ← API call started
📥 Response Status: 200              ← API success
❌ Received HTML instead of JSON     ← Got error page
✅ API Response: {...}               ← Success with data
```

## Common Scenarios

| Scenario | What Happens | Action Required |
|----------|--------------|-----------------|
| **First time user** | No token → Session expired → Login | Login with admin credentials |
| **Valid token + API not ready** | 404 → "API Not Available" alert | Wait for backend team |
| **Valid token + API ready** | 200 → Users list shown | None - working correctly |
| **Expired token** | 401 → "Session Expired" → Login | Login again |
| **Network offline** | Network error alert | Check internet connection |

## Troubleshooting

### Problem: "Session Expired" immediately after login
**Solution:** Check if login screen is saving token with correct key:
```javascript
// Should be one of these:
await AsyncStorage.setItem('crm_auth_token', token);
await AsyncStorage.setItem('adminToken', token);
```

### Problem: "API Not Available" error
**Solution:** Backend APIs not implemented yet. Check with backend team.

### Problem: Still getting JSON parse error
**Solution:** Clear cache and restart:
```bash
cd "c:\Users\shiva\React Native\Guru ji\Gharplot"
npx react-native start --reset-cache
```

### Problem: Network timeout
**Solution:** Check if backend URL is accessible:
```bash
curl https://abc.bhoomitechzone.us/health
```

## Testing Endpoints Directly

You can test API endpoints using curl (with valid token):

```bash
# Get all users
curl -X GET "https://abc.bhoomitechzone.us/admin/getAllUsers?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Activate user
curl -X PUT "https://abc.bhoomitechzone.us/admin/activateUser/USER_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## Expected API Responses

### Success (200):
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 23
  }
}
```

### Session Expired (401):
```html
<!DOCTYPE html>
<html>
  <head><title>401 Unauthorized</title></head>
  <body>...</body>
</html>
```
**App behavior:** Detects `<` → Shows "Session Expired" → Redirects to login

### API Not Found (404):
```html
<!DOCTYPE html>
<html>
  <head><title>404 Not Found</title></head>
  <body>...</body>
</html>
```
**App behavior:** Detects `<` → Shows "API Not Available"

## Next Steps After Testing

1. ✅ If working correctly → Apply same pattern to other CRM screens
2. ⚠️ If getting 404 → Contact backend team about API implementation
3. ❌ If still crashing → Check console logs and share error details

---

**Quick Reference:**
- Base URL: `https://abc.bhoomitechzone.us`
- Token Keys: `crm_auth_token`, `adminToken`, `employee_auth_token`
- Login Screen: `AdminLogin` (for navigation redirect)
- Full Documentation: See `CRM_API_FIX_COMPLETE.md`
