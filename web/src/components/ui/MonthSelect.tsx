import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';
import { MonthKey, monthKeyOf, monthLabel } from '@/lib/periods';
import { Select } from './Select';

const MONTHS_SHOWN = 12;

type Props = {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
};

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
