import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { bevels, colors, fontSize, gradients, PressState, radius, spacing, webStyle } from '@/theme';

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

/**
 * Classic XP push button. `primary` is the dialog's default button (blue
 * glow); `success`/`danger` only tint the label, as XP buttons were never
 * colored.
 */
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
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#003C74',
    alignItems: 'center',
    justifyContent: 'center',
    ...webStyle({ backgroundImage: gradients.button, cursor: 'pointer' }),
  },
  sm: { minWidth: 0, paddingHorizontal: spacing.sm, minHeight: 21 },
  default: webStyle({ boxShadow: bevels.buttonDefault }),
  hovered: webStyle({ boxShadow: bevels.buttonHover }),
  pressed: webStyle({ backgroundImage: gradients.buttonPressed, boxShadow: 'none' }),
  disabled: webStyle({ borderColor: '#C9C7BA', backgroundImage: 'none', cursor: 'default' }),
  label: { fontSize: fontSize.sm },
  labelDisabled: { color: '#A19E8F' },
});
