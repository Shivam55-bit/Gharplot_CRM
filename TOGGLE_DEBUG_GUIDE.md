# Toggle Popup Debug Guide

## What Was Fixed

The toggle button now has comprehensive logging to help debug:

1. **Toggle Action Logging** - Shows when toggle is clicked
2. **API Response Logging** - Shows what the backend returns
3. **Local State Update Logging** - Shows when UI updates
4. **Verification Logging** - Reloads data after 1 second to verify from backend

## How to Test

### Step 1: Open React Native Debugger or Console
- Open Chrome DevTools (or React Native Debugger)
- Go to Console tab
- Filter for "🔔" to see toggle-related logs

### Step 2: Toggle the Popup Access Button
1. Go to Admin → Employee Management
2. Find an employee
3. Click the "Enable Popup Access" toggle to ON
4. **Check console logs** - You should see:
   ```
   🔄 Toggle popup handler - Employee: [name] Current: false New: true
   📥 Fetching current employee data...
   📊 Fetched employee data: [full data]
   📤 Sending update payload: [data with popupEnabled: true]
   🔔 Toggle Popup Response: [success response]
   ✅ Local state updated - New popupEnabled: true
   🔍 Verifying toggle state after 1 second...
   ```

### Step 3: Logout and Login
1. Click logout
2. Login again
3. Go back to Employee Management
4. Check if toggle is still ON

### Step 4: Check Console During Reload
When you reload, check console for:
   ```
   👥 Loading employees - Response: [full response]
   👤 Processing employee: [name] - popupEnabled field: [true/false]
   ✅ Processed employees: [list with popupEnabled values]
   ```

## What to Look For

### ✅ Success Indicators
```
📥 Fetched employee data: { ..., popupEnabled: true, ... }
📊 Fetched employee data: { ..., popupEnabled: true, ... } (after reload)
✅ Verified popupEnabled: true (Expected: true)
```

### ❌ Problem Indicators
```
⚠️ WARNING: Value not persisted! Expected: true Got: false
👤 Processing employee: [name] - popupEnabled field: undefined
📥 Fetched employee data: { ..., popupEnabled: undefined, ... }
```

## Troubleshooting

### Issue: Toggle shows as OFF after reload
**Check console for:**
- Is the API response including `popupEnabled` field?
- Is it coming back as boolean or string?
- Is the field value correct immediately after update?

**Solution**: Check if backend is saving the field. Share the console output showing:
```
📤 Sending update payload: { popupEnabled: true, ... }
🔔 Toggle Popup Response: { success: true, ... }
📥 Fetched employee data: { popupEnabled: ?, ... }
```

### Issue: Console shows "undefined" for popupEnabled
**Means**: Backend is not returning the field at all

**Solution**: Backend needs to include popupEnabled in employee response

### Issue: Toggle resets immediately
**Check**: 
- Is verification reload happening? Look for `🔍 Verifying toggle state`
- Is the reloaded data showing correct value?
- Or is the local state update getting overwritten?

## Network Tab Check

1. Open DevTools → Network tab
2. Toggle the popup
3. Find the PUT request to `/admin/employees/{id}`
4. Check Request body - should have:
   ```json
   {
     "popupEnabled": true,
     "name": "...",
     "email": "...",
     ...
   }
   ```
5. Check Response - should have:
   ```json
   {
     "success": true,
     "message": "...",
     "data": { "popupEnabled": true, ... }
   }
   ```

## Next Steps

1. **Test and collect console logs**
2. **Share the console output** showing the complete flow
3. **Check Network tab** for API request/response
4. **Verify backend** is including `popupEnabled` in responses

Once we see the complete flow, we can identify exactly where the value is getting lost!

---

**File Modified**: `src/crm/services/crmEmployeeManagementApi.js` (toggleEmployeePopup function)
**File Modified**: `src/crm/crmscreens/Admin/EmployeeManagementScreen.js` (handleTogglePopup & loadEmployees)

**Date**: January 27, 2026
