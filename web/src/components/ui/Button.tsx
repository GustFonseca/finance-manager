import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { bevels, colors, fontSize, gradients, palette, PressState, spacing, webStyle } from '@/theme';

type Variant = 'primary' | 'secondary' | 'success' | 'danger';
type Size = 'md' | 'sm';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={(state) => {
        const { pressed, hovered } = state as PressState;
        return [
          styles.base,
          size === 'sm' && styles.sm,
          variant === 'primary' && styles.default,
          hovered && !isDisabled && styles.hovered,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ];
      }}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <Text style={[styles.label, LABEL_TONE[variant], isDisabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const LABEL_TONE: Record<Variant, { color: string; fontWeight?: '700' }> = {
  primary: { color: colors.textPrimary },
  secondary: { color: colors.textPrimary },
  success: { color: colors.income, fontWeight: '700' },
  danger: { color: colors.expense, fontWeight: '700' },
};

const styles = StyleSheet.create({
  base: {
    minWidth: 75,
    minHeight: 23,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.sandLight,
    ...webStyle({ backgroundImage: gradients.button, boxShadow: bevels.button, cursor: 'pointer' }),
  },
  sm: { minWidth: 0, paddingHorizontal: spacing.sm, minHeight: 21 },
  default: webStyle({ boxShadow: bevels.buttonDefault }),
  hovered: webStyle({ boxShadow: bevels.buttonHover }),
  pressed: webStyle({ backgroundImage: gradients.buttonPressed, boxShadow: bevels.sunken }),
  disabled: {
    backgroundColor: palette.stone,
    ...webStyle({ backgroundImage: 'none', boxShadow: `inset 0 0 0 1px ${palette.stoneDark}`, cursor: 'default' }),
  },
  label: { fontSize: fontSize.sm },
  labelDisabled: { color: colors.textMuted },
});
