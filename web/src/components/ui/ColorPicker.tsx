import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize, webStyle } from '@/theme';

export const CATEGORY_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#00BCD4',
  '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#607D8B',
];

type Props = {
  value: string;
  onChange: (color: string) => void;
  options?: string[];
  label?: string;
};

/** Swatch grid in the style of the XP "Cor" dialog. */
export function ColorPicker({ value, onChange, options = CATEGORY_COLORS, label }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((color) => (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityLabel={`Cor ${color}`}
            style={[styles.cell, value === color && styles.selected]}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cell: {
    padding: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    ...webStyle({ cursor: 'pointer' }),
  },
  selected: { borderColor: colors.textPrimary, borderStyle: 'dotted' },
  swatch: { width: 20, height: 16, borderWidth: 1, borderColor: '#808080' },
});
