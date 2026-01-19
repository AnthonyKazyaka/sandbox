'use no memo';
// Goal Overview Widget - Shows summary of top goals
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetGoalData, PLANT_EMOJI, GOAL_TYPE_ICON, lightTheme, darkTheme, WidgetTheme } from './types';

export interface GoalOverviewWidgetProps {
  goals: WidgetGoalData[];
  theme?: 'light' | 'dark';
}

function GoalRow({ goal, theme }: { goal: WidgetGoalData; theme: WidgetTheme }) {
  const plantEmoji = PLANT_EMOJI[goal.plantStage];
  const typeIcon = GOAL_TYPE_ICON[goal.type];

  // Format the stat based on goal type
  let statText = '';
  if (goal.type === 'streak') {
    if (goal.streakDays && goal.streakDays > 0) {
      statText = `${goal.streakDays}d ${goal.streakHours || 0}h`;
    } else if (goal.streakHours && goal.streakHours > 0) {
      statText = `${goal.streakHours}h ${goal.streakMinutes || 0}m`;
    } else {
      statText = `${goal.streakMinutes || 0}m`;
    }
  } else if (goal.type === 'focus') {
    statText = `${goal.totalFocusMinutes || 0}m focused`;
  } else if (goal.type === 'counter') {
    statText = `${goal.currentCount || 0}/${goal.targetCount || 0}`;
  }

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'match_parent',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: theme.surface,
        borderRadius: 8,
        marginBottom: 4,
      }}
      clickAction="OPEN_GOAL"
      clickActionData={{ goalId: goal.id }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <TextWidget
          text={plantEmoji}
          style={{
            fontSize: 20,
            marginRight: 8,
          }}
        />
        <FlexWidget
          style={{
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <TextWidget
            text={goal.name}
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.text,
            }}
          />
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={typeIcon}
              style={{
                fontSize: 10,
                marginRight: 4,
              }}
            />
            <TextWidget
              text={statText}
              style={{
                fontSize: 12,
                color: theme.textSecondary,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
      <TextWidget
        text={`${goal.totalPoints}pts`}
        style={{
          fontSize: 12,
          color: theme.accent,
          fontWeight: '500',
        }}
      />
    </FlexWidget>
  );
}

export function GoalOverviewWidget({ goals, theme = 'light' }: GoalOverviewWidgetProps) {
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const displayGoals = goals.slice(0, 3); // Show top 3 goals

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="🌱 Growth Goals"
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
          }}
        />
        <TextWidget
          text="↻"
          style={{
            fontSize: 16,
            color: colors.textSecondary,
          }}
        />
      </FlexWidget>

      {/* Goals List */}
      {displayGoals.length > 0 ? (
        displayGoals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} theme={colors} />
        ))
      ) : (
        <FlexWidget
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="No goals yet"
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          />
          <TextWidget
            text="Tap to create one!"
            style={{
              fontSize: 12,
              color: colors.accent,
              marginTop: 4,
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
