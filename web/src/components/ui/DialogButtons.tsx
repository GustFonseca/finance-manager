import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button } from './Button';

type Props = {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  destructive?: boolean;
};

export function DialogButtons({
  confirmLabel = 'OK',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading,
  destructive,
}: Props) {
  return (
    <View style={styles.row}>
      <Button
        label={confirmLabel}
        variant={destructive ? 'danger' : 'primary'}
        onPress={onConfirm}
        loading={loading}
      />
      <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
