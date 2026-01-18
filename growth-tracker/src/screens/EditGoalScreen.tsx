// Edit Goal Screen
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Appbar,
  useTheme,
  Text,
  TextInput,
  Button,
  Card,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { Goal, StreakGoal, FocusGoal, CounterGoal, CounterPeriod } from '../models/types';
import { RootStackParamList } from '../navigation/types';

type EditGoalRouteProp = RouteProp<RootStackParamList, 'EditGoal'>;
type EditGoalNavProp = NativeStackNavigationProp<RootStackParamList, 'EditGoal'>;

const DURATION_OPTIONS = [
  { value: '900000', label: '15m' },
  { value: '1500000', label: '25m' },
  { value: '2700000', label: '45m' },
  { value: '3600000', label: '60m' },
];

export const EditGoalScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditGoalNavProp>();
  const route = useRoute<EditGoalRouteProp>();
  const { state, updateGoal } = useApp();

  const goal = state.goals.find((g) => g.id === route.params.goalId);

  const [name, setName] = useState(goal?.name ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Streak-specific
  const [costPerUnit, setCostPerUnit] = useState(
    goal?.type === 'streak' ? goal.streakState.costPerUnit?.toString() ?? '' : ''
  );
  const [unitsPerDay, setUnitsPerDay] = useState(
    goal?.type === 'streak' ? goal.streakState.unitsPerDay?.toString() ?? '' : ''
  );

  // Focus-specific
  const [defaultDuration, setDefaultDuration] = useState(
    goal?.type === 'focus' ? goal.focusState.defaultDurationMs.toString() : '1500000'
  );

  // Counter-specific
  const [targetCount, setTargetCount] = useState(
    goal?.type === 'counter' ? goal.counterState.targetCount.toString() : '1'
  );
  const [period, setPeriod] = useState<CounterPeriod>(
    goal?.type === 'counter' ? goal.counterState.period : 'daily'
  );

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

  const isValid = name.trim().length > 0;

  const handleSave = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let updatedGoal: Goal;

      switch (goal.type) {
        case 'streak':
          updatedGoal = {
            ...goal,
            name: name.trim(),
            description: description.trim() || undefined,
            streakState: {
              ...goal.streakState,
              costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
              unitsPerDay: unitsPerDay ? parseFloat(unitsPerDay) : undefined,
            },
          };
          break;
        case 'focus':
          updatedGoal = {
            ...goal,
            name: name.trim(),
            description: description.trim() || undefined,
            focusState: {
              ...goal.focusState,
              defaultDurationMs: parseInt(defaultDuration, 10),
            },
          };
          break;
        case 'counter':
          updatedGoal = {
            ...goal,
            name: name.trim(),
            description: description.trim() || undefined,
            counterState: {
              ...goal.counterState,
              targetCount: parseInt(targetCount, 10) || 1,
              period,
            },
          };
          break;
        default:
          return;
      }

      await updateGoal(updatedGoal);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (goal.type) {
      case 'streak':
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Tracking Stats
              </Text>
              <TextInput
                mode="outlined"
                label="Cost per unit ($)"
                value={costPerUnit}
                onChangeText={setCostPerUnit}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Units per day"
                value={unitsPerDay}
                onChangeText={setUnitsPerDay}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </Card.Content>
          </Card>
        );
      case 'focus':
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Default Session Duration
              </Text>
              <SegmentedButtons
                value={defaultDuration}
                onValueChange={setDefaultDuration}
                buttons={DURATION_OPTIONS}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>
        );
      case 'counter':
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Counter Settings
              </Text>
              <TextInput
                mode="outlined"
                label="Target count"
                value={targetCount}
                onChangeText={setTargetCount}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text variant="labelMedium" style={{ marginTop: 16, marginBottom: 8 }}>
                Period
              </Text>
              <SegmentedButtons
                value={period}
                onValueChange={(value) => setPeriod(value as CounterPeriod)}
                buttons={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Goal" />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Basic Info
              </Text>
              <TextInput
                mode="outlined"
                label="Goal name *"
                value={name}
                onChangeText={setName}
                style={styles.input}
                maxLength={50}
              />
              <TextInput
                mode="outlined"
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </Card.Content>
          </Card>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardTitle: {
    marginBottom: 16,
  },
  segmentedButtons: {
    alignSelf: 'stretch',
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    minWidth: 200,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});
