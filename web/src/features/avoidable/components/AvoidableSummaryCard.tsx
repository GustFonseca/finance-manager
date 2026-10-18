import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, MoneyText } from '@/components/ui';
import { useWindowManager } from '@/components/xp';
import { PeriodFilter } from '@/features/transactions/types';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { useAvoidableSpending } from '../queries';

export function AvoidableSummaryCard({ filter }: { filter: PeriodFilter }) {
  const wm = useWindowManager();
  const { data } = useAvoidableSpending(filter);
  if (!data) return null;

  return (
    <Card title="Gastos evitáveis">
      <View style={styles.row}>
        <View style={styles.info}>
          <MoneyText cents={data.monthCents} tone="expense" style={styles.value} />
          <Text style={styles.detail}>
            em gastos supérfluos neste mês · {formatCents(data.yearProjectionCents)} em 12 meses no ritmo atual
          </Text>
        </View>
        <Button size="sm" label="Ver gastos evitáveis" onPress={() => wm.open('/avoidable')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, minWidth: 200 },
  value: { fontSize: fontSize.xl, fontWeight: '700' },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary },
});
