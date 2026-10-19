import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fontSize, spacing } from '@/theme';

export type SelectOption = {
  id: string;
  label: string;
};

type Props = {
  options: SelectOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label?: string;
  compact?: boolean;
  placeholder?: string;
};

export function Select({ options, selectedId, onSelect, label, compact, placeholder }: Props) {
  return (
    <View style={compact ? undefined : styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <select
        value={selectedId ?? ''}
        onChange={(event) => onSelect(event.target.value)}
        style={compact ? compactStyle : selectStyle}>
        {placeholder !== undefined && !options.some((option) => option.id === selectedId) ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </View>
  );
}

const selectStyle: React.CSSProperties = {
  border: 'none',
  boxShadow: bevels.field,
  backgroundColor: colors.surface,
  padding: '4px 5px',
  fontSize: fontSize.sm,
  color: colors.textPrimary,
  borderRadius: 0,
};

const compactStyle: React.CSSProperties = { ...selectStyle, padding: '2px 3px', maxWidth: 150 };

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
});
