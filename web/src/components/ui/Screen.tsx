import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '@/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Full-height screen container with the app background. */
export function Screen({ children, style }: Props) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
