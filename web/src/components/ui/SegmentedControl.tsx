import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export type Segment<T extends string> = {
  value: T;
  label: string;
  /** Background applied when the segment is active. Defaults to primary. */
  activeColor?: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {segments.map((segment) => {
        const active = segment.value === value;
        const activeColor = segment.activeColor ?? colors.primary;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            style={[
              styles.segment,
              active && { backgroundColor: activeColor, borderColor: activeColor },
            ]}>
            <Text style={[styles.label, active && styles.labelActive]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  label: { fontWeight: '600', color: colors.textPrimary },
  labelActive: { color: colors.textOnAccent },
});
