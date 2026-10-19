import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fontSize, spacing, webStyle } from '@/theme';

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
    paddingTop: spacing.md + 4,
    backgroundColor: colors.surface,
    gap: 2,
    ...webStyle({ boxShadow: bevels.tile }),
  },
  label: { fontSize: fontSize.xs, color: colors.heading, fontWeight: '700' },
  value: { fontSize: fontSize.xxl - 2, fontWeight: '700', color: colors.textPrimary },
  detail: { fontSize: fontSize.xs, color: colors.textSecondary },
});
