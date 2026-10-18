import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: React.ReactNode;
  detail?: string;
};

export function StatTile({ label, value, detail }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      {typeof value === 'string' ? <Text style={styles.value}>{value}</Text> : value}
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 160,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D0D0BF',
    borderRadius: radius.sm,
    gap: 2,
  },
  label: { fontSize: fontSize.xs, color: colors.textSecondary },
  value: { fontSize: fontSize.xxl - 2, fontWeight: '700', color: colors.textPrimary },
  detail: { fontSize: fontSize.xs, color: colors.textSecondary },
});
