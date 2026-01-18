# Growth Tracker 🌱

A React Native (Expo) app for tracking personal goals as growing plants. Inspired by quit-smoking apps with the "growing tree/seedling" metaphor.

## Features

### Goal Types

1. **Streak / Abstinence Timer** ⏱️
   - Track time since an event (e.g., quit smoking, no social media)
   - "Slip" button resets streak with confirmation
   - Tracks: current streak, best streak, total slips, slip history
   - Optional: money saved, units avoided

2. **Focus Session Timer** 🎯
   - Pomodoro-like timed sessions
   - Preset durations: 15m, 25m, 45m, 60m
   - Start / Pause / Resume / End controls
   - Points awarded on completion

3. **Counter Goal** 🔢
   - Daily or weekly targets (e.g., "work out 3x/week")
   - Quick +1 button with history log
   - Auto-resets on period boundary

### Visual Growth System 🌳

Each goal has a plant that grows through stages:
- 🌰 **Seed** (0-99 points)
- 🌱 **Sprout** (100-299 points)
- 🌿 **Plant** (300-599 points)
- 🪴 **Bush** (600-999 points)
- 🌳 **Tree** (1000+ points)

Earn "water points" from:
- Streak milestones (1h, 6h, 1d, 3d, 1w, 2w, 1m, 2m, 100d, 6m, 1y)
- Completed focus sessions
- Counter goal completions

## Tech Stack

- **React Native** + **Expo** (SDK 52)
- **TypeScript** for type safety
- **React Navigation** for routing
- **React Native Paper** for UI components
- **AsyncStorage** for local-first persistence
- **Jest** for unit testing

## Project Structure

```
growth-tracker/
├── App.tsx                    # Main entry point
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ConfirmModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── GoalCard.tsx
│   │   ├── GrowthVisualizer.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── StatsCard.tsx
│   │   └── Timer.tsx
│   ├── context/               # React Context providers
│   │   └── AppContext.tsx
│   ├── data/                  # Seed data
│   │   └── seedData.ts
│   ├── models/                # TypeScript type definitions
│   │   └── types.ts
│   ├── navigation/            # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── screens/               # Screen components
│   │   ├── CreateGoalScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── EditGoalScreen.tsx
│   │   ├── GoalDetailScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── storage/               # Data persistence layer
│   │   ├── asyncStorageAdapter.ts
│   │   ├── goalRepository.ts
│   │   ├── importExportService.ts
│   │   ├── settingsRepository.ts
│   │   └── types.ts
│   ├── theme/                 # Theme configuration
│   │   └── index.ts
│   └── utils/                 # Pure utility functions
│       ├── counterUtils.ts
│       ├── focusUtils.ts
│       ├── growthUtils.ts
│       └── streakUtils.ts
├── __tests__/                 # Jest unit tests
│   ├── counterUtils.test.ts
│   ├── focusUtils.test.ts
│   ├── growthUtils.test.ts
│   └── streakUtils.test.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (or iOS Simulator / Android Emulator)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd growth-tracker

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Loading Sample Data

The app includes sample seed data for testing. To load it, you can import and call the function:

```typescript
import { loadSeedData } from './src/data';

// In your development setup:
await loadSeedData();
```

This will populate the app with:
- 2 streak goals (Quit Smoking, Social Media Detox)
- 2 focus goals (Deep Work, Meditation)
- 2 counter goals (Exercise, Drink Water)

## Data Persistence

The app uses a **Repository Pattern** for data access:

```typescript
// GoalRepository interface
interface GoalRepository {
  getAll(): Promise<Goal[]>;
  getById(id: string): Promise<Goal | null>;
  upsert(goal: Goal): Promise<void>;
  remove(id: string): Promise<void>;
}
```

Currently uses **AsyncStorage**. The abstraction layer allows easy migration to SQLite:

1. Implement `StorageAdapter` interface for SQLite
2. Pass the new adapter to repository constructors
3. No changes needed to business logic

## Export/Import

Data can be exported as JSON from the Settings screen:
- Copies to clipboard (web) or shares (mobile)
- Import by copying JSON to clipboard and tapping Import

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
