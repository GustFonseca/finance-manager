import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, ColorPicker, UserAvatar } from '@/components/ui';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { bevels, colors, fonts, fontSize, gradients, palette, PressState, spacing, webStyle } from '@/theme';
import { AVATAR_COLORS, AVATAR_ICONS } from '../form';

type Props = {
  name: string;
  icon: string | null;
  color: string | null;
  onIcon: (icon: string | null) => void;
  onColor: (color: string) => void;
};

export function AvatarPicker({ name, icon, color, onIcon, onColor }: Props) {
  return (
    <View>
      <View style={styles.preview}>
        <UserAvatar name={name} icon={icon} color={color} size={64} />
        <View style={styles.previewText}>
          <Text style={[styles.previewName, { fontFamily: fonts.pixel }]} numberOfLines={1}>
            {name.trim() || 'Usuário'}
          </Text>
          <Text style={styles.hint}>É assim que você aparece no menu Iniciar.</Text>
        </View>
      </View>

      <Text style={styles.label}>Desenho</Text>
      <View style={styles.grid}>
        {AVATAR_ICONS.map((option) => {
          const selected = option === icon;
          return (
            <Pressable
              key={option}
              onPress={() => onIcon(option)}
              accessibilityRole="button"
              accessibilityLabel={`Ícone ${option}`}
              aria-selected={selected}
              style={(state) => [
                styles.tile,
                (state as PressState).hovered && styles.tileHover,
                selected && styles.tileSelected,
              ]}>
              <PixelIcon name={option} size={18} color={selected ? colors.textOnAccent : palette.tealDark} />
            </Pressable>
          );
        })}
      </View>

      <ColorPicker label="Cor do fundo" value={color ?? ''} options={AVATAR_COLORS} onChange={onColor} />
      <Button label="Usar a letra" variant="secondary" size="sm" disabled={!icon} onPress={() => onIcon(null)} style={styles.letter} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  previewText: { flex: 1 },
  previewName: { fontSize: fontSize.xl, fontWeight: '600', color: colors.heading },
  hint: { fontSize: fontSize.xs, color: colors.textSecondary },
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginBottom: spacing.md },
  tile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...webStyle({ backgroundImage: gradients.button, boxShadow: bevels.button, cursor: 'pointer' }),
  },
  tileHover: webStyle({ boxShadow: bevels.buttonHover }),
  tileSelected: {
    backgroundColor: palette.teal,
    ...webStyle({ backgroundImage: 'none', boxShadow: `${bevels.buttonPressed}` }),
  },
  letter: { alignSelf: 'flex-start' },
});
