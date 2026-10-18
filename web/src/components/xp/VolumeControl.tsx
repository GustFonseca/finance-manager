import React, { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fontSize, spacing, webStyle } from '@/theme';
import { useSound } from './sound/SoundProvider';
import { TASKBAR_HEIGHT } from './StartMenu';

export function VolumeControl() {
  const { volume, muted, setVolume, setMuted, click } = useSound();
  const [open, setOpen] = useState(false);

  const icon = muted || volume === 0 ? 'volume-off' : volume < 50 ? 'volume-down' : 'volume-up';

  return (
    <>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={`Volume: ${muted ? 'sem áudio' : `${volume}%`}`}
        style={styles.icon}>
        <FontAwesome name={icon} size={14} color="#FFFFFF" />
      </Pressable>

      {open ? (
        <>
          <Pressable
            style={styles.dismiss}
            onPress={() => setOpen(false)}
            accessibilityLabel="Fechar volume"
          />
          <View style={styles.popup}>
            <Text style={styles.title}>Volume</Text>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={volume}
              aria-label="Volume"
              onChange={(event) => setVolume(Number(event.target.value))}
              onPointerUp={click}
              onKeyUp={click}
              style={sliderStyle}
            />
            <label style={muteStyle}>
              <input
                type="checkbox"
                checked={muted}
                onChange={(event) => setMuted(event.target.checked)}
              />
              Sem áudio
            </label>
          </View>
        </>
      ) : null}
    </>
  );
}

const sliderStyle: React.CSSProperties = {
  writingMode: 'vertical-lr',
  direction: 'rtl',
  height: 100,
  width: 24,
  margin: `${spacing.sm}px 0`,
  accentColor: colors.primary,
  cursor: 'pointer',
};

const muteStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: fontSize.xs,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

const styles = StyleSheet.create({
  icon: { padding: 2, ...webStyle({ cursor: 'pointer' }) },
  dismiss: webStyle({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 900 }),
  popup: {
    position: 'absolute',
    right: spacing.xs,
    bottom: TASKBAR_HEIGHT + 2,
    zIndex: 1000,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#716F64',
    ...webStyle({ boxShadow: bevels.menu }),
  },
  title: { fontSize: fontSize.sm, color: colors.textPrimary },
});
