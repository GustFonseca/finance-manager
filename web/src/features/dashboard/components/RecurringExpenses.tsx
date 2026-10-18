import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { colors, fontSize, palette, radius, spacing } from '@/theme';
import { RecurringExpenseDto, RecurringKind } from '../types';

const KINDS: Record<RecurringKind, { label: string; icon: 'play-circle' | 'repeat'; color: string }> = {
  SUBSCRIPTION: { label: 'Assinatura', icon: 'play-circle', color: '#C62828' },
  FIXED: { label: 'Fixo', icon: 'repeat', color: palette.navy },
};

type Props = {
  items: RecurringExpenseDto[];
  showAccount: boolean;
};

export function RecurringExpenses({ items, showAccount }: Props) {
  const total = items.reduce((sum, item) => sum + item.monthlyCents, 0);

  return (
    <Card title="Custos fixos e assinaturas">
      {items.length === 0 ? (
        <Text style={styles.empty}>
          Nenhum custo fixo identificado ainda. Uma despesa aparece aqui quando se repete por dois
          meses com valor parecido, ou quando é marcada como recorrente.
        </Text>
      ) : (
        <>
          {items.map((item) => {
            const kind = KINDS[item.kind];
            return (
              <View key={`${item.accountId}:${item.name}`} style={styles.row}>
                <FontAwesome name={kind.icon} size={16} color={kind.color} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[item.categoryName, showAccount ? item.accountName : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={[styles.tag, { borderColor: kind.color, color: kind.color }]}>{kind.label}</Text>
                <MoneyText cents={-item.monthlyCents} tone="expense" style={styles.value} />
              </View>
            );
          })}
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Total por mês</Text>
            <MoneyText cents={-total} tone="expense" style={styles.totalValue} />
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
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
  tag: {
    fontSize: fontSize.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  value: { width: 110, textAlign: 'right', fontSize: fontSize.md, fontWeight: '700' },
  total: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline', gap: spacing.sm, paddingTop: spacing.sm },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
