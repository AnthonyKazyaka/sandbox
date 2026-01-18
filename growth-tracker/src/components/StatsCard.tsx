// Stats Card Component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';

interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

interface StatsCardProps {
  title?: string;
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  columns = 2,
}) => {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <Card.Content>
        {title && (
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        )}
        <View style={[styles.grid, { gap: 16 }]}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[styles.statItem, { width: `${100 / columns - 4}%` }]}
            >
              <Text
                variant="headlineMedium"
                style={[styles.value, stat.color ? { color: stat.color } : null]}
              >
                {stat.value}
              </Text>
              <Text
                variant="labelSmall"
                style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
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
  title: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  label: {
    textAlign: 'center',
    marginTop: 4,
  },
});
