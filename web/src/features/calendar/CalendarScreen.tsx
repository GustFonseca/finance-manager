import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChartLegend, ErrorState, MoneyText, MonthSelect } from '@/components/ui';
import { Window } from '@/components/xp';
import { isCurrentMonth, monthKeyOf, monthLabel, monthRange } from '@/lib/periods';
import { colors, fontSize, spacing } from '@/theme';
import { DayCell } from './components/DayCell';
import { DayDetail } from './components/DayDetail';
import { buildGrid, WEEKDAYS } from './grid';
import { useCalendar } from './queries';
import { CalendarDayDto, CalendarItemKind, KIND_COLORS, KIND_LABELS } from './types';

const LEGEND = (Object.keys(KIND_LABELS) as CalendarItemKind[]).map((kind) => ({
  label: KIND_LABELS[kind],
  color: KIND_COLORS[kind],
}));

export function CalendarScreen() {
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));
  const month = useMemo(() => monthRange(monthKey), [monthKey]);
  const { data, error, isFetching, refetch } = useCalendar(month);
  const [openDay, setOpenDay] = useState<CalendarDayDto | null>(null);

  const days = data?.days ?? [];
  const cells = buildGrid(monthKey, days);
  const todayNumber = isCurrentMonth(monthKey) ? new Date().getDate() : null;
  const totals = days.reduce(
    (sum, d) => ({ income: sum.income + d.incomeCents, expense: sum.expense + d.expenseCents }),
    { income: 0, expense: 0 }
  );

  return (
    <>
      <Window
        title="Calendário"
        icon="calendar"
        onRefresh={refetch}
        status={isFetching ? 'Atualizando...' : `Calendário de ${monthLabel(monthKey)}`}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
          <View style={styles.header}>
            <View style={styles.totals}>
              <Text style={styles.total}>Recebido </Text>
              <MoneyText cents={totals.income} tone="income" style={styles.value} />
              <Text style={styles.total}> · Gasto </Text>
              <MoneyText cents={totals.expense} tone="expense" style={styles.value} />
            </View>
            <MonthSelect value={monthKey} onChange={setMonthKey} />
          </View>

          {error ? (
            <ErrorState error={error} fallback="Não foi possível carregar o calendário" onRetry={refetch} />
          ) : (
            <>
              <View style={styles.grid}>
                {WEEKDAYS.map((weekday) => (
                  <Text key={weekday} style={styles.weekday}>
                    {weekday}
                  </Text>
                ))}
                {cells.map((cell, index) => (
                  <DayCell
                    key={cell ? `day-${cell.day}` : `blank-${index}`}
                    cell={cell}
                    today={cell?.day === todayNumber}
                    onOpen={setOpenDay}
                  />
                ))}
              </View>
              <ChartLegend items={LEGEND} />
            </>
          )}
        </ScrollView>
      </Window>

      <DayDetail day={openDay} onClose={() => setOpenDay(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  totals: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  total: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.sm, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    paddingVertical: spacing.xs,
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.surfaceLight,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
});
