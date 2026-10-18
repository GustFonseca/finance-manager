import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, radius, spacing } from '@/theme';
import { CashFlowForecastDto, ForecastItemKind } from '../types';

const MAX_UPCOMING = 6;

const KINDS: Record<ForecastItemKind, { label: string; color: string }> = {
  INCOME: { label: 'Entrada', color: colors.income },
  BILL: { label: 'Conta fixa', color: '#1565C0' },
  INSTALLMENT: { label: 'Parcela', color: '#6A1B9A' },
};

const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

export function ForecastCard({ forecast }: { forecast: CashFlowForecastDto }) {
  if (!forecast.isCurrentMonth) return null;

  const negative = forecast.projectedBalanceCents < 0;
  const upcoming = forecast.upcoming.slice(0, MAX_UPCOMING);
  const next = forecast.nextIncome;

  return (
    <Card title="Previsão do mês">
      <View style={styles.head}>
        <View style={styles.info}>
          <Text style={styles.label}>Sobra prevista no fim do mês</Text>
          <MoneyText cents={forecast.projectedBalanceCents} tone={negative ? 'expense' : 'income'} style={styles.value} />
          <Text style={styles.detail}>
            Entradas previstas {formatCents(forecast.projectedIncomeCents)} · saídas previstas{' '}
            {formatCents(forecast.projectedExpenseCents)} · faltam {forecast.remainingDays}{' '}
            {forecast.remainingDays === 1 ? 'dia' : 'dias'}
          </Text>
        </View>
      </View>

      {negative ? (
        <View style={styles.warning}>
          <FontAwesome name="exclamation-triangle" size={14} color={colors.expense} />
          <Text style={styles.warningText}>
            No ritmo atual o mês fecha no vermelho. Segure os gastos do dia a dia até a próxima entrada.
          </Text>
        </View>
      ) : null}

      <Text style={styles.detail}>
        {next
          ? `Próxima entrada: ${next.name} em ${shortDay(next.expectedDate)} (${formatCents(next.amountCents)}).`
          : 'Nenhuma entrada prevista até o fim do mês.'}{' '}
        Inclui {formatCents(forecast.variableEstimateCents)} de gastos do dia a dia estimados pelo seu ritmo dos últimos meses.
      </Text>

      {upcoming.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.listTitle}>Próximos lançamentos</Text>
          {upcoming.map((item) => {
            const kind = KINDS[item.kind];
            return (
              <View key={`${item.kind}:${item.name}:${item.expectedDate}`} style={styles.row}>
                <Text style={styles.date}>{shortDay(item.expectedDate)}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.tag, { borderColor: kind.color, color: kind.color }]}>{kind.label}</Text>
                <MoneyText
                  cents={item.kind === 'INCOME' ? item.amountCents : -item.amountCents}
                  tone={item.kind === 'INCOME' ? 'income' : 'expense'}
                  style={styles.amount}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, minWidth: 200 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.xl, fontWeight: '700' },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.expense,
    borderRadius: radius.sm,
  },
  warningText: { flex: 1, fontSize: fontSize.sm, color: colors.expense },
  list: { marginTop: spacing.md },
  listTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  date: { width: 44, fontSize: fontSize.sm, color: colors.textSecondary },
  name: { flex: 1, minWidth: 0, fontSize: fontSize.md, color: colors.textPrimary },
  tag: { fontSize: fontSize.xs, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.xs },
  amount: { width: 110, textAlign: 'right', fontSize: fontSize.md, fontWeight: '700' },
});
