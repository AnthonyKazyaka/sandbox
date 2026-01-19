'use no memo';
// Streak Widget - Shows a single streak goal with plant visualization
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetGoalData, PLANT_EMOJI, lightTheme, darkTheme, WidgetTheme } from './types';
import { PlantStage } from '../models/types';

export interface StreakWidgetProps {
  goal?: WidgetGoalData;
  theme?: 'light' | 'dark';
}

// Progress ring visualization using text
function ProgressDisplay({ 
  percentage, 
  plantStage, 
  theme 
}: { 
  percentage: number; 
  plantStage: PlantStage; 
  theme: WidgetTheme;
}) {
  const plantEmoji = PLANT_EMOJI[plantStage];
  
  // Create a simple progress indicator using filled/empty blocks
  const filledBlocks = Math.round(percentage / 10);
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

  return (
    <FlexWidget
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <TextWidget
        text={plantEmoji}
        style={{
          fontSize: 48,
        }}
      />
      <TextWidget
        text={progressBar}
        style={{
          fontSize: 8,
          color: theme.accent,
          marginTop: 4,
        }}
      />
      <TextWidget
        text={`${Math.round(percentage)}%`}
        style={{
          fontSize: 10,
          color: theme.textSecondary,
          marginTop: 2,
        }}
      />
    </FlexWidget>
  );
}

export function StreakWidget({ goal, theme = 'light' }: StreakWidgetProps) {
  const colors = theme === 'light' ? lightTheme : darkTheme;

  if (!goal) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: colors.background,
          borderRadius: 16,
          padding: 12,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="🌱"
          style={{
            fontSize: 40,
          }}
        />
        <TextWidget
          text="No streak goal"
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 8,
          }}
        />
        <TextWidget
          text="Tap to create one"
          style={{
            fontSize: 12,
            color: colors.accent,
            marginTop: 4,
          }}
        />
      </FlexWidget>
    );
  }

  // Calculate streak display
  let streakText = '';
  let subtitleText = '';
  
  if (goal.streakDays && goal.streakDays > 0) {
    streakText = `${goal.streakDays}`;
    subtitleText = goal.streakDays === 1 ? 'day' : 'days';
  } else if (goal.streakHours && goal.streakHours > 0) {
    streakText = `${goal.streakHours}`;
    subtitleText = goal.streakHours === 1 ? 'hour' : 'hours';
  } else {
    streakText = `${goal.streakMinutes || 0}`;
    subtitleText = 'minutes';
  }

  // Calculate progress to next milestone (simplified)
  const progressPercentage = Math.min(100, (goal.totalPoints % 100));

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_GOAL"
      clickActionData={{ goalId: goal.id }}
    >
      {/* Goal Name */}
      <TextWidget
        text={goal.name}
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
        }}
      />

      {/* Plant with Progress */}
      <ProgressDisplay
        percentage={progressPercentage}
        plantStage={goal.plantStage}
        theme={colors}
      />

      {/* Streak Counter */}
      <FlexWidget
        style={{
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <TextWidget
          text={streakText}
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.accent,
          }}
        />
        <TextWidget
          text={subtitleText}
          style={{
            fontSize: 12,
            color: colors.textSecondary,
          }}
        />
      </FlexWidget>

      {/* Action Buttons */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 6,
            alignItems: 'center',
            marginRight: 4,
          }}
          clickAction="RECORD_SLIP"
          clickActionData={{ goalId: goal.id }}
        >
          <TextWidget
            text="Reset"
            style={{
              fontSize: 10,
              color: colors.warning,
            }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: colors.accent,
            borderRadius: 8,
            padding: 6,
            alignItems: 'center',
            marginLeft: 4,
          }}
          clickAction="REFRESH"
          clickActionData={{ goalId: goal.id }}
        >
          <TextWidget
            text="Refresh"
            style={{
              fontSize: 10,
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
