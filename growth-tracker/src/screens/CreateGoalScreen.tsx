// Create Goal Screen
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Appbar,
  useTheme,
  Text,
  TextInput,
  Button,
  Card,
  SegmentedButtons,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { GoalType, CounterPeriod } from '../models/types';
import { RootStackParamList } from '../navigation/types';

type CreateGoalNavProp = NativeStackNavigationProp<RootStackParamList, 'CreateGoal'>;

const DURATION_OPTIONS = [
  { value: '900000', label: '15m' },
  { value: '1500000', label: '25m' },
  { value: '2700000', label: '45m' },
  { value: '3600000', label: '60m' },
];

export const CreateGoalScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<CreateGoalNavProp>();
  const { createStreakGoal, createFocusGoal, createCounterGoal } = useApp();

  const [goalType, setGoalType] = useState<GoalType>('streak');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Streak-specific
  const [costPerUnit, setCostPerUnit] = useState('');
  const [unitsPerDay, setUnitsPerDay] = useState('');

  // Focus-specific
  const [defaultDuration, setDefaultDuration] = useState('1500000'); // 25 minutes

  // Counter-specific
  const [targetCount, setTargetCount] = useState('1');
  const [period, setPeriod] = useState<CounterPeriod>('daily');

  const isValid = name.trim().length > 0;

  const handleCreate = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      switch (goalType) {
        case 'streak':
          await createStreakGoal(
            name.trim(),
            description.trim() || undefined,
            costPerUnit ? parseFloat(costPerUnit) : undefined,
            unitsPerDay ? parseFloat(unitsPerDay) : undefined
          );
          break;
        case 'focus':
          await createFocusGoal(
            name.trim(),
            description.trim() || undefined,
            parseInt(defaultDuration, 10)
          );
          break;
        case 'counter':
          await createCounterGoal(
            name.trim(),
            description.trim() || undefined,
            parseInt(targetCount, 10) || 1,
            period
          );
          break;
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isValid,
    isSubmitting,
    goalType,
    name,
    description,
    costPerUnit,
    unitsPerDay,
    defaultDuration,
    targetCount,
    period,
    createStreakGoal,
    createFocusGoal,
    createCounterGoal,
    navigation,
  ]);

  const renderTypeSpecificFields = () => {
    switch (goalType) {
      case 'streak':
        return (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Tracking Stats (Optional)
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                Track money saved and units avoided
              </Text>
              <TextInput
                mode="outlined"
                label="Cost per unit ($)"
                value={costPerUnit}
                onChangeText={setCostPerUnit}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="e.g., 0.50"
              />
              <TextInput
                mode="outlined"
                label="Units per day"
                value={unitsPerDay}
                onChangeText={setUnitsPerDay}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="e.g., 20"
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

  const getTypeDescription = () => {
    switch (goalType) {
      case 'streak':
        return 'Track time since an event (e.g., quit smoking, no social media)';
      case 'focus':
        return 'Timed focus sessions with start/pause/complete';
      case 'counter':
        return 'Count activities with daily/weekly targets';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create Goal" />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Goal Type Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Goal Type
              </Text>
              <SegmentedButtons
                value={goalType}
                onValueChange={(value) => setGoalType(value as GoalType)}
                buttons={[
                  { value: 'streak', label: '⏱️ Streak', showSelectedCheck: true },
                  { value: 'focus', label: '🎯 Focus', showSelectedCheck: true },
                  { value: 'counter', label: '🔢 Counter', showSelectedCheck: true },
                ]}
                style={styles.segmentedButtons}
              />
              <HelperText type="info" style={styles.helperText}>
                {getTypeDescription()}
              </HelperText>
            </Card.Content>
          </Card>

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
                placeholder="e.g., Quit Smoking, Deep Work, Exercise"
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
                placeholder="Why is this goal important to you?"
                maxLength={200}
              />
            </Card.Content>
          </Card>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleCreate}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              style={styles.createButton}
              contentStyle={styles.createButtonContent}
            >
              Create Goal
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
  helperText: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  createButton: {
    minWidth: 200,
  },
  createButtonContent: {
    paddingVertical: 8,
  },
});
