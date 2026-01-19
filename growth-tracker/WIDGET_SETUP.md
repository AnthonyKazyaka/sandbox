# Android Home-Screen Widget Setup Guide
**Expo Managed Workflow + EAS Development Builds**

---

## 📋 Table of Contents
1. [Dependencies & Installation](#dependencies--installation)
2. [Widget Snapshot Data Contract](#widget-snapshot-data-contract)
3. [Widget Implementations](#widget-implementations)
4. [App Configuration](#app-configuration)
5. [Deep Linking Setup](#deep-linking-setup)
6. [Widget Update Service](#widget-update-service)
7. [EAS Development Build Workflow](#eas-development-build-workflow)
8. [Testing on Physical Device](#testing-on-physical-device)
9. [Testing on Emulator](#testing-on-emulator)
10. [Troubleshooting](#troubleshooting)

---

## 1. Dependencies & Installation

### Install Required Packages
```powershell
# Core dependencies
npm install react-native-android-widget@^0.20.1

# Deep linking (already installed with Expo)
npx expo install expo-linking

# EAS CLI (global)
npm install -g eas-cli

# Login to EAS
eas login
```

### Verify `package.json` includes:
```json
{
  "dependencies": {
    "react-native-android-widget": "^0.20.1",
    "expo-linking": "~7.0.3",
    "expo-dev-client": "~6.0.45"
  }
}
```

---

## 2. Widget Snapshot Data Contract

### File: `src/services/widgetSnapshot.ts`
```typescript
/**
 * Widget Snapshot - Cached data for widget rendering
 * Stored in AsyncStorage and read by widget task handler
 */
export interface WidgetSnapshot {
  updatedAt: number; // Unix timestamp
  featuredGoalId: string;
  title: string;
  primaryText: string; // e.g., "3d 4h", "125 days", "45 completed"
  stage: string; // PlantStage enum value
  progress0to1: number; // 0.0 to 1.0
  goalType: 'streak' | 'focus' | 'counter';
  
  // Optional: for multi-goal widgets
  topGoals?: Array<{
    id: string;
    title: string;
    stage: string;
    progress: number;
  }>;
  
  // Optional: for focus widget
  lastSessionResult?: 'success' | 'cancelled' | null;
  todayFocusMinutes?: number;
}

export const WIDGET_SNAPSHOT_KEY = '@growth_tracker/widget_snapshot';
```

---

## 3. Widget Implementations

### Widget 1: Featured Goal Widget (2×1, 2×2)
**File: `src/widgets/FeaturedGoalWidget.tsx`**
```typescript
import React from 'react';
import { FlexWidget, TextWidget, SvgWidget } from 'react-native-android-widget';
import type { WidgetTheme } from './types';

interface FeaturedGoalWidgetProps {
  goalName: string;
  primaryStat: string;
  stage: string;
  progress: number; // 0 to 1
  secondaryStat?: string;
  theme: WidgetTheme;
  size: '2x1' | '2x2';
}

export function FeaturedGoalWidget({
  goalName,
  primaryStat,
  stage,
  progress,
  secondaryStat,
  theme,
  size,
}: FeaturedGoalWidgetProps) {
  const progressPercent = Math.round(progress * 100);
  const stageEmoji = getStageEmoji(stage);
  
  const isLarge = size === '2x2';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.background,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_GOAL"
      clickActionData={{ goalId: 'featured' }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <TextWidget
          text={goalName}
          style={{
            fontSize: isLarge ? 16 : 14,
            color: theme.text,
            fontWeight: '600',
            flex: 1,
            marginRight: 8,
          }}
          maxLines={isLarge ? 2 : 1}
          ellipsize="end"
        />
        <TextWidget
          text={stageEmoji}
          style={{
            fontSize: isLarge ? 28 : 24,
          }}
        />
      </FlexWidget>

      {/* Primary Stat */}
      <TextWidget
        text={primaryStat}
        style={{
          fontSize: isLarge ? 32 : 24,
          color: theme.accent,
          fontWeight: 'bold',
          marginVertical: isLarge ? 8 : 4,
        }}
      />

      {/* Progress Bar */}
      <FlexWidget
        style={{
          height: isLarge ? 8 : 6,
          width: 'match_parent',
          backgroundColor: theme.surfaceVariant,
          borderRadius: isLarge ? 4 : 3,
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            height: 'match_parent',
            width: `${progressPercent}%`,
            backgroundColor: theme.accent,
          }}
        />
      </FlexWidget>

      {/* Footer */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: isLarge ? 8 : 4,
        }}
      >
        <TextWidget
          text={`${progressPercent}% to next stage`}
          style={{
            fontSize: 11,
            color: theme.textSecondary,
          }}
        />
        {secondaryStat && isLarge && (
          <TextWidget
            text={secondaryStat}
            style={{
              fontSize: 11,
              color: theme.textSecondary,
            }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

function getStageEmoji(stage: string): string {
  const stageMap: Record<string, string> = {
    seed: '🌱',
    sprout: '🌿',
    seedling: '🪴',
    youngPlant: '🌳',
    maturePlant: '🌲',
    flowering: '🌸',
    fruiting: '🍎',
  };
  return stageMap[stage] || '🌱';
}
```

### Widget 2: Focus Launcher Widget (2×2, 4×2)
**File: `src/widgets/FocusLauncherWidget.tsx`**
```typescript
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTheme } from './types';

interface FocusLauncherWidgetProps {
  lastSessionResult: 'success' | 'cancelled' | null;
  todayFocusMinutes: number;
  plantProgress: number;
  theme: WidgetTheme;
  size: '2x2' | '4x2';
}

export function FocusLauncherWidget({
  lastSessionResult,
  todayFocusMinutes,
  plantProgress,
  theme,
  size,
}: FocusLauncherWidgetProps) {
  const isWide = size === '4x2';
  const resultIcon = lastSessionResult === 'success' ? '✅' : lastSessionResult === 'cancelled' ? '⏱' : '⭕';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.background,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="Focus Session"
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            fontWeight: '500',
          }}
        />
        <TextWidget
          text={resultIcon}
          style={{ fontSize: 20 }}
        />
      </FlexWidget>

      {/* Start Button */}
      <FlexWidget
        style={{
          backgroundColor: theme.accent,
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 12,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'growthtracker://focus/start' }}
      >
        <TextWidget
          text="▶ Start Focus"
          style={{
            fontSize: 18,
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {isWide && (
        /* Preset Chips */
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 12,
          }}
        >
          {[25, 45, 60].map((minutes) => (
            <FlexWidget
              key={minutes}
              style={{
                backgroundColor: theme.surfaceVariant,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: `growthtracker://focus/start?duration=${minutes}` }}
            >
              <TextWidget
                text={`${minutes}m`}
                style={{
                  fontSize: 12,
                  color: theme.text,
                  fontWeight: '500',
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      )}

      {/* Stats Footer */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={`Today: ${todayFocusMinutes}min`}
          style={{
            fontSize: 12,
            color: theme.textSecondary,
          }}
        />
        <TextWidget
          text={`🌱 ${Math.round(plantProgress * 100)}%`}
          style={{
            fontSize: 12,
            color: theme.accent,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
```

### Widget 3: Garden Multi-Goal Widget (4×2, 4×4)
**File: `src/widgets/GardenWidget.tsx`**
```typescript
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTheme } from './types';

interface GoalTile {
  id: string;
  title: string;
  stage: string;
  progress: number;
}

interface GardenWidgetProps {
  goals: GoalTile[];
  theme: WidgetTheme;
  size: '4x2' | '4x4';
}

export function GardenWidget({ goals, theme, size }: GardenWidgetProps) {
  const isLarge = size === '4x4';
  const maxGoals = isLarge ? 8 : 4;
  const displayGoals = goals.slice(0, maxGoals);
  const columns = isLarge ? 2 : 4;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.background,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <TextWidget
        text="🌿 Your Garden"
        style={{
          fontSize: 16,
          color: theme.text,
          fontWeight: '600',
          marginBottom: 12,
        }}
      />

      {/* Goal Grid */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        {displayGoals.map((goal, index) => (
          <FlexWidget
            key={goal.id}
            style={{
              width: isLarge ? '48%' : '23%',
              backgroundColor: theme.surfaceVariant,
              borderRadius: 8,
              padding: 8,
              marginBottom: 8,
              flexDirection: 'column',
              alignItems: 'center',
            }}
            clickAction="OPEN_GOAL"
            clickActionData={{ goalId: goal.id }}
          >
            {/* Stage Icon */}
            <TextWidget
              text={getStageEmoji(goal.stage)}
              style={{ fontSize: isLarge ? 32 : 24 }}
            />

            {/* Progress */}
            <FlexWidget
              style={{
                height: 4,
                width: '100%',
                backgroundColor: theme.background,
                borderRadius: 2,
                overflow: 'hidden',
                marginVertical: 6,
              }}
            >
              <FlexWidget
                style={{
                  height: 'match_parent',
                  width: `${Math.round(goal.progress * 100)}%`,
                  backgroundColor: theme.accent,
                }}
              />
            </FlexWidget>

            {/* Title */}
            <TextWidget
              text={goal.title}
              style={{
                fontSize: isLarge ? 11 : 9,
                color: theme.text,
                textAlign: 'center',
              }}
              maxLines={isLarge ? 2 : 1}
              ellipsize="end"
            />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

function getStageEmoji(stage: string): string {
  const stageMap: Record<string, string> = {
    seed: '🌱',
    sprout: '🌿',
    seedling: '🪴',
    youngPlant: '🌳',
    maturePlant: '🌲',
    flowering: '🌸',
    fruiting: '🍎',
  };
  return stageMap[stage] || '🌱';
}
```

---

## 4. App Configuration

### Update `app.config.ts`
```typescript
import type { ConfigContext, ExpoConfig } from 'expo/config';
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: 'FeaturedGoal2x1',
      label: 'Featured Goal (Small)',
      minWidth: '180dp',
      minHeight: '80dp',
      targetCellWidth: 2,
      targetCellHeight: 1,
      description: 'Quick view of your featured growth goal',
      updatePeriodMillis: 1800000, // 30 minutes
    },
    {
      name: 'FeaturedGoal2x2',
      label: 'Featured Goal',
      minWidth: '180dp',
      minHeight: '180dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'Detailed view of your featured growth goal',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'FocusLauncher2x2',
      label: 'Focus Launcher',
      minWidth: '180dp',
      minHeight: '180dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'Start a focus session quickly',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'FocusLauncher4x2',
      label: 'Focus Launcher (Wide)',
      minWidth: '320dp',
      minHeight: '180dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'Focus launcher with preset durations',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'Garden4x2',
      label: 'Garden Overview',
      minWidth: '320dp',
      minHeight: '180dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'Overview of all your growth goals',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'Garden4x4',
      label: 'Garden (Large)',
      minWidth: '320dp',
      minHeight: '320dp',
      targetCellWidth: 4,
      targetCellHeight: 4,
      description: 'Detailed view of all your goals',
      updatePeriodMillis: 1800000,
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Growth Tracker',
  slug: 'growth-tracker',
  version: '1.0.0',
  scheme: 'growthtracker', // CRITICAL for deep linking
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.growthtracker.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.growthtracker.app',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'growthtracker',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-dev-client', // Required for dev builds
    ['react-native-android-widget', widgetConfig],
  ],
});
```

---

## 5. Deep Linking Setup

### Update Navigation to Handle Deep Links
**File: `src/navigation/AppNavigator.tsx`** (add to existing file)
```typescript
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'growthtracker://',
    Linking.createURL('/'),
  ],
  config: {
    screens: {
      Main: '',
      GoalDetail: {
        path: 'goal/:goalId',
        parse: {
          goalId: (goalId: string) => goalId,
        },
      },
      FocusSession: {
        path: 'focus/start',
        parse: {
          duration: (duration: string) => parseInt(duration, 10),
        },
      },
    },
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      {/* Your existing navigation setup */}
    </NavigationContainer>
  );
}
```

### Update Navigation Types
**File: `src/navigation/types.ts`**
```typescript
export type RootStackParamList = {
  Main: undefined;
  GoalDetail: { goalId: string };
  FocusSession: { duration?: number };
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  Settings: undefined;
  WidgetPreview: undefined;
};
```

---

## 6. Widget Update Service

### Widget Snapshot Service
**File: `src/services/widgetSnapshotService.ts`**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetSnapshot } from './widgetSnapshot';
import type { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { calculateStreakDuration } from '../utils/streakUtils';
import { calculateProgress } from '../utils/growthUtils';

export const WIDGET_SNAPSHOT_KEY = '@growth_tracker/widget_snapshot';

/**
 * Generate widget snapshot from goals
 */
export async function generateWidgetSnapshot(goals: Goal[]): Promise<WidgetSnapshot | null> {
  if (goals.length === 0) return null;

  // Pick the "best" goal for featured widget (most recent activity)
  const featuredGoal = goals[0]; // You can customize this logic

  let primaryText = '';
  let goalType: 'streak' | 'focus' | 'counter' = 'streak';

  if (featuredGoal.type === 'streak') {
    const streakGoal = featuredGoal as StreakGoal;
    const duration = calculateStreakDuration(streakGoal);
    primaryText = formatDuration(duration);
    goalType = 'streak';
  } else if (featuredGoal.type === 'focus') {
    const focusGoal = featuredGoal as FocusGoal;
    primaryText = `${focusGoal.sessionsCompleted} sessions`;
    goalType = 'focus';
  } else if (featuredGoal.type === 'counter') {
    const counterGoal = featuredGoal as CounterGoal;
    primaryText = `${counterGoal.currentCount} / ${counterGoal.targetCount}`;
    goalType = 'counter';
  }

  const progress = calculateProgress(featuredGoal);

  // Top goals for garden widget
  const topGoals = goals.slice(0, 8).map((goal) => ({
    id: goal.id,
    title: goal.title,
    stage: goal.plantStage,
    progress: calculateProgress(goal),
  }));

  const snapshot: WidgetSnapshot = {
    updatedAt: Date.now(),
    featuredGoalId: featuredGoal.id,
    title: featuredGoal.title,
    primaryText,
    stage: featuredGoal.plantStage,
    progress0to1: progress,
    goalType,
    topGoals,
  };

  return snapshot;
}

/**
 * Save widget snapshot to storage
 */
export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Failed to save widget snapshot:', error);
  }
}

/**
 * Load widget snapshot from storage
 */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (!json) return null;
    return JSON.parse(json) as WidgetSnapshot;
  } catch (error) {
    console.error('Failed to load widget snapshot:', error);
    return null;
  }
}

/**
 * Update all widgets after snapshot changes
 */
export async function updateAllWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await requestWidgetUpdate({
      widgetName: 'FeaturedGoal2x1',
      renderWidget: () => <></>, // Handler will render
    });
    await requestWidgetUpdate({
      widgetName: 'FeaturedGoal2x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'FocusLauncher2x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'FocusLauncher4x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'Garden4x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'Garden4x4',
      renderWidget: () => <></>,
    });
  } catch (error) {
    console.error('Failed to update widgets:', error);
  }
}

/**
 * Trigger widget update after app events
 */
export async function refreshWidgetsFromGoals(goals: Goal[]): Promise<void> {
  const snapshot = await generateWidgetSnapshot(goals);
  if (snapshot) {
    await saveWidgetSnapshot(snapshot);
    await updateAllWidgets();
  }
}

// Helper: Format duration for display
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
```

### Hook into App Events
**Update: `src/context/AppContext.tsx`** (add to existing context)
```typescript
import { refreshWidgetsFromGoals } from '../services/widgetSnapshotService';

// In your context methods, add these calls:

// After slip reset
async recordSlip(goalId: string) {
  // ... existing slip logic
  
  // Refresh widgets
  const allGoals = Object.values(state.goals);
  await refreshWidgetsFromGoals(allGoals);
}

// After focus session complete
async completeFocusSession(goalId: string, duration: number) {
  // ... existing focus session logic
  
  // Refresh widgets
  const allGoals = Object.values(state.goals);
  await refreshWidgetsFromGoals(allGoals);
}

// After counter increment
async incrementCounter(goalId: string) {
  // ... existing counter logic
  
  // Refresh widgets
  const allGoals = Object.values(state.goals);
  await refreshWidgetsFromGoals(allGoals);
}
```

---

## 7. EAS Development Build Workflow

### Initialize EAS
```powershell
# Initialize EAS project
eas init

# Configure project
eas build:configure
```

### EAS Build Configuration
**File: `eas.json`** (create in root)
```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build for Development
```powershell
# Build DEVELOPMENT APK (includes dev client)
eas build --profile development --platform android

# This will:
# 1. Upload your code to EAS servers
# 2. Build a development APK with expo-dev-client
# 3. Download link will be provided (~5-10 minutes)
```

**Important Notes:**
- Development builds include the Expo Dev Client UI
- You can press `m` in terminal to open dev menu
- Supports fast refresh and debugging
- Build once, use many times (until native changes)

---

## 8. Testing on Physical Device

### Install ADB (if not already)
```powershell
# Add to PATH (already done if Android Studio installed)
$env:PATH += ";C:\Users\askan\AppData\Local\Android\Sdk\platform-tools"
```

### Connect Physical Device
1. Enable Developer Options on Android:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging
3. Connect via USB cable

### Verify Connection
```powershell
# Check connected devices
adb devices

# Should show:
# List of devices attached
# ABC123XYZ    device
```

### Install Development APK
```powershell
# Download APK from EAS build (link in terminal)
# Or use direct install:
eas build:run --profile development --platform android

# Or manual install:
adb install path\to\growth-tracker.apk
```

### Start Development Server
```powershell
# Start Metro bundler
npx expo start --dev-client

# Scan QR code with dev client app OR
# Press 'a' to open on connected Android device
```

### Test Widget on Physical Device
```powershell
# 1. Long-press on home screen
# 2. Tap "Widgets"
# 3. Scroll to "Growth Tracker"
# 4. Drag any widget to home screen

# To verify widget is installed:
adb shell cmd appwidget list providers

# Should show:
# AppWidget provider: com.growthtracker.app/...
```

### Debug Widget
```powershell
# View Android logs (real-time)
adb logcat | Select-String "GrowthTracker"

# Or filter React Native:
adb logcat *:S ReactNative:V ReactNativeJS:V
```

---

## 9. Testing on Emulator

### Create Emulator (if needed)
```powershell
# List available AVDs
C:\Users\askan\AppData\Local\Android\Sdk\emulator\emulator.exe -list-avds

# Create new AVD (if none exist)
C:\Users\askan\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\avdmanager.bat create avd -n Pixel_5_API_34 -k "system-images;android-34;google_apis;x86_64"
```

### Start Emulator
```powershell
# Set environment variables
$env:ANDROID_HOME = "C:\Users\askan\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\askan\AppData\Local\Android\Sdk"

# Start emulator
C:\Users\askan\AppData\Local\Android\Sdk\emulator\emulator.exe -avd Medium_Phone_API_36.1 -no-snapshot-load

# Wait for boot (check with):
adb shell getprop sys.boot_completed
# Returns: 1 (when ready)
```

### Install on Emulator
```powershell
# Start dev server first
npx expo start --dev-client

# Press 'a' to install on emulator
# Or manually:
adb install path\to\growth-tracker.apk
```

### Add Widget on Emulator
1. Long-press on emulator home screen
2. Tap "Widgets" at bottom
3. Scroll to "Growth Tracker"
4. Drag widget to home screen
5. Tap to open app (tests deep linking)

### Emulator-Specific Commands
```powershell
# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Simulate widget update (force refresh)
adb shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE
```

---

## 10. Troubleshooting

### Issue: Widget Not Appearing in Launcher

**Symptoms:**
- Can't find "Growth Tracker" in widget picker
- Other apps' widgets appear fine

**Solutions:**
```powershell
# 1. Verify app is installed
adb shell pm list packages | Select-String "growthtracker"

# 2. Check widget provider is registered
adb shell cmd appwidget list providers | Select-String "growthtracker"

# 3. Reinstall app (clean install)
adb uninstall com.growthtracker.app
adb install path\to\growth-tracker.apk

# 4. Restart launcher
adb shell am force-stop com.google.android.apps.nexuslauncher
# Or reboot device:
adb reboot
```

**Root Causes:**
- Widget not declared in app.config.ts plugins array
- `react-native-android-widget` config plugin not applied
- Need to rebuild after config changes

---

### Issue: Widget Not Updating

**Symptoms:**
- Widget shows old data
- Doesn't reflect app changes

**Solutions:**
```powershell
# 1. Check widget snapshot in storage
adb shell run-as com.growthtracker.app cat /data/data/com.growthtracker.app/files/RCTAsyncLocalStorage_V1/@growth_tracker:widget_snapshot

# 2. Manually trigger update
# In app code:
import { requestWidgetUpdate } from 'react-native-android-widget';
await requestWidgetUpdate({ widgetName: 'FeaturedGoal2x2' });

# 3. Check logs for errors
adb logcat | Select-String "Widget"

# 4. Force widget refresh
adb shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE
```

**Root Causes:**
- `updateAllWidgets()` not called after app events
- AsyncStorage permissions issue
- Widget task handler error (check logs)

---

### Issue: Deep Linking Not Working

**Symptoms:**
- Tapping widget doesn't open app
- Opens app but wrong screen

**Solutions:**
```powershell
# 1. Test deep link manually
adb shell am start -W -a android.intent.action.VIEW -d "growthtracker://goal/123" com.growthtracker.app

# 2. Verify scheme in app.config.ts
# Should have: scheme: 'growthtracker'

# 3. Check linking configuration in AppNavigator
# LinkingOptions must match widget URIs

# 4. Rebuild app after config changes
npx expo prebuild --clean
npx expo run:android
```

**Root Causes:**
- Missing `scheme` in app.config.ts
- Incorrect URI format in widget
- Navigation config doesn't match scheme

---

### Issue: Build/Gradle Errors

**Common Errors:**

**1. JAVA_HOME not set**
```powershell
# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```

**2. Android SDK not found**
```powershell
$env:ANDROID_HOME = "C:\Users\askan\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\askan\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\askan\AppData\Local\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "C:\Users\askan\AppData\Local\Android\Sdk", "User")
```

**3. Gradle daemon issues**
```powershell
# Kill gradle daemon
cd C:\Git\sandbox\growth-tracker\android
.\gradlew.bat --stop

# Clean build
.\gradlew.bat clean
```

**4. First build very slow**
- First Gradle build downloads dependencies (~500MB)
- Takes 10-15 minutes on first run
- Subsequent builds: 60-90 seconds

---

### Emulator vs Physical Device Differences

| Feature | Emulator | Physical Device |
|---------|----------|-----------------|
| **Setup** | Pre-configured AVD | Enable USB debugging |
| **Connection** | Always localhost | USB or WiFi ADB |
| **Performance** | Slower, depends on CPU | Native speed |
| **Launcher** | Pixel Launcher (stock) | Varies by manufacturer |
| **Widget Picker** | Standard Android | May vary (Samsung, etc.) |
| **Deep Links** | Works via `adb shell` | Works natively |
| **Notifications** | Limited | Full support |
| **Best For** | Development, CI/CD | Final testing, UX |

**Recommendation:** Test on both emulator AND physical device before releasing.

---

## Quick Reference Commands

```powershell
# === BUILD ===
eas build --profile development --platform android   # Build dev APK
eas build:run --profile development --platform android  # Build + install

# === DEVELOPMENT ===
npx expo start --dev-client                          # Start dev server
npx expo run:android                                 # Build + run locally

# === DEVICE ===
adb devices                                          # List connected devices
adb install app.apk                                  # Install APK
adb uninstall com.growthtracker.app                 # Uninstall app
adb logcat | Select-String "GrowthTracker"          # View logs

# === WIDGETS ===
adb shell cmd appwidget list providers              # List widget providers
adb shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE  # Force update

# === DEEP LINKS ===
adb shell am start -W -a android.intent.action.VIEW -d "growthtracker://goal/123" com.growthtracker.app

# === EMULATOR ===
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load  # Start emulator
adb shell getprop sys.boot_completed                 # Check boot status
```

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Add widget components to `src/widgets/`
3. ✅ Update `app.config.ts` with widget configs
4. ✅ Add deep linking to navigation
5. ✅ Create widget snapshot service
6. ✅ Hook widget updates into app events
7. 🔄 Build development APK with EAS
8. 🔄 Install on physical device/emulator
9. 🔄 Test widget functionality
10. 🔄 Verify deep linking works

**Estimated Time:** 
- Initial setup: 30 minutes
- First EAS build: 10-15 minutes
- Testing: 15-20 minutes
- **Total:** ~1 hour

---

## Support Resources

- [react-native-android-widget Docs](https://github.com/salRoid/react-native-android-widget)
- [Expo Dev Client Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Widget Design Guide](https://developer.android.com/develop/ui/views/appwidgets/overview)
