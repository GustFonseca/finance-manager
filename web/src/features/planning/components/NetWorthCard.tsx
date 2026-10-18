import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ColumnChart, MoneyText, StatTile } from '@/components/ui';
import { formatCents, formatCentsCompact } from '@/lib/money';
import { longMonthOf, shortMonthOf } from '@/lib/periods';
import { chart, colors, fontSize, spacing } from '@/theme';
import { NetWorthDto } from '../types';

export function NetWorthCard({ netWorth }: { netWorth: NetWorthDto }) {
  const columns = netWorth.history.map((point) => ({
    key: point.month,
    label: shortMonthOf(point.month),
    segments: [{ key: 'assets', value: Math.max(0, point.assetsCents), color: chart.essential }],
    details: [`${longMonthOf(point.month)}: ${formatCents(point.assetsCents)} em contas`],
  }));

  return (
    <Card title="Patrimônio líquido">
      <View style={styles.tiles}>
        <StatTile
          label="Em contas"
          value={<MoneyText cents={netWorth.assetsCents} tone="income" style={styles.tileValue} />}
        />
        <StatTile
          label="Dívidas"
          value={<MoneyText cents={-netWorth.debtsCents} tone="expense" style={styles.tileValue} />}
        />
        <StatTile
          label="Líquido"
          value={<MoneyText cents={netWorth.netCents} style={styles.tileValue} />}
          detail="o que sobra se pagar todas as dívidas"
        />
      </View>
      {netWorth.accounts.map((account, index) => (
        <View key={`${index}-${account.name}`} style={styles.row}>
          <Text style={styles.name}>{account.name}</Text>
          <MoneyText cents={account.balanceCents} style={styles.value} />
        </View>
      ))}
      {columns.length > 0 ? (
        <>
          <Text style={styles.chartTitle}>Saldo em contas nos últimos 12 meses</Text>
          <ColumnChart columns={columns} formatValue={formatCentsCompact} />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
  tileValue: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  value: { fontSize: fontSize.md, fontWeight: '700' },
  chartTitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
});
