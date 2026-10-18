import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';
import { Select } from './Select';

/** How many years, counting the current one, the filter offers. */
const YEARS_SHOWN = 5;

/** The year from its local first day until its end, or until now for the current year. */
export function yearRange(year: number): { start: string; end: string } {
  const start = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1, 0, 0, 0, -1);
  const now = new Date();
  return { start: start.toISOString(), end: (yearEnd < now ? yearEnd : now).toISOString() };
}

type Props = {
  value: number;
  onChange: (year: number) => void;
};

/** "Ano: 2026 / 2025 / …" filter shown above dashboards. */
export function YearSelect({ value, onChange }: Props) {
  const current = new Date().getFullYear();
  const options = Array.from({ length: YEARS_SHOWN }, (_, i) => ({ id: String(current - i), label: String(current - i) }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Ano:</Text>
      <Select compact options={options} selectedId={String(value)} onSelect={(id) => onChange(Number(id))} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
});
