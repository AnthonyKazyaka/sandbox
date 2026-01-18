// Goal Card Component - displays goal summary in dashboard
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { GrowthVisualizer } from './GrowthVisualizer';
import { formatStreakDuration, calculateStreakDuration } from '../utils/streakUtils';
import { formatTimerDisplay, getSessionStats } from '../utils/focusUtils';
import { getProgressPercentage, formatPeriodLabel } from '../utils/counterUtils';

interface GoalCardProps {
  goal: Goal;
  onPress: (goal: Goal) => void;
  onQuickAction?: (goal: Goal) => void;
}

const getGoalTypeIcon = (type: Goal['type']): string => {
  switch (type) {
    case 'streak':
      return 'timer-outline';
    case 'focus':
      return 'target';
    case 'counter':
      return 'counter';
    default:
      return 'leaf';
  }
};

const getGoalTypeLabel = (type: Goal['type']): string => {
  switch (type) {
    case 'streak':
      return 'Streak';
    case 'focus':
      return 'Focus';
    case 'counter':
      return 'Counter';
    default:
      return '';
  }
};

const StreakStat: React.FC<{ goal: StreakGoal }> = ({ goal }) => {
  const duration = calculateStreakDuration(goal.streakState.startedAt);
  return (
    <Text variant="titleMedium" numberOfLines={1}>
      {formatStreakDuration(duration)}
    </Text>
  );
};

const FocusStat: React.FC<{ goal: FocusGoal }> = ({ goal }) => {
  const stats = getSessionStats(goal.focusState);
  if (goal.focusState.currentSession) {
    return (
      <Text variant="titleMedium" style={{ color: '#4CAF50' }}>
        In Progress
      </Text>
    );
  }
  return (
    <Text variant="titleMedium" numberOfLines={1}>
      {stats.completedSessions} sessions
    </Text>
  );
};

const CounterStat: React.FC<{ goal: CounterGoal }> = ({ goal }) => {
  const progress = getProgressPercentage(goal.counterState);
  return (
    <Text variant="titleMedium" numberOfLines={1}>
      {goal.counterState.currentCount}/{goal.counterState.targetCount} {formatPeriodLabel(goal.counterState.period)}
    </Text>
  );
};

const GoalStat: React.FC<{ goal: Goal }> = ({ goal }) => {
  switch (goal.type) {
    case 'streak':
      return <StreakStat goal={goal} />;
    case 'focus':
      return <FocusStat goal={goal} />;
    case 'counter':
      return <CounterStat goal={goal} />;
    default:
      return null;
  }
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, onQuickAction }) => {
  const theme = useTheme();

  const getQuickActionIcon = (): string => {
    switch (goal.type) {
      case 'streak':
        return 'alert-circle-outline';
      case 'focus':
        return goal.focusState.currentSession ? 'pause' : 'play';
      case 'counter':
        return 'plus';
      default:
        return 'plus';
    }
  };

  return (
    <Card style={styles.card} onPress={() => onPress(goal)}>
      <Card.Content style={styles.content}>
        <View style={styles.leftSection}>
          <GrowthVisualizer growth={goal.growth} size="small" showProgress />
        </View>

        <View style={styles.middleSection}>
          <View style={styles.header}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {getGoalTypeLabel(goal.type)}
            </Text>
          </View>
          <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
            {goal.name}
          </Text>
          <GoalStat goal={goal} />
        </View>

        <View style={styles.rightSection}>
          {onQuickAction && (
            <IconButton
              icon={getQuickActionIcon()}
              size={28}
              onPress={() => onQuickAction(goal)}
              style={styles.quickAction}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  leftSection: {
    marginRight: 12,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    marginBottom: 2,
  },
  rightSection: {
    marginLeft: 8,
  },
  quickAction: {
    margin: 0,
  },
});
