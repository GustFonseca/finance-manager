import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, fonts, fontSize, palette, spacing } from '@/theme';

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
    borderWidth: 1,
    borderColor: palette.stoneDark,
    padding: spacing.md,
  },
  group: { paddingTop: 0 },
  header: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: palette.teal,
    borderBottomWidth: 1,
    borderBottomColor: palette.tealDark,
  },
  caption: {
    color: palette.sandLight,
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
