import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, PressState, radius, spacing, webStyle } from '@/theme';
import type { IconName } from './TitleBar';

export type ToolbarButton = {
  label: string;
  icon: IconName;
  color?: string;
  onPress: () => void;
};

/** Explorer-style toolbar: flat icon buttons that raise on hover. */
export function Toolbar({ buttons }: { buttons: ToolbarButton[] }) {
  return (
    <View style={styles.bar}>
      {buttons.map((button) => (
        <Pressable
          key={button.label}
          onPress={button.onPress}
          accessibilityRole="button"
          style={(state) => {
            const { hovered, pressed } = state as PressState;
            return [styles.button, hovered && styles.hovered, pressed && styles.pressed];
          }}>
          <FontAwesome name={button.icon} size={16} color={button.color ?? colors.primary} />
          <Text style={styles.label}>{button.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D2BD',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    ...webStyle({ cursor: 'pointer' }),
  },
  hovered: {
    borderColor: '#CECEC3',
    backgroundColor: '#F7F6F1',
  },
  pressed: { backgroundColor: '#E3E1D6' },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
});
