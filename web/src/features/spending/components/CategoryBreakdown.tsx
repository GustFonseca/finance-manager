import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarTrack, ChartLegend } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { classInfo, SPENDING_CLASSES } from '../classes';
import { CategorySpendingDto } from '../types';

export function CategoryBreakdown({ categories }: { categories: CategorySpendingDto[] }) {
  if (categories.length === 0) {
    return <Text style={styles.empty}>Nenhuma despesa neste mês.</Text>;
  }
  const max = Math.max(1, ...categories.map((c) => c.cents));

  return (
    <View>
      <ChartLegend items={SPENDING_CLASSES.map((c) => ({ label: c.label, color: c.color }))} />
      {categories.map((category) => (
        <View key={category.categoryId} style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {category.categoryName}
          </Text>
          <View style={styles.bar}>
            <BarTrack ratio={category.cents / max} color={classInfo(category.class).color} />
          </View>
          <View style={styles.figures}>
            <Text style={styles.value}>
              {formatCents(category.cents)} · {Math.round(category.share * 100)}%
            </Text>
            <Text style={styles.average}>
              {category.averageCents > 0 ? `média ${formatCents(category.averageCents)}` : 'sem média'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 5 },
  name: { width: 100, fontSize: fontSize.sm, color: colors.textPrimary },
  bar: { flex: 1, minWidth: 60 },
  figures: { width: 150, alignItems: 'flex-end' },
  value: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  average: { fontSize: fontSize.xs, color: colors.textSecondary },
});
