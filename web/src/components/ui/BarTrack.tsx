import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  /** 0–1 of the track's width. */
  ratio: number;
  color: string;
  thickness?: number;
};

/** One horizontal magnitude bar: grows from a square baseline to a 4px rounded end. */
export function BarTrack({ ratio, color, thickness = 14 }: Props) {
  const width = `${Math.max(0, Math.min(ratio, 1)) * 100}%` as const;
  return (
    <View style={[styles.track, { height: thickness }]}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', justifyContent: 'center' },
  fill: { height: '100%', borderTopRightRadius: 4, borderBottomRightRadius: 4, minWidth: 2 },
});
