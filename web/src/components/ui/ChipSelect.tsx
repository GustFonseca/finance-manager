import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '@/theme';

export type ChipItem = {
  id: string;
  label: string;
  /** Optional accent used for the dot and active background. */
  color?: string;
};

type Props = {
  items: ChipItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Horizontal, scrollable single-select chips (accounts, categories…). */
export function ChipSelect({ items, selectedId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {items.map((item) => {
        const active = selectedId === item.id;
        const accent = item.color ?? colors.primary;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={[
              styles.chip,
              { borderColor: accent },
              active && { backgroundColor: accent },
            ]}>
            {item.color ? <View style={[styles.dot, { backgroundColor: item.color }]} /> : null}
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 0, marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    gap: spacing.xs + 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
  labelActive: { color: colors.textOnAccent, fontWeight: '600' },
});
