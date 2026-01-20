// Settings Screen
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share, Platform } from 'react-native';
import {
  Appbar,
  useTheme,
  Text,
  List,
  Switch,
  Divider,
  Button,
  Card,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../context/AppContext';
import { importExportService } from '../storage';
import { ConfirmModal } from '../components';
import { RootStackParamList } from '../navigation/types';

type SettingsNavProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<SettingsNavProp>();
  const { state, updateSettings, refreshData } = useApp();

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await importExportService.exportAll();
      const jsonString = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(jsonString);
        Alert.alert('Exported', 'Data has been copied to clipboard!');
      } else {
        await Share.share({
          message: jsonString,
          title: 'Growth Tracker Export',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (!clipboardContent) {
        Alert.alert('Error', 'Clipboard is empty. Copy your export data first.');
        return;
      }

      const data = JSON.parse(clipboardContent);
      
      Alert.alert(
        'Import Data',
        `This will replace all existing data with ${data.goals?.length ?? 0} goals. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              await importExportService.importAll(data);
              await refreshData();
              Alert.alert('Success', 'Data imported successfully!');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Error', 'Failed to import data. Make sure you have valid JSON in your clipboard.');
    } finally {
      setIsImporting(false);
    }
  }, [refreshData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Appearance
            </Text>
            <Text variant="labelMedium" style={{ marginBottom: 12 }}>
              Theme
            </Text>
            <SegmentedButtons
              value={state.settings.theme}
              onValueChange={(value) =>
                updateSettings({ theme: value as 'light' | 'dark' | 'system' })
              }
              buttons={[
                { value: 'light', label: '☀️ Light' },
                { value: 'dark', label: '🌙 Dark' },
                { value: 'system', label: '📱 System' },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Preferences
            </Text>
            <List.Item
              title="Haptic Feedback"
              description="Vibrate on interactions"
              right={() => (
                <Switch
                  value={state.settings.hapticFeedback}
                  onValueChange={(value) => updateSettings({ hapticFeedback: value })}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Notifications"
              description="Reminders and alerts"
              right={() => (
                <Switch
                  value={state.settings.notificationsEnabled}
                  onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Time Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Time Settings
            </Text>
            <Text variant="labelMedium" style={{ marginBottom: 12 }}>
              Week Starts On
            </Text>
            <SegmentedButtons
              value={state.settings.weekStart}
              onValueChange={(value) =>
                updateSettings({ weekStart: value as 'monday' | 'sunday' })
              }
              buttons={[
                { value: 'monday', label: 'Monday' },
                { value: 'sunday', label: 'Sunday' },
              ]}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Affects weekly counter goal resets
            </Text>
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Data Management
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              Export your data as JSON or import from a backup.
            </Text>
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleExport}
                loading={isExporting}
                icon="export"
                style={styles.dataButton}
              >
                Export
              </Button>
              <Button
                mode="outlined"
                onPress={handleImport}
                loading={isImporting}
                icon="import"
                style={styles.dataButton}
              >
                Import
              </Button>
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              To import: Copy your JSON data to clipboard, then tap Import.
            </Text>
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              About
            </Text>
            <List.Item
              title="Growth Tracker"
              description="Version 1.0.0"
              left={(props) => <Text style={styles.emoji}>🌱</Text>}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Track your personal goals as growing plants. Built with React Native + Expo.
            </Text>
          </Card.Content>
        </Card>

        {/* Widgets (Android only) */}
        {Platform.OS === 'android' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Home Screen Widgets
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                Add widgets to your home screen to track goals at a glance.
              </Text>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('WidgetPreview')}
                icon="widgets"
              >
                Preview Widgets
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Statistics
            </Text>
            <List.Item
              title="Total Goals"
              right={() => <Text variant="bodyLarge">{state.goals.length}</Text>}
            />
            <Divider />
            <List.Item
              title="Streak Goals"
              right={() => (
                <Text variant="bodyLarge">
                  {state.goals.filter((g) => g.type === 'streak').length}
                </Text>
              )}
            />
            <Divider />
            <List.Item
              title="Focus Goals"
              right={() => (
                <Text variant="bodyLarge">
                  {state.goals.filter((g) => g.type === 'focus').length}
                </Text>
              )}
            />
            <Divider />
            <List.Item
              title="Counter Goals"
              right={() => (
                <Text variant="bodyLarge">
                  {state.goals.filter((g) => g.type === 'counter').length}
                </Text>
              )}
            />
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardTitle: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dataButton: {
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
