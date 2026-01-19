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
      {/* Header - More Compact */}
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

      {/* Goal Grid - Adjusted spacing */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          alignContent: 'flex-start',
        }}
      >
        {displayGoals.map((goal, index) => (
          <FlexWidget
            key={goal.id}
            style={{
              width: isLarge ? '48%' : '23.5%',
              backgroundColor: theme.surfaceVariant,
              borderRadius: 8,
              padding: 6,
              marginRight: index % (isLarge ? 2 : 4) === (isLarge ? 0 : 3) ? 0 : isLarge ? '4%' : '2%',
              marginBottom: 6,
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

            {/* Progress */}
            <FlexWidget
              style={{
                height: 3,
                width: '100%',
                backgroundColor: theme.background,
                borderRadius: 2,
                overflow: 'hidden',
                marginVertical: 4,
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
                fontSize: isLarge ? 10 : 8,
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
