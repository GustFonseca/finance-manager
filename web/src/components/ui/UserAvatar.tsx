import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { colors, palette } from '@/theme';
import { PixelIcon } from './PixelIcon';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

type Props = {
  name?: string | null;
  icon?: string | null;
  color?: string | null;
  size?: number;
};

export function UserAvatar({ name, icon, color, size = 40 }: Props) {
  const letter = name?.trim().charAt(0).toUpperCase() || '?';
  const tile = { width: size, height: size, backgroundColor: color ?? palette.amber };
  return (
    <View style={[styles.tile, tile]} accessibilityLabel={`Avatar de ${name?.trim() || 'Usuário'}`}>
      {icon ? (
        <PixelIcon name={icon as IconName} size={Math.round(size * 0.55)} color={colors.textOnAccent} />
      ) : (
        <Text style={[styles.letter, { fontSize: Math.round(size / 2), color: color ? colors.textOnAccent : palette.tealDark }]}>
          {letter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 2,
    borderColor: palette.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontWeight: '700' },
});
