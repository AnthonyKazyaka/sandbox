// Timer Component for Focus Sessions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button, useTheme, IconButton } from 'react-native-paper';
import { FocusSession } from '../models/types';
import { formatTimerDisplay, getRemainingTime, isSessionTimeComplete } from '../utils/focusUtils';
import { ProgressRing } from './ProgressRing';

interface TimerProps {
  session: FocusSession | null;
  onStart: (durationMs: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  defaultDurationMs: number;
}

const DURATION_PRESETS = [
  { label: '15m', value: 15 * 60 * 1000 },
  { label: '25m', value: 25 * 60 * 1000 },
  { label: '45m', value: 45 * 60 * 1000 },
  { label: '60m', value: 60 * 60 * 1000 },
];

export const Timer: React.FC<TimerProps> = ({
  session,
  onStart,
  onPause,
  onResume,
  onComplete,
  onAbandon,
  defaultDurationMs,
}) => {
  const theme = useTheme();
  const [selectedDuration, setSelectedDuration] = useState(defaultDurationMs);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Calculate remaining time for active session
  useEffect(() => {
    if (session && !isPaused) {
      const updateRemaining = () => {
        const remaining = getRemainingTime(session);
        setRemainingMs(remaining);

        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete();
        }
      };

      updateRemaining();
      intervalRef.current = setInterval(updateRemaining, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [session, isPaused, onComplete]);

  // Pulse animation when timer is running
  useEffect(() => {
    if (session && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [session, isPaused, pulseAnim]);

  const handleStart = useCallback(() => {
    onStart(selectedDuration);
  }, [onStart, selectedDuration]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      onResume?.();
    } else {
      setIsPaused(true);
      onPause?.();
    }
  }, [isPaused, onPause, onResume]);

  const progress = session
    ? ((session.plannedDurationMs - remainingMs) / session.plannedDurationMs) * 100
    : 0;

  if (!session) {
    // Pre-session state - show duration picker
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Set Focus Duration
        </Text>

        <View style={styles.presetsContainer}>
          {DURATION_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              mode={selectedDuration === preset.value ? 'contained' : 'outlined'}
              onPress={() => setSelectedDuration(preset.value)}
              style={styles.presetButton}
              compact
            >
              {preset.label}
            </Button>
          ))}
        </View>

        <View style={styles.timerDisplay}>
          <Text variant="displayLarge" style={styles.timerText}>
            {formatTimerDisplay(selectedDuration)}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleStart}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
          icon="play"
        >
          Start Focus Session
        </Button>
      </View>
    );
  }

  // Active session state
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        {isPaused ? 'Paused' : 'Focus Mode'}
      </Text>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <ProgressRing
          progress={progress}
          size={200}
          strokeWidth={12}
          color={isPaused ? theme.colors.outline : theme.colors.primary}
        >
          <Text
            variant="displayMedium"
            style={[styles.timerText, isPaused && { color: theme.colors.outline }]}
          >
            {formatTimerDisplay(remainingMs)}
          </Text>
        </ProgressRing>
      </Animated.View>

      <View style={styles.controlsContainer}>
        <IconButton
          icon={isPaused ? 'play' : 'pause'}
          size={48}
          mode="contained"
          onPress={handlePauseResume}
        />
        <IconButton
          icon="stop"
          size={48}
          mode="contained-tonal"
          onPress={onAbandon}
          iconColor={theme.colors.error}
        />
      </View>

      <Text variant="bodySmall" style={styles.hint}>
        {isPaused
          ? 'Tap play to resume'
          : 'Stay focused! Ending early won\'t earn points.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  presetButton: {
    minWidth: 60,
  },
  timerDisplay: {
    marginBottom: 32,
  },
  timerText: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  startButton: {
    minWidth: 200,
  },
  startButtonContent: {
    paddingVertical: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 32,
  },
  hint: {
    marginTop: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
