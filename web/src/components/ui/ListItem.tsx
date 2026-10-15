import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { onContextMenu } from '@/components/xp/ContextMenu';
import type { Point } from '@/components/xp/useWindowDrag';
import { colors, PressState, spacing, webStyle } from '@/theme';

type Props = {
  onPress: () => void;
  /** Right-click, at the pointer position. */
  onRightClick?: (point: Point) => void;
  /** Highlighted with the selection color, like the selected row in Explorer. */
  selected?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Explorer "details view" row: white, with the XP hot-track hover. */
export function ListItem({ onPress, onRightClick, selected, children, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      {...(onRightClick ? onContextMenu(onRightClick) : null)}
      style={(state) => {
        const { pressed, hovered } = state as PressState;
        return [
          styles.row,
          hovered && styles.hovered,
          (pressed || selected) && styles.pressed,
          style,
        ];
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
