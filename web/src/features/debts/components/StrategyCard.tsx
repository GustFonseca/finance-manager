import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';
import { DebtStrategy } from '../types';

type Props = {
  title: string;
  description: string;
  strategy: DebtStrategy;
};

export function monthsText(months: number): string {
  return months === 1 ? '1 mês' : `${months} meses`;
}

export function StrategyCard({ title, description, strategy }: Props) {
  return (
    <Card title={title} style={styles.card}>
      <Text style={styles.description}>{description}</Text>
      {strategy.feasible ? (
        <>
          <View style={styles.line}>
            <Text style={styles.label}>Quitado em</Text>
            <Text style={styles.value}>{monthsText(strategy.months)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Juros totais</Text>
            <MoneyText cents={strategy.totalInterestCents} tone="expense" style={styles.value} />
          </View>
          <Text style={styles.orderTitle}>Ordem de quitação:</Text>
          {strategy.order.map((step, index) => (
            <Text key={step.debtId} style={styles.step}>
              {index + 1}. {step.name} — quitada no mês {step.paidOffInMonth}
            </Text>
          ))}
        </>
      ) : (
        <Text style={styles.infeasible}>
          Com esse valor por mês a dívida não acaba: os juros crescem mais rápido do que os pagamentos. Aumente o extra
          por mês.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 240 },
  description: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 2 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  orderTitle: { fontSize: fontSize.sm, color: colors.textPrimary, marginTop: spacing.sm, marginBottom: 2 },
  step: { fontSize: fontSize.sm, color: colors.textPrimary },
  infeasible: { fontSize: fontSize.sm, color: colors.expense },
});
