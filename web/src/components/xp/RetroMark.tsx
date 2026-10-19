import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { StyleSheet, View } from 'react-native';
import { bevels, palette, webStyle } from '@/theme';

export function RetroMark({ size = 18 }: { size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size }]}>
      <PixelIcon name="desktop" size={Math.round(size * 0.62)} color={palette.teal} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.sandLight,
    ...webStyle({ boxShadow: bevels.button }),
  },
});
