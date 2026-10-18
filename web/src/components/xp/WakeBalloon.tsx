import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { useServerWaking } from '@/lib/serverWake';
import { colors, fontSize, spacing, webStyle } from '@/theme';

export const WAKE_TITLE = 'Conectando ao servidor';
export const WAKE_MESSAGE = 'O servidor estava em repouso e está iniciando. Isso pode levar até um minuto.';

export function WakeBalloon() {
  const waking = useServerWaking();
  if (!waking) return null;

  return (
    <View style={styles.balloon} accessibilityRole="alert">
      <View style={styles.header}>
        <FontAwesome name="info-circle" size={16} color={colors.primary} />
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
    backgroundColor: '#FFFFE1',
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 6,
    zIndex: 1000,
    ...webStyle({ boxShadow: '2px 2px 4px rgba(0,0,0,0.3)' }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  message: { fontSize: fontSize.sm, color: colors.textPrimary },
  tail: {
    position: 'absolute',
    right: 24,
    bottom: -8,
    width: 14,
    height: 14,
    backgroundColor: '#FFFFE1',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.textPrimary,
    transform: [{ rotate: '45deg' }],
  },
});
