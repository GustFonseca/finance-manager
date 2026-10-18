import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ProgressBar } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { BudgetStatusDto } from '../types';

export function BudgetAlerts({ budgets }: { budgets: BudgetStatusDto[] }) {
  const alerts = budgets.filter((b) => b.level !== 'OK');
  if (alerts.length === 0) return null;

  return (
    <Card title="Alertas de orçamento">
      {alerts.map((b) => {
        const exceeded = b.level === 'EXCEEDED';
        const percent = Math.round(b.percent * 100);
        return (
          <View key={b.categoryId} style={styles.row}>
            <FontAwesome name={exceeded ? 'times-circle' : 'exclamation-circle'} size={16} color={exceeded ? colors.expense : '#EF6C00'} />
            <View style={styles.info}>
              <Text style={styles.name}>
                {b.categoryName}: {formatCents(b.spentCents)} de {formatCents(b.limitCents)} ({percent}%)
              </Text>
              <Text style={styles.meta}>
                {exceeded
                  ? `Limite estourado em ${formatCents(b.spentCents - b.limitCents)}. Evite novos gastos nesta categoria até o fim do mês.`
                  : `Chegando no limite: dá para gastar ${formatCents(b.perDayLeftCents)} por dia até o fim do mês.`}
              </Text>
              <ProgressBar percent={Math.min(100, percent)} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary },
});
