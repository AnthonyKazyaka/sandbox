// Confirmation Modal Component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, Text, Button, useTheme } from 'react-native-paper';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  const theme = useTheme();
  const buttonColor = confirmColor ?? (destructive ? theme.colors.error : theme.colors.primary);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
        <View style={styles.buttonContainer}>
          <Button mode="text" onPress={onCancel} style={styles.button}>
            {cancelText}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            style={styles.button}
            buttonColor={buttonColor}
          >
            {confirmText}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  title: {
    marginBottom: 12,
  },
  message: {
    marginBottom: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 80,
  },
});
