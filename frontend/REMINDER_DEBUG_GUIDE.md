# 🔍 Reminder Debugging Guide

## Quick Debug Steps

### Step 1: Open Browser Console
Press `F12` or Right-click → Inspect → Console tab

### Step 2: Clear Cache (Important!)
Run in console:
```javascript
localStorage.removeItem('checkedReminders')
console.log('✅ Cleared reminder cache')
```

### Step 3: Check Service Status
Run in console:
```javascript
window.GlobalReminderService?.getStatus()
```
Should show:
- ✅ Active: true
- ✅ Check Interval: 1000ms
- ✅ Auto-popup: true

### Step 4: Create Test Reminder
1. Go to Enquiries page
2. Click "Add New Enquiry"
3. Fill required fields (Name, Contact, etc.)
4. Set Week/Action DateTime to **2-3 minutes in the future**
5. Submit form
6. Check console for these logs:
   ```
   🕐 Reminder Time Conversion:
     Input (local): 2024-12-18T14:30
     ISO String: 2024-12-18T14:30:00.000Z
     Will trigger at: 18/12/2024 14:30
   ✅ Reminder creation response: {...}
   📝 Created Reminder Details:
   ```

### Step 5: Monitor Service Logs
Every 1 second you should see:
```
🔍 Checking for due reminders at: ...
👤 Employee: Fetched X pending reminders
📋 Employee: Checking X reminders for due status...
   📅 Reminder [id]: {title, stored, reminderTime, diffMinutes, isDue}
```

### Step 6: Wait for Reminder Time
At the scheduled time, you should see:
```
   🔔 ✅ Reminder IS DUE: {...}
📋 Employee: Found 1 due reminders
🔔 Found 1 NEW due reminders!
✅ Marked as shown: [reminderId]
🔔 Triggering reminder popup for: [title]
🔊🔊🔊 PLAYING SOUND NOW!
```

## Debug Tools

### Quick Check Page
Open in browser: `http://your-frontend-url/check_reminder_service.html`
- Click "Check Reminders Now" to see all pending reminders
- Click "Clear Cache" to reset checked reminders

### Detailed Debug Page
Open: `http://your-frontend-url/debug_reminder.html`
- More comprehensive debugging tools
- Time conversion testing
- Service status checks

## Common Issues

### Issue 1: Service Not Running
**Check**: Run `window.GlobalReminderService?.getStatus()`
**Fix**: Service should auto-start. If not, login again.

### Issue 2: Reminder Already Shown
**Check**: Console shows "⏭️ Skipping already shown reminder"
**Fix**: Run `localStorage.removeItem('checkedReminders')`

### Issue 3: Wrong Time Format
**Check**: Console logs show "Stored:" time doesn't match "Will trigger at:"
**Fix**: Already fixed in code. If issue persists, share console logs.

### Issue 4: No Reminders Fetched
**Check**: Console shows "Fetched 0 pending reminders"
**Fix**: 
1. Verify reminder was created (check response logs)
2. Check reminder status is "pending"
3. Try fetching manually: See Quick Check Page

### Issue 5: Time Already Passed
**Check**: Console shows "diffMinutes: -X" (negative)
**Fix**: Reminder time is in the past. Create new reminder with future time.

### Issue 6: Time More Than 5 Minutes Ahead
**Check**: Console shows "diffMinutes: X" where X > 5
**Fix**: Wait. Service checks every second with 5-minute window.

## Console Commands

### Force Service Check
```javascript
window.GlobalReminderService?.forceCheck()
```

### Enable Auto-Popup (if disabled)
```javascript
window.GlobalReminderService?.setAutoPopup(true)
```

### Clear Checked Reminders
```javascript
window.GlobalReminderService?.clearCheckedReminders()
```

### Get Current Status
```javascript
window.GlobalReminderService?.getStatus()
```

## Expected Console Output for Successful Reminder

```
[Form Submit]
Creating reminder for weekActionDateTime: 2024-12-18T14:30
🕐 Reminder Time Conversion:
  Input (local): 2024-12-18T14:30
  Date object: Wed Dec 18 2024 14:30:00 GMT+0530 (IST)
  ISO String (UTC format, local values): 2024-12-18T14:30:00.000Z
  Will trigger at: 18/12/2024 14:30
📤 Creating Week/Action reminder: {name, email, phone, reminderTime, note}
✅ Reminder creation response: {success: true, ...}
📝 Created Reminder Details:
   ID: 676...
   Stored reminderDateTime: 2024-12-18T14:30:00.000Z
   Status: pending
   Parsed back: 18/12/2024, 2:30:00 pm
   Matches input? true

[Every 1 second until reminder time]
🔍 Checking for due reminders at: 2024-12-18T09:00:00.000Z
👤 Employee: Fetched 1 pending reminders
📋 Employee: Checking 1 reminders for due status...
   📅 Reminder 676...: {title, stored, diffMinutes: -2, isDue: false}

[At exactly 14:30 (or within 5 minutes after)]
🔍 Checking for due reminders at: 2024-12-18T09:00:30.000Z
👤 Employee: Fetched 1 pending reminders
📋 Employee: Checking 1 reminders for due status...
   📅 Reminder 676...: {title, stored, diffMinutes: 0, isDue: true}
   🔔 ✅ Reminder IS DUE: {id, title, reminderTime, currentTime, diffMinutes: 0}
📋 Employee: Found 1 due reminders (client-side check)
📋 Processing 1 reminders: [{id, time, title, status}]
🔔 Found 1 NEW due reminders!
✅ Marked as shown: 676...
🔔 Triggering reminder popup for: [title]
🎵 Audio initialized successfully!
🔊🔊🔊 PLAYING SOUND NOW!
🔔 Notification permission: granted
```

## Still Not Working?

If reminder still doesn't popup after following all steps:

1. **Share Console Logs**: Copy ALL console output from form submit until 2 minutes after scheduled time
2. **Check Browser Tab**: Make sure browser tab stays active (don't minimize or switch tabs)
3. **Check Browser Notifications**: Allow notifications when browser prompts
4. **Check Audio**: Unmute browser and check volume
5. **Try Different Browser**: Test in Chrome/Edge if using Firefox, or vice versa

## Contact

If issue persists, provide:
- All console logs (screenshots or text)
- Reminder creation response
- Service status output
- Browser and OS version
