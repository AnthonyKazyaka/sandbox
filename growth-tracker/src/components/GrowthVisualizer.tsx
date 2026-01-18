// Plant Growth Visualizer Component
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PlantStage, GrowthState } from '../models/types';
import {
  getPlantEmoji,
  getStageName,
  getStageColor,
  getStageProgress,
} from '../utils/growthUtils';
import { ProgressRing } from './ProgressRing';

interface GrowthVisualizerProps {
  growth: GrowthState;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showLabel?: boolean;
  animate?: boolean;
}

const sizeConfig = {
  small: { container: 60, emoji: 28, ring: 56, strokeWidth: 4 },
  medium: { container: 100, emoji: 44, ring: 96, strokeWidth: 6 },
  large: { container: 160, emoji: 72, ring: 150, strokeWidth: 8 },
};

export const GrowthVisualizer: React.FC<GrowthVisualizerProps> = ({
  growth,
  size = 'medium',
  showProgress = true,
  showLabel = false,
  animate = true,
}) => {
  const theme = useTheme();
  const config = sizeConfig[size];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastWateredRef = useRef(growth.lastWateredAt);

  const { progressPercentage, pointsToNextStage, nextStage } = getStageProgress(growth);
  const plantEmoji = getPlantEmoji(growth.stage);
  const stageColor = getStageColor(growth.stage);

  // Animate when plant is watered
  useEffect(() => {
    if (animate && growth.lastWateredAt && growth.lastWateredAt !== lastWateredRef.current) {
      lastWateredRef.current = growth.lastWateredAt;
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [growth.lastWateredAt, animate, scaleAnim]);

  return (
    <View style={[styles.container, { width: config.container }]}>
      {showProgress ? (
        <ProgressRing
          progress={progressPercentage}
          size={config.ring}
          strokeWidth={config.strokeWidth}
          color={stageColor}
        >
          <Animated.Text
            style={[
              styles.emoji,
              { fontSize: config.emoji, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {plantEmoji}
          </Animated.Text>
        </ProgressRing>
      ) : (
        <Animated.Text
          style={[
            styles.emoji,
            { fontSize: config.emoji, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {plantEmoji}
        </Animated.Text>
      )}
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text variant="labelMedium" style={{ color: stageColor }}>
            {getStageName(growth.stage)}
          </Text>
          {nextStage && (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {pointsToNextStage} pts to {getStageName(nextStage)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  labelContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
});
