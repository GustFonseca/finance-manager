import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fontSize, palette, spacing, webStyle } from '@/theme';

export type RadioOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function RadioGroup<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            aria-checked={checked}
            style={styles.option}>
            <View style={styles.circle}>{checked ? <View style={styles.dot} /> : null}</View>
            <Text style={styles.label}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    ...webStyle({ cursor: 'pointer' }),
  },
  circle: {
    width: 10,
    height: 10,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
    ...webStyle({ boxShadow: bevels.radio }),
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: palette.teal,
    ...webStyle({ boxShadow: bevels.radioDot }),
  },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
});
