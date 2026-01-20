// Goal Detail Screen - Full goal view with actions
import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, useTheme, Text, Button, Card, List, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { GrowthVisualizer, StatsCard, Timer, ConfirmModal } from '../components';
import { Goal, StreakGoal, FocusGoal, CounterGoal, DEFAULT_STREAK_MILESTONES, Milestone } from '../models/types';
import {
  calculateStreakDuration,
  formatStreakDuration,
  calculateMoneySaved,
  calculateUnitsAvoided,
} from '../utils/streakUtils';
import { getSessionStats, formatTimerDisplay } from '../utils/focusUtils';
import { formatPeriodLabel, getProgressPercentage, getTimeRemainingInPeriod, getPeriodEndTime } from '../utils/counterUtils';
import { getStageProgress, getStageName } from '../utils/growthUtils';
import { RootStackParamList } from '../navigation/types';

type GoalDetailRouteProp = RouteProp<RootStackParamList, 'GoalDetail'>;
type GoalDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'GoalDetail'>;

// Streak Detail Component
const StreakDetail: React.FC<{ goal: StreakGoal; onSlip: () => void }> = ({ goal, onSlip }) => {
  const theme = useTheme();
  const [duration, setDuration] = useState(calculateStreakDuration(goal.streakState.startedAt));
  const { refreshStreak } = useApp();

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(calculateStreakDuration(goal.streakState.startedAt));
      refreshStreak(goal.id);
    }, 1000);
    return () => clearInterval(interval);
  }, [goal.streakState.startedAt, goal.id, refreshStreak]);

  const moneySaved = calculateMoneySaved(
    duration.totalMs,
    goal.streakState.costPerUnit,
    goal.streakState.unitsPerDay
  );
  const unitsAvoided = calculateUnitsAvoided(duration.totalMs, goal.streakState.unitsPerDay);

  const stats = [
    { label: 'Current Streak', value: formatStreakDuration(duration) },
    { label: 'Best Streak', value: formatStreakDuration(calculateStreakDuration(0, goal.streakState.bestStreakMs)) },
    { label: 'Total Slips', value: goal.streakState.totalSlips },
    { label: 'Milestones', value: `${goal.streakState.achievedMilestones.length}/${DEFAULT_STREAK_MILESTONES.length}` },
  ];

  if (moneySaved !== null) {
    stats.push({ label: 'Money Saved', value: `$${moneySaved.toFixed(2)}` });
  }
  if (unitsAvoided !== null) {
    stats.push({ label: 'Units Avoided', value: unitsAvoided.toString() });
  }

  // Get next milestone
  const nextMilestone = DEFAULT_STREAK_MILESTONES.find(
    (m) => !goal.streakState.achievedMilestones.includes(m.id)
  );

  return (
    <View style={styles.detailContainer}>
      <StatsCard stats={stats} columns={2} />

      {nextMilestone && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Next Milestone: {nextMilestone.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              +{nextMilestone.points} water points
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>Milestones</Text>
          {DEFAULT_STREAK_MILESTONES.map((milestone) => {
            const achieved = goal.streakState.achievedMilestones.includes(milestone.id);
            return (
              <View key={milestone.id} style={styles.milestoneItem}>
                <Text style={{ opacity: achieved ? 1 : 0.5 }}>
                  {achieved ? '✅' : '⭕'} {milestone.name}
                </Text>
                <Text style={{ color: theme.colors.primary, opacity: achieved ? 1 : 0.5 }}>
                  +{milestone.points}
                </Text>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={onSlip}
        style={styles.actionButton}
        buttonColor={theme.colors.error}
        icon="alert-circle"
      >
        Record Slip
      </Button>
    </View>
  );
};

// Focus Detail Component
const FocusDetail: React.FC<{ goal: FocusGoal }> = ({ goal }) => {
  const theme = useTheme();
  const { startFocus, pauseFocus, resumeFocus, endFocus } = useApp();
  const stats = getSessionStats(goal.focusState);

  const handleStart = useCallback((durationMs: number) => {
    startFocus(goal.id, durationMs);
  }, [goal.id, startFocus]);

  const handlePause = useCallback(() => {
    pauseFocus(goal.id);
  }, [goal.id, pauseFocus]);

  const handleResume = useCallback(() => {
    resumeFocus(goal.id);
  }, [goal.id, resumeFocus]);

  const handleComplete = useCallback(() => {
    endFocus(goal.id, true);
  }, [goal.id, endFocus]);

  const handleAbandon = useCallback(() => {
    endFocus(goal.id, false);
  }, [goal.id, endFocus]);

  const statItems = [
    { label: 'Completed', value: stats.completedSessions },
    { label: 'Abandoned', value: stats.abandonedSessions },
    { label: 'Total Focus', value: formatTimerDisplay(stats.totalFocusTimeMs) },
    { label: 'Success Rate', value: `${Math.round(stats.completionRate * 100)}%` },
  ];

  return (
    <View style={styles.detailContainer}>
      <Timer
        session={goal.focusState.currentSession}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onComplete={handleComplete}
        onAbandon={handleAbandon}
        defaultDurationMs={goal.focusState.defaultDurationMs}
      />

      <StatsCard title="Session History" stats={statItems} columns={2} />

      {goal.focusState.sessions.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>Recent Sessions</Text>
            {goal.focusState.sessions.slice(-5).reverse().map((session) => (
              <View key={session.id} style={styles.sessionItem}>
                <Text>
                  {session.status === 'completed' ? '✅' : '❌'}{' '}
                  {formatTimerDisplay(session.actualDurationMs)}
                </Text>
                <Text style={{ color: theme.colors.primary }}>
                  +{session.pointsEarned} pts
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

// Counter Detail Component
const CounterDetail: React.FC<{ goal: CounterGoal }> = ({ goal }) => {
  const theme = useTheme();
  const { incrementGoalCounter } = useApp();
  const progress = getProgressPercentage(goal.counterState);
  const periodEnd = getPeriodEndTime(goal.counterState.period, goal.counterState.periodStartedAt);
  const timeRemaining = getTimeRemainingInPeriod(goal.counterState.period, goal.counterState.periodStartedAt);

  const handleIncrement = useCallback(() => {
    incrementGoalCounter(goal.id);
  }, [goal.id, incrementGoalCounter]);

  const statItems = [
    { label: formatPeriodLabel(goal.counterState.period), value: `${goal.counterState.currentCount}/${goal.counterState.targetCount}` },
    { label: 'Progress', value: `${Math.round(progress)}%` },
    { label: 'Completed Periods', value: goal.counterState.completedPeriods },
    { label: 'Time Left', value: formatTimerDisplay(timeRemaining) },
  ];

  return (
    <View style={styles.detailContainer}>
      <StatsCard stats={statItems} columns={2} />

      <Card style={styles.card}>
        <Card.Content style={styles.counterAction}>
          <Text variant="displayLarge" style={{ color: theme.colors.primary }}>
            {goal.counterState.currentCount}
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            / {goal.counterState.targetCount} {formatPeriodLabel(goal.counterState.period).toLowerCase()}
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleIncrement}
        style={styles.actionButton}
        icon="plus"
        contentStyle={styles.incrementButtonContent}
      >
        +1
      </Button>

      {goal.counterState.history.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>Recent Activity</Text>
            {goal.counterState.history.slice(-10).reverse().map((entry) => (
              <View key={entry.id} style={styles.historyItem}>
                <Text>+{entry.count}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

export const GoalDetailScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<GoalDetailNavProp>();
  const route = useRoute<GoalDetailRouteProp>();
  const { state, recordSlip, deleteGoal } = useApp();

  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const goal = state.goals.find((g) => g.id === route.params.goalId);

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Goal Not Found" />
        </Appbar.Header>
      </SafeAreaView>
    );
  }

  const handleConfirmSlip = async () => {
    await recordSlip(goal.id);
    setSlipModalVisible(false);
  };

  const handleConfirmDelete = async () => {
    await deleteGoal(goal.id);
    setDeleteModalVisible(false);
    navigation.goBack();
  };

  const { progressPercentage, pointsToNextStage, nextStage } = getStageProgress(goal.growth);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={goal.name} />
        <Appbar.Action
          icon="pencil"
          onPress={() => navigation.navigate('EditGoal', { goalId: goal.id })}
        />
        <Appbar.Action icon="delete" onPress={() => setDeleteModalVisible(true)} />
      </Appbar.Header>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Growth Section */}
        <Card style={styles.growthCard}>
          <Card.Content style={styles.growthContent}>
            <GrowthVisualizer growth={goal.growth} size="large" showLabel />
            <View style={styles.growthStats}>
              <Text variant="titleMedium">{goal.growth.totalPointsEarned} Total Points</Text>
              {nextStage && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {pointsToNextStage} pts to {getStageName(nextStage)}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {goal.description && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {goal.description}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Type-specific details */}
        {goal.type === 'streak' && (
          <StreakDetail goal={goal} onSlip={() => setSlipModalVisible(true)} />
        )}
        {goal.type === 'focus' && <FocusDetail goal={goal} />}
        {goal.type === 'counter' && <CounterDetail goal={goal} />}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ConfirmModal
        visible={slipModalVisible}
        title="Record a Slip?"
        message="This will reset your current streak. Your best streak will be preserved."
        confirmText="Record Slip"
        onConfirm={handleConfirmSlip}
        onCancel={() => setSlipModalVisible(false)}
        destructive
      />

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Goal?"
        message="This will permanently delete this goal and all its history. This cannot be undone."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        destructive
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  growthCard: {
    margin: 16,
    marginBottom: 8,
  },
  growthContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  growthStats: {
    marginTop: 16,
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  detailContainer: {
    paddingBottom: 16,
  },
  actionButton: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  counterAction: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  incrementButtonContent: {
    paddingVertical: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  bottomPadding: {
    height: 32,
  },
});
