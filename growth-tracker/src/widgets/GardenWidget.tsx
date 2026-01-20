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

  // Calculate tile dimensions based on widget size
  const tileWidth = isLarge ? 70 : 60;
  const columns = isLarge ? 4 : 4;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.background,
        borderRadius: 12,
        padding: 10,
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="🌿"
          style={{
            fontSize: 16,
            marginRight: 4,
          }}
        />
        <TextWidget
          text="Your Garden"
          style={{
            fontSize: 14,
            color: theme.text,
            fontWeight: '600',
          }}
        />
      </FlexWidget>

      {/* Goal Grid - Row based layout */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          width: 'match_parent',
        }}
      >
        {/* First row */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: 'match_parent',
            marginBottom: 6,
          }}
        >
          {displayGoals.slice(0, columns).map((goal) => (
            <GoalTileWidget
              key={goal.id}
              goal={goal}
              theme={theme}
              tileWidth={tileWidth}
              isLarge={isLarge}
            />
          ))}
        </FlexWidget>

        {/* Second row (for 4x4 widgets) */}
        {isLarge && displayGoals.length > 4 && (
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: 'match_parent',
            }}
          >
            {displayGoals.slice(4, 8).map((goal) => (
              <GoalTileWidget
                key={goal.id}
                goal={goal}
                theme={theme}
                tileWidth={tileWidth}
                isLarge={isLarge}
              />
            ))}
          </FlexWidget>
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

interface GoalTileWidgetProps {
  goal: GoalTile;
  theme: WidgetTheme;
  tileWidth: number;
  isLarge: boolean;
}

function GoalTileWidget({ goal, theme, tileWidth, isLarge }: GoalTileWidgetProps) {
  const progressWidth = Math.max(2, Math.round((goal.progress) * (tileWidth - 12)));

  return (
    <FlexWidget
      style={{
        width: tileWidth,
        backgroundColor: theme.surfaceVariant,
        borderRadius: 8,
        padding: 6,
        flexDirection: 'column',
        alignItems: 'center',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: `growthtracker://goal/${goal.id}` }}
    >
      {/* Stage Icon */}
      <TextWidget
        text={getStageEmoji(goal.stage)}
        style={{ fontSize: isLarge ? 28 : 22 }}
      />

      {/* Progress bar */}
      <FlexWidget
        style={{
          height: 3,
          width: tileWidth - 12,
          backgroundColor: theme.background,
          borderRadius: 2,
          marginTop: 4,
          marginBottom: 4,
        }}
      >
        <FlexWidget
          style={{
            height: 3,
            width: progressWidth,
            backgroundColor: theme.accent,
            borderRadius: 2,
          }}
        />
      </FlexWidget>

      {/* Title */}
      <TextWidget
        text={goal.title}
        style={{
          fontSize: isLarge ? 10 : 8,
          color: theme.text,
          textAlign: 'center',
        }}
        maxLines={isLarge ? 2 : 1}
      />
    </FlexWidget>
  );
}

function getStageEmoji(stage: string): string {
  const stageMap: Record<string, string> = {
    seed: '🌱',
    sprout: '🌿',
    plant: '🪴',
    bush: '🌳',
    tree: '🌲',
  };
  return stageMap[stage] || '🌱';
}
