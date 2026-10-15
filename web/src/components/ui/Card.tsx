import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.card,
  },
});
