import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { SeasonalExpensesDto } from '../types';

const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export function monthsLeftText(months: number): string {
  if (months <= 0) return 'vence este mês';
  return months === 1 ? 'falta 1 mês' : `faltam ${months} meses`;
}

export function SeasonalCard({ seasonal }: { seasonal: SeasonalExpensesDto }) {
  return (
    <Card title="Contas sazonais">
      {seasonal.items.length === 0 ? (
        <Text style={styles.empty}>
          Nenhuma conta anual encontrada nos últimos meses (IPVA, IPTU, seguros, matrícula...).
        </Text>
      ) : (
        <>
          {seasonal.items.map((item) => (
            <View key={`${item.label}-${item.name}`} style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>
                  {item.label} · {item.name}
                </Text>
                <Text style={styles.meta}>
                  Próxima em {day(item.nextDate)} ({monthsLeftText(item.monthsLeft)}) · última de{' '}
                  {formatCents(item.lastCents)} em {day(item.lastDate)}
                </Text>
              </View>
              <Text style={styles.value}>{formatCents(item.monthlyReserveCents)}/mês</Text>
            </View>
          ))}
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Guarde por mês para pagar tudo sem aperto:</Text>
            <MoneyText cents={seasonal.monthlyReserveCents} tone="neutral" style={styles.totalValue} />
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  value: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  total: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
