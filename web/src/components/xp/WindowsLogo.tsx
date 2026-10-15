import React from 'react';
import { StyleSheet, View } from 'react-native';
import { webStyle } from '@/theme';

/** The four-color waving flag, drawn with plain views. */
export function WindowsLogo({ size = 18 }: { size?: number }) {
  const pane = size / 2 - 1;
  return (
    <View style={[styles.flag, { width: size, height: size }]}>
      {PANE_COLORS.map((color) => (
        <View
          key={color}
          style={[styles.pane, { width: pane, height: pane, backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

const PANE_COLORS = ['#F35325', '#81BC06', '#05A6F0', '#FFBA08'];

const styles = StyleSheet.create({
  flag: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    ...webStyle({ transform: 'perspective(40px) rotateY(-12deg) skewY(-4deg)' }),
  },
  pane: { borderRadius: 2 },
});
