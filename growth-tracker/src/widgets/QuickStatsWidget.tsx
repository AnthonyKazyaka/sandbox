'use no memo';
// Quick Stats Widget - Compact stats bar
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetGoalData, PLANT_EMOJI, lightTheme, darkTheme, WidgetTheme } from './types';

export interface QuickStatsWidgetProps {
  totalGoals: number;
  activeStreaks: number;
  totalPoints: number;
  bestPlantStage: string;
  theme?: 'light' | 'dark';
}

interface StatItemProps {
  icon: string;
  value: string;
  label: string;
  theme: WidgetTheme;
}

function StatItem({ icon, value, label, theme }: StatItemProps) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <TextWidget
        text={icon}
        style={{
          fontSize: 16,
        }}
      />
      <TextWidget
        text={value}
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: theme.text,
        }}
      />
      <TextWidget
        text={label}
        style={{
          fontSize: 9,
          color: theme.textSecondary,
        }}
      />
    </FlexWidget>
  );
}

export function QuickStatsWidget({
  totalGoals,
  activeStreaks,
  totalPoints,
  bestPlantStage,
  theme = 'light',
}: QuickStatsWidgetProps) {
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const plantEmoji = PLANT_EMOJI[bestPlantStage as keyof typeof PLANT_EMOJI] || '🌱';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* App Icon/Title */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: 8,
        }}
      >
        <TextWidget
          text="🌱"
          style={{
            fontSize: 18,
            marginRight: 4,
          }}
        />
        <TextWidget
          text="Growth"
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.text,
          }}
        />
      </FlexWidget>

      {/* Stats */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          flex: 1,
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <StatItem
          icon="🎯"
          value={`${totalGoals}`}
          label="Goals"
          theme={colors}
        />
        <StatItem
          icon="⏱️"
          value={`${activeStreaks}`}
          label="Streaks"
          theme={colors}
        />
        <StatItem
          icon="⭐"
          value={`${totalPoints}`}
          label="Points"
          theme={colors}
        />
        <StatItem
          icon={plantEmoji}
          value={bestPlantStage.charAt(0).toUpperCase() + bestPlantStage.slice(1)}
          label="Best"
          theme={colors}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
