import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

type Props = {
  label: string;
  value: string;
  onChange: (day: string) => void;
  max?: string;
};

export function DateInput({ label, value, onChange, max }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="date"
        aria-label={label}
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </View>
  );
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${colors.inputBorder}`,
  backgroundColor: colors.surface,
  padding: '3px 4px',
  fontSize: fontSize.sm,
  color: colors.textPrimary,
  borderRadius: 0,
  fontFamily: 'inherit',
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
});
