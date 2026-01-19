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
        borderRadius: 12,
        padding: isWide ? 10 : 8,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header - Compact */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <TextWidget
          text="Focus Session"
          style={{
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: '500',
          }}
        />
        <TextWidget
          text={resultIcon}
          style={{ fontSize: 18 }}
        />
      </FlexWidget>

      {/* Start Button - Smaller padding */}
      <FlexWidget
        style={{
          backgroundColor: theme.accent,
          borderRadius: 10,
          padding: isWide ? 14 : 12,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          marginVertical: 6,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'growthtracker://focus/start' }}
      >
        <TextWidget
          text="▶ Start Focus"
          style={{
            fontSize: isWide ? 16 : 14,
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {isWide && (
        /* Preset Chips - More compact */
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 6,
          }}
        >
          {[25, 45, 60].map((minutes) => (
            <FlexWidget
              key={minutes}
              style={{
                backgroundColor: theme.surfaceVariant,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: `growthtracker://focus/start?duration=${minutes}` }}
            >
              <TextWidget
                text={`${minutes}m`}
                style={{
                  fontSize: 11,
                  color: theme.text,
                  fontWeight: '500',
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      )}

      {/* Stats Footer - Compact */}
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
            fontSize: 10,
            color: theme.textSecondary,
          }}
        />
        <TextWidget
          text={`🌱 ${Math.round(plantProgress * 100)}%`}
          style={{
            fontSize: 10,
            color: theme.accent,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
