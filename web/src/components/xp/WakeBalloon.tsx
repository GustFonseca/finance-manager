import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { StyleSheet, Text, View } from 'react-native';
import { useServerWaking } from '@/lib/serverWake';
import { bevels, colors, fontSize, palette, spacing, webStyle } from '@/theme';

export const WAKE_TITLE = 'Conectando ao servidor';
export const WAKE_MESSAGE = 'O servidor estava em repouso e está iniciando. Isso pode levar até um minuto.';

export function WakeBalloon() {
  const waking = useServerWaking();
  if (!waking) return null;

  return (
    <View style={styles.balloon} accessibilityRole="alert">
      <View style={styles.header}>
        <PixelIcon name="info-circle" size={16} color={colors.primary} />
        <Text style={styles.title}>{WAKE_TITLE}</Text>
      </View>
      <Text style={styles.message}>{WAKE_MESSAGE}</Text>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  balloon: {
    position: 'absolute',
    right: spacing.sm,
    bottom: 40,
    maxWidth: 300,
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.tealDark,
    borderLeftWidth: 4,
    borderLeftColor: palette.teal,
    zIndex: 1000,
    ...webStyle({ boxShadow: bevels.menu }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.heading },
  message: { fontSize: fontSize.sm, color: colors.textPrimary },
  tail: {
    position: 'absolute',
    right: 24,
    bottom: -8,
    width: 14,
    height: 14,
    backgroundColor: palette.paper,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.tealDark,
    transform: [{ rotate: '45deg' }],
  },
});
