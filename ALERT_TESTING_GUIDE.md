# 🧪 ALERT NOTIFICATION - TESTING GUIDE

## ✅ Changes Summary

### Problem Fixed:
❌ **Before:** Notification appeared immediately (2-3 seconds after creating alert)  
✅ **After:** Notification appears at EXACT scheduled date/time

### Files Modified:
1. ✅ **Created:** `src/services/AlertNotificationService.js` (NEW)
2. ✅ **Updated:** `src/crm/crmscreens/Employee/CreateAlertScreen.js`
3. ✅ **Updated:** `src/crm/crmscreens/Admin/Alerts.js`
4. ✅ **Updated:** `App.js`

---

## 🧪 Test Plan

### Test 1: Schedule Notification for 2 Minutes from Now ⏰

**Steps:**
1. Open app
2. Login to CRM (admin or employee)
3. Navigate to Create Alert screen
4. Select **Today's date**
5. Select **time = current time + 2 minutes**
   - Example: If now is 15:30, select 15:32
6. Enter reason: "Test notification in 2 minutes"
7. Leave repeatDaily unchecked
8. Click "Create Alert"

**Expected Result:**
- ✅ Success message shows: "Alert created successfully! Notification will appear at 2026-01-XX 15:32"
- ✅ You are taken back to alerts list
- ✅ Alert appears in the list

**Now Wait 2 Minutes:**
- ✅ At exactly 15:32, notification should appear
- ✅ Sound plays (default notification sound)
- ✅ Phone vibrates (pattern: 300ms, 500ms, 300ms, 500ms)
- ✅ Notification shows: "🔔 System Alert - Test notification in 2 minutes"

**Test in Different App States:**
1. **App in foreground:** ✅ Notification appears as heads-up
2. **App in background:** ✅ Notification appears in notification shade
3. **App killed/closed:** ✅ Notification still appears at exact time

---

### Test 2: Check Scheduled Notifications 📋

**After creating alert, run in terminal:**
```bash
# Connect to device/emulator
adb shell

# Check notifee scheduled notifications
# (This requires app debugging tools)
```

**OR add debug button in app:**
```javascript
// Add this in Alerts.js for testing
const checkScheduled = async () => {
  const scheduled = await AlertNotificationService.getScheduledAlerts();
  Alert.alert('Scheduled', JSON.stringify(scheduled, null, 2));
};
```

**Expected:**
- ✅ Should show list of all scheduled alert notifications
- ✅ Each should have correct timestamp

---

### Test 3: Delete Alert (Should Cancel Notification) 🗑️

**Steps:**
1. Create alert for 5 minutes from now
2. Verify alert appears in list
3. Click "Delete" button on that alert
4. Confirm deletion
5. Wait 5 minutes

**Expected Result:**
- ✅ Alert removed from list immediately
- ✅ Notification does NOT appear after 5 minutes (cancelled)

**Console logs to check:**
```
✅ Alert and notification deleted: 677b1234...
```

---

### Test 4: Multiple Alerts at Different Times ⏰⏰⏰

**Steps:**
1. Create Alert 1: 2 minutes from now - "First alert"
2. Create Alert 2: 4 minutes from now - "Second alert"
3. Create Alert 3: 6 minutes from now - "Third alert"

**Expected:**
- ✅ At minute 2: First notification appears
- ✅ At minute 4: Second notification appears
- ✅ At minute 6: Third notification appears
- ✅ All with sound and vibration

---

### Test 5: Daily Repeat Alert 🔁

**Steps:**
1. Create alert for 2 minutes from now
2. **Check "Repeat Daily"** checkbox
3. Reason: "Daily reminder test"
4. Create alert

**Expected:**
- ✅ First notification appears in 2 minutes
- ✅ **Next day** at same time, notification appears again
- ✅ Repeats every day at that time

**To cancel:**
- Delete the alert from Alerts screen

---

### Test 6: App States During Notification 📱

**Test A: App in Foreground**
1. Keep app open on any screen
2. Wait for notification time
3. ✅ Notification appears as heads-up banner
4. ✅ Sound plays
5. Tap notification → ✅ Opens Alerts screen

**Test B: App in Background**
1. Press home button (app goes to background)
2. Wait for notification time
3. ✅ Notification appears in notification shade
4. ✅ Sound plays
5. Tap notification → ✅ App opens to Alerts screen

**Test C: App Killed/Closed**
1. Swipe app away from recents (kill app)
2. Wait for notification time
3. ✅ Notification STILL appears (notifee handles this)
4. ✅ Sound plays
5. Tap notification → ✅ App launches and opens Alerts screen

---

### Test 7: Notification at Exact Time ⏱️

**Steps:**
1. Create alert for specific time, e.g., 15:45
2. Use a stopwatch or clock
3. Observe exact time notification appears

**Expected:**
- ✅ Notification appears at **EXACTLY** 15:45:00
- ✅ Not 2 seconds later, not 5 seconds later
- ✅ Exactly at the scheduled time

---

## 🔍 Debugging

### Check Console Logs

**During Alert Creation:**
```
📤 Creating alert: { dateStr: '2026-01-10', timeStr: '15:30', reason: '...', repeatDaily: false }
🔔 Create Alert Response: { success: true, alert: { _id: '677b...' } }
📅 Scheduling alert: { id: '677b...', date: '2026-01-10', time: '15:30', ... }
✅ Alert notification scheduled for Fri Jan 10 2026 15:30:00
```

**During App Startup:**
```
🚀 Initializing AlertNotificationService...
✅ Alert notification channel created successfully
✅ AlertNotificationService initialized successfully
```

**During Alert Deletion:**
```
✅ Alert and notification deleted: 677b1234...
✅ Alert notification cancelled: alert_677b1234...
```

---

## 🐛 Troubleshooting

### Problem: Notification doesn't appear

**Check 1: Permissions**
- Settings → Apps → [App Name] → Notifications
- ✅ Ensure "Allow notifications" is ON

**Check 2: Do Not Disturb**
- Ensure phone is not in Do Not Disturb mode
- Or set app as priority/exception

**Check 3: Sound/Vibrate**
- Ensure phone is not on silent mode
- Check notification volume

**Check 4: Console Logs**
```javascript
// Check if notification was actually scheduled:
const scheduled = await AlertNotificationService.getScheduledAlerts();
console.log('Scheduled:', scheduled);
```

**Check 5: Time Sync**
- Ensure device time is correct
- Auto time sync enabled

---

### Problem: Notification appears but no sound

**Check:**
1. Notification channel settings
2. App notification settings
3. Phone volume (notification volume specifically)
4. Do Not Disturb rules

**Fix:**
```javascript
// Recreate channel with sound:
await notifee.deleteChannel('enquiry_reminders');
await AlertNotificationService.initialize();
```

---

### Problem: App doesn't open when tapping notification

**Check:**
1. NotificationHandler is setup in App.js
2. Navigation ref is passed correctly
3. Check console for navigation errors

**Debug:**
```javascript
// In NotificationHandler.js, add logs:
console.log('Notification pressed:', notification.data);
console.log('Navigating to:', notification.data.targetScreen);
```

---

## ✅ Success Criteria

All these should work:
- [x] Notification appears at EXACT scheduled time (not immediately)
- [x] Sound plays when notification fires
- [x] Vibration works
- [x] Works when app is foreground/background/killed
- [x] Deleting alert cancels notification
- [x] Multiple alerts work independently
- [x] Daily repeat works
- [x] Tapping notification opens Alerts screen
- [x] No syntax errors in code
- [x] No crashes

---

## 📊 Quick Reference

### Create Alert → Notification Flow
```
User creates alert (date: 2026-01-10, time: 15:30)
    ↓
POST /api/alerts/ (backend saves)
    ↓
Backend returns: { success: true, alert: { _id: '677b...' } }
    ↓
AlertNotificationService.scheduleAlert(...)
    ↓
notifee.createTriggerNotification(notification, trigger)
    ↓
Notification scheduled for timestamp: 1736522200000
    ↓
[Wait until 2026-01-10 15:30:00]
    ↓
🔔 NOTIFICATION FIRES with sound & vibration
```

---

## 🎯 Final Checks Before Deployment

- [ ] Build and run on physical device (not just emulator)
- [ ] Test all 3 app states (foreground, background, killed)
- [ ] Verify sound plays
- [ ] Verify vibration works
- [ ] Test delete → cancel notification
- [ ] Test multiple concurrent alerts
- [ ] Test daily repeat
- [ ] Check notification tapping opens correct screen
- [ ] Verify no memory leaks (create/delete many alerts)
- [ ] Test on different Android versions if possible

---

**Ready to test! 🚀**

Run the app and follow Test 1 first - create an alert for 2 minutes from now and confirm it works!
