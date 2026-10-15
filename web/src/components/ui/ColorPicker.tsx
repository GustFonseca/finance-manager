import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize } from '@/theme';

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
            style={[styles.swatch, { backgroundColor: color }, value === color && styles.selected]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  selected: { borderWidth: 3, borderColor: colors.textPrimary },
});
