import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';
import { Select } from './Select';

/** How many months, counting the current one, the filter offers. */
const MONTHS_SHOWN = 12;

/** A month as "yyyy-mm" (local time), e.g. "2026-03". */
export type MonthKey = string;

export function monthKeyOf(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function firstDayOf(key: MonthKey): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/** The month from its local first day until its end, or until now for the current month. */
export function monthRange(key: MonthKey): { start: string; end: string } {
  const start = firstDayOf(key);
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, -1);
  const now = new Date();
  return { start: start.toISOString(), end: (monthEnd < now ? monthEnd : now).toISOString() };
}

/** "março de 2026". */
export function monthLabel(key: MonthKey): string {
  return firstDayOf(key).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function isCurrentMonth(key: MonthKey): boolean {
  return key === monthKeyOf(new Date());
}

type Props = {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
};

/** "Mês: outubro de 2026 / setembro de 2026 / …" filter shown above dashboards. */
export function MonthSelect({ value, onChange }: Props) {
  const now = new Date();
  const options = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const key = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - i, 1));
    return { id: key, label: monthLabel(key) };
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Mês:</Text>
      <Select compact options={options} selectedId={value} onSelect={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
});
