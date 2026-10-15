import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, fontSize } from '@/theme';

export function EmptyState({ message }: { message: string }) {
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl + spacing.lg,
    fontStyle: 'italic',
    fontSize: fontSize.sm,
  },
});
