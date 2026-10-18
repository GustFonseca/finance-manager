import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { longMonthOf } from '@/lib/periods';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { InstallmentsDto } from '../types';

export function Installments({ installments }: { installments: InstallmentsDto }) {
  if (installments.items.length === 0) return null;

  return (
    <Card title="Parcelamentos">
      {installments.items.map((item) => (
        <View key={`${item.key}:${item.total}:${item.amountCents}`} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.paid} de {item.total} pagas · termina em {longMonthOf(item.endsOn)} · falta{' '}
              {formatCents(item.remainingCents)}
            </Text>
          </View>
          <MoneyText cents={-item.amountCents} tone="expense" style={styles.value} />
        </View>
      ))}
      <View style={styles.total}>
        <Text style={styles.totalLabel}>
          Comprometido por mês · falta pagar {formatCents(installments.remainingCents)}
        </Text>
        <MoneyText cents={-installments.monthlyCents} tone="expense" style={styles.totalValue} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  value: { width: 110, textAlign: 'right', fontSize: fontSize.md, fontWeight: '700' },
  total: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline', gap: spacing.sm, paddingTop: spacing.sm },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
