import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, shadow } from '@/theme';

type Props = {
  onPress: () => void;
  icon?: string;
  accessibilityLabel?: string;
};

/** Floating action button, bottom-right. */
export function Fab({ onPress, icon = '+', accessibilityLabel = 'Adicionar' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.floating,
  },
  pressed: { opacity: 0.85 },
  icon: { fontSize: 28, color: colors.textOnAccent, lineHeight: 30 },
});
