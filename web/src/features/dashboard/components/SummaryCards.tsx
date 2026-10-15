import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { FinancialSummaryDto } from '../types';

export function SummaryCards({ summary }: { summary: FinancialSummaryDto }) {
  return (
    <View style={styles.container}>
      <Card style={styles.balanceCard}>
        <Text style={styles.label}>Saldo do mês</Text>
        <MoneyText cents={summary.balanceCents} signed style={styles.balanceValue} />
      </Card>
      <View style={styles.row}>
        <Card style={styles.halfCard}>
          <Text style={styles.label}>Receitas</Text>
          <MoneyText cents={summary.totalIncomeCents} tone="income" style={styles.value} />
        </Card>
        <Card style={styles.halfCard}>
          <Text style={styles.label}>Despesas</Text>
          <MoneyText cents={summary.totalExpenseCents} tone="expense" style={styles.value} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg },
  balanceCard: { alignItems: 'center', marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfCard: { flex: 1 },
  label: { fontSize: fontSize.xs + 1, color: colors.textSecondary, marginBottom: spacing.xs },
  balanceValue: { fontSize: fontSize.xxl, fontWeight: '700' },
  value: { fontSize: fontSize.lg, fontWeight: '600' },
});
