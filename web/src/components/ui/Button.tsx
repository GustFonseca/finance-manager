import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '@/theme';

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
  const variantStyle = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        variantStyle.container,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} />
      ) : (
        <Text style={[styles.label, size === 'sm' && styles.labelSm, variantStyle.text]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sm: { paddingVertical: spacing.sm + 2 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  label: { fontWeight: '600', fontSize: fontSize.md },
  labelSm: { fontSize: fontSize.sm },
});

const VARIANTS: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: { container: { backgroundColor: colors.primary }, text: { color: colors.textOnAccent } },
  success: { container: { backgroundColor: colors.income }, text: { color: colors.textOnAccent } },
  danger: { container: { backgroundColor: colors.expense }, text: { color: colors.textOnAccent } },
  secondary: {
    container: { backgroundColor: 'transparent', borderColor: colors.border },
    text: { color: colors.textMuted },
  },
};
