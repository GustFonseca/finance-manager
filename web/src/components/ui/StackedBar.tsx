import React from 'react';
import { StyleSheet, View } from 'react-native';
import { chart } from '@/theme';

export type BarSegment = { key: string; value: number; color: string };

type Props = {
  segments: BarSegment[];
  thickness?: number;
};

export function StackedBar({ segments, thickness = 18 }: Props) {
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <View style={[styles.empty, { height: thickness }]} />;

  return (
    <View style={[styles.bar, { height: thickness }]}>
      {visible.map(({ key, value: size, color }, i) => (
        <View
          key={key}
          style={[
            { flexGrow: size, flexBasis: 0, backgroundColor: color },
            i > 0 && styles.gap,
            i === visible.length - 1 && styles.end,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', width: '100%' },
  gap: { borderLeftWidth: 2, borderLeftColor: chart.surface },
  end: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  empty: { width: '100%', backgroundColor: chart.grid },
});
