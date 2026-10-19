import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { bevels, colors, fonts, fontSize, palette, spacing, webStyle } from '@/theme';

type Props = ViewProps & {
  title?: string;
};

export function Card({ title, style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, title ? styles.group : null, style]} {...rest}>
      {title ? (
        <View style={styles.header}>
          <Text style={[styles.caption, { fontFamily: fonts.pixel }]}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...webStyle({ boxShadow: bevels.card }),
  },
  group: { paddingTop: 0 },
  header: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: palette.teal,
    borderBottomWidth: 2,
    borderBottomColor: palette.tealDark,
  },
  caption: {
    color: palette.sandLight,
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
