import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ChartLegend, ColumnChart } from '@/components/ui';
import { shortMonthOf } from '@/lib/periods';
import { formatCents, formatCentsCompact } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { SPENDING_CLASSES } from '../classes';
import { MonthSpendingDto } from '../types';

const VALUES: Record<string, keyof MonthSpendingDto> = {
  ESSENTIAL: 'essentialCents',
  VARIABLE: 'variableCents',
  SUPERFLUOUS: 'superfluousCents',
};

export function MonthlyTrend({ months }: { months: MonthSpendingDto[] }) {
  const [asTable, setAsTable] = useState(false);
  const value = (m: MonthSpendingDto, c: string) => m[VALUES[c]] as number;
  const total = (m: MonthSpendingDto) => SPENDING_CLASSES.reduce((sum, c) => sum + value(m, c.class), 0);

  return (
    <View>
      <View style={styles.header}>
        <ChartLegend items={SPENDING_CLASSES.map((c) => ({ label: c.label, color: c.color }))} />
        <Button
          size="sm"
          variant="secondary"
          label={asTable ? 'Ver gráfico' : 'Ver como tabela'}
          onPress={() => setAsTable((v) => !v)}
        />
      </View>

      {asTable ? (
        <View>
          <View style={[styles.tr, styles.thRow]}>
            <Text style={[styles.month, styles.th]}>Mês</Text>
            {SPENDING_CLASSES.map((c) => (
              <Text key={c.class} style={[styles.cell, styles.th]}>
                {c.label}
              </Text>
            ))}
            <Text style={[styles.cell, styles.th]}>Total</Text>
          </View>
          {months.map((m) => (
            <View key={m.monthStart} style={styles.tr}>
              <Text style={[styles.month, styles.td]}>{shortMonthOf(m.monthStart)}</Text>
              {SPENDING_CLASSES.map((c) => (
                <Text key={c.class} style={[styles.cell, styles.td]}>
                  {formatCents(value(m, c.class))}
                </Text>
              ))}
              <Text style={[styles.cell, styles.td, styles.bold]}>{formatCents(total(m))}</Text>
            </View>
          ))}
        </View>
      ) : (
        <ColumnChart
          formatValue={(v) => formatCentsCompact(v)}
          columns={months.map((m) => ({
            key: m.monthStart,
            label: shortMonthOf(m.monthStart),
            segments: SPENDING_CLASSES.map((c) => ({ key: c.class, value: value(m, c.class), color: c.color })),
            details: [
              ...SPENDING_CLASSES.map((c) => `${c.label}: ${formatCents(value(m, c.class))}`),
              `Total: ${formatCents(total(m))}`,
            ],
          }))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tr: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: colors.divider },
  thRow: { backgroundColor: colors.surfaceLight },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  td: { fontSize: fontSize.sm, color: colors.textPrimary },
  bold: { fontWeight: '700' },
  month: { width: 60, paddingLeft: spacing.xs },
  cell: { flex: 1, textAlign: 'right', paddingRight: spacing.xs },
});
