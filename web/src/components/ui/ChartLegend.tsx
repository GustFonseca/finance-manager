import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

export type LegendItem = { label: string; color: string; value?: string };

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
          {item.value ? <Text style={styles.value}>{item.value}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginVertical: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
  value: { fontSize: fontSize.sm, color: colors.textSecondary },
});
