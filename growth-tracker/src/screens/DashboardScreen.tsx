// Dashboard Screen - Main goal list view
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, useTheme, Appbar, Searchbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { GoalCard, EmptyState, ConfirmModal } from '../components';
import { Goal, GoalType } from '../models/types';
import { RootStackParamList } from '../navigation/types';

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

type FilterType = 'all' | GoalType;

export const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<DashboardNavProp>();
  const { state, recordSlip, startFocus, incrementGoalCounter, refreshData, refreshStreak } = useApp();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const [selectedGoalForSlip, setSelectedGoalForSlip] = useState<string | null>(null);

  // Filter and search goals
  const filteredGoals = state.goals.filter((goal) => {
    if (goal.isArchived) return false;
    if (filter !== 'all' && goal.type !== filter) return false;
    if (searchQuery && !goal.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh all streak goals to check for milestones
    for (const goal of state.goals) {
      if (goal.type === 'streak') {
        await refreshStreak(goal.id);
      }
    }
    await refreshData();
    setRefreshing(false);
  }, [refreshData, refreshStreak, state.goals]);

  const handleGoalPress = useCallback((goal: Goal) => {
    navigation.navigate('GoalDetail', { goalId: goal.id });
  }, [navigation]);

  const handleQuickAction = useCallback(async (goal: Goal) => {
    switch (goal.type) {
      case 'streak':
        setSelectedGoalForSlip(goal.id);
        setSlipModalVisible(true);
        break;
      case 'focus':
        if (goal.focusState.currentSession) {
          navigation.navigate('GoalDetail', { goalId: goal.id });
        } else {
          await startFocus(goal.id);
          navigation.navigate('GoalDetail', { goalId: goal.id });
        }
        break;
      case 'counter':
        await incrementGoalCounter(goal.id);
        break;
    }
  }, [navigation, startFocus, incrementGoalCounter]);

  const handleConfirmSlip = useCallback(async () => {
    if (selectedGoalForSlip) {
      await recordSlip(selectedGoalForSlip);
    }
    setSlipModalVisible(false);
    setSelectedGoalForSlip(null);
  }, [selectedGoalForSlip, recordSlip]);

  const handleCreateGoal = useCallback(() => {
    navigation.navigate('CreateGoal');
  }, [navigation]);

  const renderGoal = useCallback(({ item }: { item: Goal }) => (
    <GoalCard
      goal={item}
      onPress={handleGoalPress}
      onQuickAction={handleQuickAction}
    />
  ), [handleGoalPress, handleQuickAction]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Appbar.Header elevated>
        <Appbar.Content title="Growth Tracker" subtitle={`${filteredGoals.length} goals`} />
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
      </Appbar.Header>

      <View style={styles.filterContainer}>
        <Searchbar
          placeholder="Search goals..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as FilterType)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'streak', label: '⏱️' },
            { value: 'focus', label: '🎯' },
            { value: 'counter', label: '🔢' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {filteredGoals.length === 0 ? (
        <EmptyState
          title="No Goals Yet"
          message="Start your growth journey by creating your first goal!"
          emoji="🌱"
          actionLabel="Create Goal"
          onAction={handleCreateGoal}
        />
      ) : (
        <FlatList
          data={filteredGoals}
          renderItem={renderGoal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateGoal}
        color={theme.colors.onPrimary}
      />

      <ConfirmModal
        visible={slipModalVisible}
        title="Record a Slip?"
        message="This will reset your current streak. Your best streak will be preserved. This action cannot be undone."
        confirmText="Record Slip"
        cancelText="Cancel"
        onConfirm={handleConfirmSlip}
        onCancel={() => setSlipModalVisible(false)}
        destructive
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    gap: 12,
  },
  searchbar: {
    elevation: 0,
  },
  segmentedButtons: {
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
