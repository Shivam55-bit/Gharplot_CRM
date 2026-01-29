# Fix: "Gharplot has not been registered" Error

## Root Cause
The component name registered in JavaScript (`index.js`) doesn't match what the native Android code expects in `MainActivity.kt`.

## Quick Fix (Do These Steps)

### Step 1: Kill all running processes
```bash
# Close Metro bundler if running
# Ctrl+C in the terminal running `react-native start`

# Stop any adb connections
adb disconnect
```

### Step 2: Clear all caches
```bash
# Windows Command Prompt (Run as Administrator)
cd C:\Guru ji\Gharplot
rd /s /q android\.gradle
rd /s /q android\app\build
rd /s /q node_modules\.cache
```

### Step 3: Clean the Android build
```bash
cd C:\Guru ji\Gharplot\android
.\gradlew.bat clean
```

### Step 4: Start Metro bundler with fresh cache
```bash
cd C:\Guru ji\Gharplot
npx react-native start --reset-cache
```

### Step 5: Build and run the app (in another terminal)
```bash
cd C:\Guru ji\Gharplot
npx react-native run-android
```

## Verification Checklist

✓ **MainActivity.kt** - Component name is `"Gharplot"`:
```kotlin
override fun getMainComponentName(): String = "Gharplot"
```

✓ **index.js** - Registration matches:
```javascript
const appName = 'Gharplot';
AppRegistry.registerComponent(appName, () => App);
```

✓ **App.js** - Proper export:
```javascript
export default App;
```

✓ **app.json** - Name matches:
```json
"name": "Gharplot"
```

## If Issue Persists

### Nuclear Option: Complete Reset
```bash
# Delete node modules and reinstall
cd C:\Guru ji\Gharplot
rmdir /s /q node_modules
npm install

# Delete Android build artifacts
cd android
.\gradlew.bat clean
cd ..

# Start fresh
npx react-native start --reset-cache
npx react-native run-android
```

### Check Native Modules
Make sure `MainApplication.kt` or `MainApplication.java` properly initializes:
```java
// Should contain getPackages() that returns all modules
```

## Common Causes
1. **Case sensitivity mismatch** - `gharplot` vs `Gharplot`
2. **Stale bundler cache** - Metro cached old component name
3. **Outdated Android build** - Old APK still running
4. **Node modules corruption** - Reinstall required

## Debug Logs
Check the app log for:
```
E/ReactNativeJS: "Gharplot" has not been registered
```

This indicates the native side is looking for `"Gharplot"` but JavaScript isn't registering it.

---
**Last Updated**: January 27, 2026
