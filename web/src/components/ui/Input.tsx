import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, spacing, fontSize, webStyle } from '@/theme';

type Props = TextInputProps & {
  label?: string;
};

export function Input({ label, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, focused && styles.focused, style]}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs + 2,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    ...webStyle({ outlineStyle: 'none' }),
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.xs - 1,
    paddingHorizontal: spacing.xs + 1,
  },
});
