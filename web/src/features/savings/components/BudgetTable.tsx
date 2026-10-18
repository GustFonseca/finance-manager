import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListItem, MoneyText, ProgressBar } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { CategoryBudgetDto } from '../types';

type Props = {
  budgets: CategoryBudgetDto[];
  onEdit: (budget: CategoryBudgetDto) => void;
};

export function BudgetTable({ budgets, onEdit }: Props) {
  return (
    <View>
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.colName, styles.th]}>Categoria</Text>
        <Text style={[styles.colValue, styles.th]}>Gasto no mês</Text>
        <Text style={[styles.colValue, styles.th]}>Limite</Text>
        <Text style={[styles.colValue, styles.th]}>Média</Text>
        <Text style={[styles.colValue, styles.th]}>Sugerido</Text>
      </View>
      {budgets.map((budget) => {
        const used = budget.limitCents ? budget.spentCents / budget.limitCents : null;
        return (
          <ListItem key={budget.categoryId} onPress={() => onEdit(budget)} style={styles.item}>
            <View style={styles.row}>
              <View style={[styles.colName, styles.nameCell]}>
                <View style={[styles.swatch, { backgroundColor: budget.color }]} />
                <Text style={styles.td} numberOfLines={1}>
                  {budget.categoryName}
                </Text>
                {budget.essential ? <Text style={styles.essential}>essencial</Text> : null}
              </View>
              <MoneyText cents={budget.spentCents} tone="neutral" style={[styles.colValue, styles.td]} />
              <Text style={[styles.colValue, styles.td, !budget.limitCents && styles.muted]}>
                {budget.limitCents ? formatCents(budget.limitCents) : 'definir…'}
              </Text>
              <MoneyText cents={budget.averageCents} tone="neutral" style={[styles.colValue, styles.td]} />
              <MoneyText cents={budget.suggestedLimitCents} tone="neutral" style={[styles.colValue, styles.suggested]} />
            </View>
            {used !== null ? (
              <View style={styles.progress}>
                <View style={styles.bar}>
                  <ProgressBar percent={used * 100} height={12} />
                </View>
                <Text style={[styles.usage, used > 1 && styles.over]}>
                  {used > 1 ? `Estourado em ${formatCents(budget.spentCents - budget.limitCents!)}` : `${Math.round(used * 100)}% usado`}
                </Text>
              </View>
            ) : null}
          </ListItem>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.surfaceLight, paddingVertical: 4, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  item: { flexDirection: 'column', alignItems: 'stretch', gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  td: { fontSize: fontSize.sm, color: colors.textPrimary },
  muted: { color: colors.link, textDecorationLine: 'underline' },
  suggested: { fontSize: fontSize.sm, color: colors.income, fontWeight: '700' },
  colName: { flex: 1, minWidth: 0 },
  colValue: { width: 100, textAlign: 'right' },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 12, height: 12, borderWidth: 1, borderColor: '#808080' },
  essential: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { flex: 1 },
  usage: { width: 180, fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'right' },
  over: { color: colors.expense, fontWeight: '700' },
});
