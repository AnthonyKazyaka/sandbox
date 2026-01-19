# Growth Tracker Android Widgets

This app includes Android home screen widgets to help you track your growth goals at a glance.

## Available Widgets

### 1. Goal Overview Widget (4x2)
A comprehensive widget showing your top 3 goals with their:
- Plant growth stage emoji
- Goal type indicator (streak/focus/counter)
- Current progress
- Points earned

**Tap Actions:**
- Tap the widget to open the app
- Tap a goal row to go directly to that goal

### 2. Streak Widget (2x2)
A dedicated widget for tracking a single streak goal featuring:
- Plant emoji representing growth stage
- Visual progress bar
- Streak duration (days/hours/minutes)
- Quick action buttons

**Tap Actions:**
- "Reset" - Records a slip (requires app confirmation)
- "Refresh" - Updates the widget with latest data
- Tap anywhere else to open the goal

### 3. Quick Stats Widget (4x1)
A compact stats bar showing:
- Total number of goals
- Active streaks count
- Total points earned
- Best plant stage achieved

**Tap Actions:**
- Tap anywhere to open the app

## Technical Details

### Widget Configuration
Widgets are configured in `app.config.ts` using the `react-native-android-widget` plugin.

### Auto-Updates
- Widgets automatically update every 30 minutes
- Widgets update immediately when goals change in the app
- Manual refresh available on the Streak Widget

### Dark Mode Support
All widgets support both light and dark themes, automatically matching the system theme.

## Development

### Testing Widgets
1. Build the development client: `npx expo run:android`
2. Add a widget from the home screen widget picker
3. Use `WidgetPreview` component for in-app testing

### Files Structure
```
src/widgets/
├── GoalOverviewWidget.tsx    # Main goals list widget
├── StreakWidget.tsx          # Single streak goal widget
├── QuickStatsWidget.tsx      # Compact stats bar widget
├── types.ts                  # Shared types and themes
└── index.ts                  # Exports

src/services/
└── widgetUpdateService.tsx   # Widget update utilities

src/widgetTaskHandler.tsx     # Widget event handler
```

### Adding New Widgets
1. Create widget component in `src/widgets/`
2. Add widget configuration in `app.config.ts`
3. Handle widget in `widgetTaskHandler.tsx`
4. Add widget preview image in `assets/widget-preview/`
