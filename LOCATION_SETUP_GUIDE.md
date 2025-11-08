# 📍 Location Service Setup Guide

## Overview
This app uses `react-native-geolocation-service` for accurate GPS location tracking on both Android and iOS.

## ✅ What's Already Configured

### 1. Package Installation
```bash
✓ react-native-geolocation-service@5.3.1 installed
✓ react-native-location removed (conflicting package)
```

### 2. Android Setup (AndroidManifest.xml)
```xml
✓ <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
✓ <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
✓ <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

### 3. Location Service Module
Created: `src/utils/locationService.js`

**Available Functions:**
- `getCurrentLocation()` - Get user's current GPS location
- `requestLocationPermission()` - Request location permissions
- `watchLocation()` - Track location continuously
- `stopWatchingLocation()` - Stop tracking
- `checkLocationEnabled()` - Check if GPS is on

### 4. HomeScreen Integration
- ✓ Updated to use new location service
- ✓ Automatic location fetch on first load
- ✓ "Current Location" button for manual refresh
- ✓ Error handling (no crashes)
- ✓ Works on emulator and real devices

## 🚀 How to Use

### Basic Usage Example

```javascript
import { getCurrentLocation } from '../utils/locationService';

// Get current location
const getLocation = async () => {
  try {
    const { latitude, longitude } = await getCurrentLocation({
      showAlert: true,         // Show alert on error
      timeout: 15000,          // 15 second timeout
      maximumAge: 10000,       // Accept 10 second old cache
      enableHighAccuracy: true // Use GPS (not network)
    });
    
    console.log('📍 Location:', latitude, longitude);
  } catch (error) {
    console.error('Location error:', error.message);
  }
};
```

### Advanced Usage - Watch Location

```javascript
import { watchLocation, stopWatchingLocation } from '../utils/locationService';

let watchId = null;

// Start watching location
const startTracking = async () => {
  try {
    watchId = await watchLocation(
      // Success callback
      ({ latitude, longitude }) => {
        console.log('Location updated:', latitude, longitude);
      },
      // Error callback
      (error) => {
        console.error('Watch error:', error);
      },
      // Options
      { enableHighAccuracy: true }
    );
  } catch (error) {
    console.error('Failed to start tracking:', error);
  }
};

// Stop watching location
const stopTracking = () => {
  if (watchId !== null) {
    stopWatchingLocation(watchId);
    watchId = null;
  }
};
```

## 📱 Testing

### On Real Device
1. Enable GPS/Location Services
2. Grant location permission when prompted
3. App will fetch your real GPS coordinates

### On Emulator
**Android Studio Emulator:**
1. Click "..." (Extended Controls)
2. Go to "Location"
3. Set custom coordinates or use default
4. App will use these coordinates

**iOS Simulator:**
1. Debug → Location → Custom Location
2. Enter coordinates
3. App will use these coordinates

### Test Scenarios

#### ✅ Normal Flow
```
1. User opens app
2. Permission dialog appears
3. User grants permission
4. Location fetched successfully
5. Nearby properties loaded
```

#### ⚠️ Permission Denied
```
1. User denies permission
2. Alert shows: "Permission denied"
3. No crash - falls back to default location
4. User can retry with "Current Location" button
```

#### ⚠️ GPS Disabled
```
1. GPS is turned off
2. Alert shows: "Please enable GPS"
3. No crash - error handled gracefully
4. Dialog prompts user to enable location
```

#### ⚠️ Timeout
```
1. Location takes too long
2. After 15 seconds, timeout error
3. Alert shows: "Request timed out"
4. No crash - user can retry
```

## 🛠️ Troubleshooting

### Android

**Problem: "Location permission denied"**
```bash
Solution:
1. Go to Settings → Apps → Gharplot
2. Permissions → Location
3. Select "Allow all the time" or "Allow only while using the app"
```

**Problem: "Location unavailable"**
```bash
Solution:
1. Enable GPS: Settings → Location → Turn ON
2. Check if app has location permission
3. Restart the app
```

**Problem: App crashes on location fetch**
```bash
Solution:
1. Check logcat: adb logcat *:E
2. Verify AndroidManifest.xml has permissions
3. Ensure react-native-geolocation-service is linked
```

### iOS

**Problem: Location not working**
```bash
Solution:
1. Check Info.plist has location permissions:
   - NSLocationWhenInUseUsageDescription
   - NSLocationAlwaysUsageDescription
2. Grant permission in Settings
```

## 📊 Console Logs

The location service provides detailed console logs:

```bash
✅ Success Logs:
📍 Current Location: { latitude: 28.7041, longitude: 77.1025 }

⚠️ Warning Logs:
⚠️ Location permission denied

❌ Error Logs:
❌ Location fetch error: { code: 2, message: 'Position unavailable' }
```

## 🔧 Configuration Options

### getCurrentLocation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showAlert` | boolean | `true` | Show alert dialog on error |
| `timeout` | number | `15000` | Max time to wait (ms) |
| `maximumAge` | number | `10000` | Accept cached location age (ms) |
| `enableHighAccuracy` | boolean | `true` | Use GPS (true) or network (false) |

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 1 | PERMISSION_DENIED | Grant location permission |
| 2 | POSITION_UNAVAILABLE | Enable GPS |
| 3 | TIMEOUT | Increase timeout or try again |
| 5 | LOCATION_DISABLED | Turn on location services |

## 📝 Best Practices

1. **Always handle errors** - Don't assume location will always work
2. **Request permission early** - Before user needs location
3. **Show loading indicator** - While fetching location
4. **Provide fallback** - Default location if GPS fails
5. **Cache location** - Save to AsyncStorage for faster load
6. **Use appropriate accuracy** - High accuracy drains battery
7. **Stop watching when not needed** - Save battery life

## 🔐 Privacy

- Location data is only used within the app
- No location data sent to third parties
- User can deny permission anytime
- Location saved locally in AsyncStorage

## 📚 Additional Resources

- [react-native-geolocation-service Documentation](https://github.com/Agontuk/react-native-geolocation-service)
- [Android Location Permissions](https://developer.android.com/training/location/permissions)
- [iOS Location Permissions](https://developer.apple.com/documentation/corelocation/requesting_authorization_for_location_services)

---

## 🎉 Summary

✅ Location service properly configured  
✅ Works on Android and iOS  
✅ Handles all error cases  
✅ No crashes on permission denial, GPS off, or timeout  
✅ Reusable service in `src/utils/locationService.js`  
✅ Integrated in HomeScreen with auto-fetch  
✅ Console logs for debugging  

**Ready to use! 🚀**
