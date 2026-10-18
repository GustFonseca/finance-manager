import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';

type Props = ViewProps & {
  title?: string;
};

export function Card({ title, style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, title ? styles.group : null, style]} {...rest}>
      {title ? <Text style={styles.caption}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#D0D0BF',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  group: {
    backgroundColor: 'transparent',
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
  },
  caption: {
    position: 'absolute',
    top: -8,
    left: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    color: '#0046D5',
    fontSize: fontSize.sm,
  },
});
