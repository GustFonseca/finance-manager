import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '@/lib/http';
import { colors, fontSize, spacing } from '@/theme';
import { Button } from './Button';

type Props = {
  error: unknown;
  fallback: string;
  onRetry: () => void;
};

export function ErrorState({ error, fallback, onRetry }: Props) {
  return (
    <View style={styles.box}>
      <FontAwesome name="exclamation-triangle" size={28} color={colors.expense} />
      <Text style={styles.message}>{getErrorMessage(error, fallback)}</Text>
      <Button label="Tentar de novo" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  message: { fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'center' },
});
