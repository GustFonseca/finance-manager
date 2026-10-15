import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, gradients, webStyle } from '@/theme';

type Props = {
  /** 0–100; values outside the range are clamped. */
  percent: number;
  height?: number;
};

/** XP progress bar: rounded sunken track filled with green blocks. */
export function ProgressBar({ percent, height = 14 }: Props) {
  const width = `${Math.max(0, Math.min(percent, 100))}%` as const;
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#686868',
    borderRadius: 3,
    padding: 1,
    overflow: 'hidden',
  },
  fill: { height: '100%', ...webStyle({ backgroundImage: gradients.progress }) },
});
