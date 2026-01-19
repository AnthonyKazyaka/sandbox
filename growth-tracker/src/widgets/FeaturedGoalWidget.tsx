import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetTheme } from './types';

interface FeaturedGoalWidgetProps {
  goalName: string;
  primaryStat: string;
  stage: string;
  progress: number; // 0 to 1
  secondaryStat?: string;
  theme: WidgetTheme;
  size: '2x1' | '2x2';
  goalId: string;
}

export function FeaturedGoalWidget({
  goalName,
  primaryStat,
  stage,
  progress,
  secondaryStat,
  theme,
  size,
  goalId,
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
        borderRadius: 12,
        padding: isLarge ? 12 : 8,
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: `growthtracker://goal/${goalId}` }}
    >
      {/* Header - Compact */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isLarge ? 8 : 4,
        }}
      >
        <TextWidget
          text={goalName}
          style={{
            fontSize: isLarge ? 14 : 12,
            color: theme.text,
            fontWeight: '600',
            flex: 1,
            marginRight: 6,
          }}
          maxLines={1}
          ellipsize="end"
        />
        <TextWidget
          text={stageEmoji}
          style={{
            fontSize: isLarge ? 24 : 20,
          }}
        />
      </FlexWidget>

      {/* Primary Stat - Prominent */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <TextWidget
          text={primaryStat}
          style={{
            fontSize: isLarge ? 36 : 28,
            color: theme.accent,
            fontWeight: 'bold',
          }}
        />
        {isLarge && secondaryStat && (
          <TextWidget
            text={secondaryStat}
            style={{
              fontSize: 11,
              color: theme.textSecondary,
              marginTop: 4,
            }}
          />
        )}
      </FlexWidget>

      {/* Progress Section - Compact */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          marginTop: isLarge ? 8 : 4,
        }}
      >
        <FlexWidget
          style={{
            height: isLarge ? 6 : 4,
            width: 'match_parent',
            backgroundColor: theme.surfaceVariant,
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 4,
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
        <TextWidget
          text={`${progressPercent}% progress`}
          style={{
            fontSize: 10,
            color: theme.textSecondary,
          }}
        />
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
