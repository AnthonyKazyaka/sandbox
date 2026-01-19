# 🚀 Quick Start: Android Widgets

## Build is Currently Running ✅

Your Android build is in progress! Here's what's ready:

### ✅ Completed Setup
1. **6 Widget Components** - Featured Goal (2 sizes), Focus Launcher (2 sizes), Garden (2 sizes)
2. **Widget Snapshot Service** - Caches data for fast widget rendering
3. **Deep Linking** - `growthtracker://` scheme configured
4. **EAS Configuration** - Ready for development builds
5. **Required Packages** - `expo-linking`, `expo-dev-client` installed

---

## Next: Test the Build

### Option 1: Use Current Local Build (Fastest)
The build running in the background terminal will complete soon:

```powershell
# Once build finishes, check if device is connected
adb devices

# If device/emulator connected, build will auto-install
# If not, manually install the APK from android/app/build/outputs/apk/debug/
```

### Option 2: EAS Development Build (Recommended)
Create a cloud-built development APK:

```powershell
# Initialize EAS (if first time)
npm install -g eas-cli
eas login
eas init

# Build development APK
eas build --profile development --platform android

# After build completes (~5-10 min), install it:
eas build:run --profile development --platform android
```

---

## Testing Widgets

### 1. Start the Emulator
```powershell
# Set environment
$env:ANDROID_HOME = "C:\Users\askan\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Start emulator
C:\Users\askan\AppData\Local\Android\Sdk\emulator\emulator.exe -avd Medium_Phone_API_36.1 -no-snapshot-load &

# Check if ready
adb shell getprop sys.boot_completed
# Returns: 1 when ready
```

### 2. Install App
```powershell
# Development build will install automatically
# Or manually:
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### 3. Start Development Server
```powershell
# In a NEW terminal window:
npx expo start --dev-client

# Press 'a' to open on Android
```

### 4. Add Widget to Home Screen
1. Long-press on emulator home screen
2. Tap "Widgets" at bottom
3. Scroll to "Growth Tracker"
4. Drag one of these to home screen:
   - **Featured Goal (Small)** - 2×1
   - **Featured Goal** - 2×2 ⭐ RECOMMENDED FIRST
   - **Focus Launcher** - 2×2
   - **Focus Launcher (Wide)** - 4×2
   - **Garden Overview** - 4×2
   - **Garden (Large)** - 4×4

### 5. Test Widget Interactions
```powershell
# Widget should show your goals
# Tap widget → should open app to goal detail

# Test deep link manually:
adb shell am start -W -a android.intent.action.VIEW -d "growthtracker://goal/YOUR_GOAL_ID" com.growthtracker.app
```

---

## Verify Widget Updates

### Create a Test Goal
1. Open app (press 'a' in expo terminal or launch from emulator)
2. Create a new goal (any type)
3. Widget should update automatically
4. If not, check logs:
   ```powershell
   adb logcat | Select-String "Widget"
   ```

### Trigger Manual Update
In app, any of these actions should refresh widgets:
- Complete a focus session
- Increment a counter
- Record a slip (reset streak)
- Refresh data

---

## Troubleshooting Current Build

### If build is stuck:
```powershell
# Check gradle status
cd C:\Git\sandbox\growth-tracker\android
.\gradlew.bat --status

# If stuck, cancel and retry:
.\gradlew.bat --stop
cd ..
npx expo run:android
```

### If "No devices found":
```powershell
# Restart adb
adb kill-server
adb start-server
adb devices

# Restart emulator if needed
```

### Build Error - JAVA_HOME:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

---

## File Locations

### Widget Components
- `src/widgets/FeaturedGoalWidget.tsx` - Featured goal widget
- `src/widgets/FocusLauncherWidget.tsx` - Focus session launcher
- `src/widgets/GardenWidget.tsx` - Multi-goal garden view

### Services
- `src/services/widgetSnapshotService.ts` - Widget data caching
- `src/services/widgetSnapshot.ts` - Data contract types

### Configuration
- `app.config.ts` - Widget & deep link config
- `eas.json` - EAS build profiles

### Documentation
- `WIDGET_SETUP.md` - Complete setup guide (THIS FILE)

---

## Expected Build Time

- **First Build**: 10-15 minutes (downloads dependencies)
- **Subsequent Builds**: 60-90 seconds
- **EAS Build**: 5-10 minutes (cloud build)

---

## Next Steps After Build Completes

1. ✅ Widget compiles → **Test on emulator**
2. ✅ Widget displays → **Test interactions (tap)**
3. ✅ Deep link works → **Test widget updates**
4. ✅ Updates work → **Test on physical device**
5. ✅ All pass → **Ready for production build!**

---

## Quick Commands Reference

```powershell
# Development
npx expo start --dev-client          # Start dev server
npx expo run:android                 # Build + run local

# EAS Builds
eas build --profile development --platform android
eas build:run --profile development --platform android

# Device Management
adb devices                          # List devices
adb install app.apk                  # Install APK
adb logcat | Select-String "Widget"  # View logs

# Widget Testing
adb shell cmd appwidget list providers  # List widgets
adb shell am start -d "growthtracker://goal/123" com.growthtracker.app
```

---

## Need Help?

Check the comprehensive guide: [WIDGET_SETUP.md](./WIDGET_SETUP.md)

**Current Build Status**: Check the terminal running `npx expo run:android`
- Progress indicator shows current phase
- Build finishes when you see "BUILD SUCCESSFUL"
