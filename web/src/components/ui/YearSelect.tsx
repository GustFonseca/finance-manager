import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';
import { Select } from './Select';

const YEARS_SHOWN = 5;

type Props = {
  value: number;
  onChange: (year: number) => void;
};

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
