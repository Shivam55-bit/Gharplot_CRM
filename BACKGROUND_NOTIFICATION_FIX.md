# 🔔 Background Notification Fix - First Install Issue

## समस्या (Problem)
जब कोई पहली बार APK install करके reminder set करता था, तो notification background mode में नहीं आता था। जैसे ही app खोलते, notification तुरंत आ जाता था।

## कारण (Root Cause)
1. **Exact Alarm Permission** - Android 12+ में background notifications के लिए exact alarm permission ज़रूरी है
2. **Battery Optimization** - कुछ phones में battery optimization के कारण background processes रुक जाते हैं
3. **First-time Setup** - पहली बार install पर permissions properly request नहीं हो रहे थे

## Fix किए गए Changes

### 1. Battery Optimization Request (ReminderNotificationService.js)
```javascript
// Added new function to request battery optimization exclusion
static async requestBatteryOptimizationExclusion() {
  const powerManager = await notifee.getPowerManagerInfo();
  if (powerManager.activity) {
    await notifee.openBatteryOptimizationSettings();
  }
}
```

### 2. Improved Exact Alarm Permission (ReminderNotificationService.js)
- Permission request अब properly होता है
- User को settings में redirect करता है अगर permission नहीं मिला
- Permission status check और log करता है

### 3. First Launch Check (App.js)
```javascript
// Check if this is first-time setup
const isFirstLaunch = await AsyncStorage.getItem('app_first_launch');
if (isFirstLaunch === null) {
  console.log('🎉 First time app launch - Setting up permissions...');
  await AsyncStorage.setItem('app_first_launch', 'false');
}
```

### 4. Android Manifest Permissions
Added critical permissions:
```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.DISABLE_KEYGUARD" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

### 5. Boot Receiver (AndroidManifest.xml)
Added receiver to restore notifications after device restart:
```xml
<receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver">
  <intent-filter>
    <action android:name="android.intent.action.BOOT_COMPLETED" />
  </intent-filter>
</receiver>
```

### 6. Exact Alarm in Trigger (ReminderNotificationService.js)
```javascript
alarmManager: {
  allowWhileIdle: true, // Critical for background notifications
  exact: true, // Use exact alarm instead of inexact
}
```

### 7. Permission Check Before Save (EditReminderScreen.js)
अब reminder save करने से पहले permissions check होंगे:
- अगर permission नहीं है, तो alert दिखाएगा
- User को settings में भेज सकते हैं
- या "Continue Anyway" से proceed कर सकते हैं

## Testing Instructions

### First Install Test
1. **APK Build करें:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **पुराना app uninstall करें** (complete fresh install के लिए)

3. **नया APK install करें**

4. **Login करें और reminder set करें:**
   - 2-3 minutes future time में set करें
   - Message type करें

5. **Permissions Check करें:**
   - जब save button press करें, check करें कि permission alert आता है या नहीं
   - अगर alert आए, तो "Open Settings" दबाएं
   - Settings में "Alarms & reminders" permission enable करें

6. **App को background में भेजें या close करें**

7. **Wait करें** scheduled time के लिए

8. **Expected Behavior:**
   - Notification background में ही trigger होना चाहिए
   - Sound और vibration के साथ
   - App खोले बिना ही notification आना चाहिए

### Additional Checks

#### Check Exact Alarm Permission
```javascript
// In console or add to code temporarily
const canScheduleExactAlarms = await notifee.canScheduleExactAlarms();
console.log('Can schedule exact alarms:', canScheduleExactAlarms);
```

#### Check Battery Optimization
```javascript
const powerManager = await notifee.getPowerManagerInfo();
console.log('Battery optimization:', powerManager.activity);
```

#### Check All Permissions
```javascript
const permStatus = await ReminderNotificationService.getNotificationPermissionStatus();
console.log('Permission Status:', permStatus);
```

## User को Instructions

जब user पहली बार app install करें और reminder set करें, तो:

1. **"Alarms & reminders" permission को enable करें** जब prompt आए
2. **Battery optimization को disable करें** app के लिए (optional but recommended)
3. **Do Not Disturb mode check करें** - अगर enable है तो notification नहीं आएगा

## Important Notes

### Phone-Specific Issues
कुछ phones (Xiaomi, Oppo, Vivo, Samsung) में extra settings हो सकते हैं:
- **Autostart Permission** - App को background में run करने के लिए
- **Battery Saver** - Aggressive battery saving modes को disable करें
- **Notification Settings** - App के लिए all notification types enable करें

### Debug Logs
First install के बाद ये logs देखें:
```
🎉 First time app launch - Setting up permissions...
📱 Requesting notification permissions...
🔔 Can schedule exact alarms: true/false
🔋 Battery optimization: ...
📊 Permission Status: {...}
```

## Files Modified
1. `src/services/ReminderNotificationService.js`
2. `App.js`
3. `android/app/src/main/AndroidManifest.xml`
4. `src/screens/EditReminderScreen.js`

## Next Steps
अगर still issue हो तो:
1. Check device logs: `adb logcat | grep -i notif`
2. Verify exact alarm permission
3. Check battery optimization status
4. Test on different Android versions (12, 13, 14)
