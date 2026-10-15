import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors, PressState, spacing, webStyle } from '@/theme';

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Explorer "details view" row: white, with the XP hot-track hover. */
export function ListItem({ onPress, children, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const { pressed, hovered } = state as PressState;
        return [styles.row, hovered && styles.hovered, pressed && styles.pressed, style];
      }}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFE7',
    ...webStyle({ cursor: 'pointer' }),
  },
  hovered: { backgroundColor: colors.hover },
  pressed: { backgroundColor: '#C1D2EE' },
});
