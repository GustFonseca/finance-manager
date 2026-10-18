import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.row} accessibilityRole="alert">
      <FontAwesome name="exclamation-circle" size={14} color={colors.expense} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  text: { fontSize: fontSize.sm, color: colors.expense, flex: 1 },
});
