import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { onContextMenu } from '@/components/xp/ContextMenu';
import type { Point } from '@/components/xp/useWindowDrag';
import { colors, palette, PressState, spacing, webStyle } from '@/theme';

type Props = {
  onPress: () => void;
  onRightClick?: (point: Point) => void;
  selected?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

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
    borderBottomColor: colors.divider,
    ...webStyle({ cursor: 'pointer' }),
  },
  hovered: { backgroundColor: colors.hover },
  pressed: { backgroundColor: palette.sand },
});
