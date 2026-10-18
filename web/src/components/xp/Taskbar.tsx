import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, fontSize, gradients, PressState, spacing, webStyle } from '@/theme';
import { Clock } from './Clock';
import { findProgram } from './programs';
import { TASKBAR_HEIGHT } from './StartMenu';
import { VolumeControl } from './VolumeControl';
import { useWindowManager } from './WindowManager';
import { WindowsLogo } from './WindowsLogo';

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
        accessibilityState={{ expanded: startOpen }}
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
        <WindowsLogo size={18} />
        <Text style={[styles.startLabel, { fontFamily: fonts.title }]}>iniciar</Text>
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
              accessibilityState={{ selected: active }}
              style={(state) => [
                styles.task,
                webStyle({ backgroundImage: active ? gradients.taskButtonActive : gradients.taskButton }),
                active ? styles.taskActive : (state as PressState).hovered && styles.taskHover,
              ]}>
              <FontAwesome name={meta.icon} size={13} color="#FFFFFF" />
              <Text style={styles.taskLabel} numberOfLines={1}>
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
    alignItems: 'stretch',
    ...webStyle({ backgroundImage: gradients.taskbar, userSelect: 'none' }),
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.lg + 2,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    ...webStyle({
      boxShadow: 'inset 2px 2px 3px rgba(255,255,255,0.35), 2px 0 3px rgba(0,0,0,0.3)',
      cursor: 'pointer',
    }),
  },
  startPressed: webStyle({ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)', filter: 'brightness(0.9)' }),
  startLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  tasks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  task: {
    flexShrink: 1,
    width: 160,
    minWidth: 40,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 3,
    ...webStyle({
      boxShadow: 'inset -1px 0 rgba(0,0,0,0.3), inset 1px 1px rgba(255,255,255,0.2)',
      cursor: 'pointer',
    }),
  },
  taskActive: webStyle({ boxShadow: 'inset 0 0 1px 1px rgba(0,0,0,0.3), inset 1px 0 1px #000000' }),
  taskHover: webStyle({ filter: 'brightness(1.1)' }),
  taskLabel: { flex: 1, color: '#FFFFFF', fontSize: fontSize.xs },
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: '#1042AF',
    ...webStyle({ backgroundImage: gradients.tray, boxShadow: 'inset 1px 0 1px #18BBFF' }),
  },
});
