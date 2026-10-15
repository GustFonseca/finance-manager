import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { fontSize, spacing } from '@/theme';
import { FinancialSummaryDto } from '../types';

export function SummaryCards({ summary }: { summary: FinancialSummaryDto }) {
  return (
    <View style={styles.row}>
      <Card title="Saldo do mês" style={styles.card}>
        <MoneyText cents={summary.balanceCents} signed style={styles.value} />
      </Card>
      <Card title="Receitas" style={styles.card}>
        <MoneyText cents={summary.totalIncomeCents} tone="income" style={styles.value} />
      </Card>
      <Card title="Despesas" style={styles.card}>
        <MoneyText cents={summary.totalExpenseCents} tone="expense" style={styles.value} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, flexBasis: 160 },
  value: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
});
