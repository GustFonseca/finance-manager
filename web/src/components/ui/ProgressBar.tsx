import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

type Props = {
  /** 0–100; values outside the range are clamped. */
  percent: number;
  height?: number;
  color?: string;
};

export function ProgressBar({ percent, height = 8, color = colors.income }: Props) {
  const width = `${Math.max(0, Math.min(percent, 100))}%` as const;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
});
