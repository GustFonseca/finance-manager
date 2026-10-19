import React from 'react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bevels, colors, fonts, fontSize, gradients, palette, PressState, spacing, webStyle } from '@/theme';
import { Clock } from './Clock';
import { findProgram } from './programs';
import { TASKBAR_HEIGHT } from './StartMenu';
import { VolumeControl } from './VolumeControl';
import { useWindowManager } from './WindowManager';
import { RetroMark } from './RetroMark';

type Props = {
  startOpen: boolean;
  onToggleStart: () => void;
};

export function Taskbar({ startOpen, onToggleStart }: Props) {
  const wm = useWindowManager();

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onToggleStart}
        accessibilityRole="button"
        accessibilityLabel="Iniciar"
        aria-expanded={startOpen}
        style={(state) => {
          const { hovered } = state as PressState;
          return [
            styles.start,
            webStyle({
              backgroundImage:
                hovered && !startOpen ? gradients.startButtonHover : gradients.startButton,
            }),
            startOpen && styles.startPressed,
          ];
        }}>
        <RetroMark size={18} />
        <Text style={[styles.startLabel, { fontFamily: fonts.body }]}>iniciar</Text>
      </Pressable>

      <View style={styles.tasks}>
        {wm.openWindows.map((id) => {
          const meta = wm.metaOf(id) ?? findProgram(id);
          if (!meta) return null;
          const active = wm.activeWindow === id;
          return (
            <Pressable
              key={id}
              onPress={() => wm.toggleFromTaskbar(id)}
              accessibilityRole="button"
              aria-selected={active}
              style={(state) => [
                styles.task,
                webStyle({ backgroundImage: active ? gradients.taskButtonActive : gradients.taskButton }),
                active ? styles.taskActive : (state as PressState).hovered && styles.taskHover,
              ]}>
              <PixelIcon name={meta.icon} size={13} color={colors.primary} />
              <Text style={[styles.taskLabel, active && styles.taskLabelActive]} numberOfLines={1}>
                {meta.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tray}>
        <VolumeControl />
        <Clock />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: TASKBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    backgroundColor: palette.stone,
    ...webStyle({ backgroundImage: gradients.taskbar, boxShadow: bevels.taskbar, userSelect: 'none' }),
  },
  start: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    backgroundColor: palette.green,
    ...webStyle({ boxShadow: bevels.startButton, cursor: 'pointer' }),
  },
  startPressed: webStyle({ boxShadow: bevels.startButtonPressed }),
  startLabel: {
    color: colors.textOnAccent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tasks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xs,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  task: {
    flexShrink: 1,
    width: 160,
    minWidth: 40,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    ...webStyle({ boxShadow: bevels.button, cursor: 'pointer' }),
  },
  taskActive: webStyle({ boxShadow: bevels.buttonPressed }),
  taskHover: webStyle({ boxShadow: bevels.buttonHover }),
  taskLabel: { flex: 1, color: colors.textPrimary, fontSize: fontSize.xs },
  taskLabelActive: { fontWeight: '700' },
  tray: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    ...webStyle({ backgroundImage: gradients.tray, boxShadow: bevels.sunken }),
  },
});
