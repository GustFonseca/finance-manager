import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

export type SelectOption = {
  id: string;
  label: string;
};

type Props = {
  options: SelectOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label?: string;
};

/**
 * XP drop-down list. The app is web-only, so this renders a native
 * `<select>`, which the browser draws much like the XP combo box.
 */
export function Select({ options, selectedId, onSelect, label }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <select
        value={selectedId ?? ''}
        onChange={(event) => onSelect(event.target.value)}
        style={selectStyle}>
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
  border: `1px solid ${colors.inputBorder}`,
  backgroundColor: colors.surface,
  padding: '3px 4px',
  fontSize: fontSize.sm,
  color: colors.textPrimary,
  borderRadius: 0,
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
});
