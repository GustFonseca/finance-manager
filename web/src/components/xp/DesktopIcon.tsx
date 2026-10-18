import React, { useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PointerEvent as RNPointerEvent, StyleSheet, Text, TextInput, View } from 'react-native';
import { bevels, colors, fontSize, palette, webStyle } from '@/theme';
import { onContextMenu, useContextMenu } from './ContextMenu';
import { ICON_CELL, IconSlot, useDesktop } from './DesktopContext';
import type { MenuEntry } from './MenuBar';
import type { IconName } from './TitleBar';
import type { Point } from './useWindowDrag';

const DRAG_THRESHOLD = 4;
const DOUBLE_CLICK_MS = 400;

type Props = {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  slot: IconSlot;
  onOpen: () => void;
  menu?: () => MenuEntry[];
  onRename?: (name: string) => void;
};

const LONG_LABEL = 13;
const HOME_LABEL_WIDTH = 100;

export function DesktopIcon({ id, label, icon, color, slot, onOpen, menu, onRename }: Props) {
  const desktop = useDesktop();
  const contextMenu = useContextMenu();
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const lastClick = useRef(0);

  if (!desktop.ready) return null;

  const position = dragPosition ?? desktop.iconPosition(id, slot);
  const selected = desktop.selectedIcon === id;
  const renaming = desktop.renamingIcon === id && !!onRename;
  const { compact } = desktop;

  function onPointerDown(event: RNPointerEvent) {
    const dom = event.nativeEvent as unknown as PointerEvent;
    if (dom.button !== 0 || renaming) return;
    event.stopPropagation();
    desktop.selectIcon(id);

    const start = { x: dom.clientX, y: dom.clientY };
    const origin = position;
    let current: Point | null = null;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const move = (e: PointerEvent) => {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (compact || (!current && Math.hypot(dx, dy) < DRAG_THRESHOLD)) return;
      current = desktop.clampIcon({ x: origin.x + dx, y: origin.y + dy });
      setDragPosition(current);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      document.body.style.userSelect = previousUserSelect;
      setDragPosition(null);
      if (current) {
        desktop.moveIcon(id, current);
        return;
      }
      const now = Date.now();
      if (compact || now - lastClick.current < DOUBLE_CLICK_MS) {
        lastClick.current = 0;
        onOpen();
      } else {
        lastClick.current = now;
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  const showMenu = (point: Point) => {
    desktop.selectIcon(id);
    contextMenu.show(point, menu?.() ?? [{ label: 'Abrir', bold: true, onPress: onOpen }]);
  };

  return (
    <View
      onPointerDown={onPointerDown}
      {...onContextMenu(showMenu)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${label}`}
      style={[
        styles.icon,
        { left: position.x, top: position.y, width: desktop.cellWidth - 8 },
        dragPosition && styles.dragging,
      ]}>
      <View style={[styles.tile, compact && styles.homeTile, selected && styles.tileSelected]}>
        <FontAwesome name={icon} size={compact ? 30 : 24} color={color} />
      </View>
      {renaming ? (
        <RenameInput
          initial={label}
          onCommit={(name) => {
            desktop.stopRename();
            if (name && name !== label) onRename(name);
          }}
          onCancel={desktop.stopRename}
        />
      ) : (
        <Text
          style={[
            styles.label,
            compact && styles.homeLabel,
            compact && label.length > LONG_LABEL && styles.homeLabelLong,
            selected && styles.labelSelected,
          ]}
          numberOfLines={compact ? undefined : 2}>
          {label}
        </Text>
      )}
    </View>
  );
}

type RenameInputProps = {
  initial: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
};

function RenameInput({ initial, onCommit, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(initial);
  const done = useRef(false);

  const finish = (save: boolean) => {
    if (done.current) return;
    done.current = true;
    if (save) onCommit(value.trim());
    else onCancel();
  };

  return (
    <TextInput
      value={value}
      onChangeText={setValue}
      autoFocus
      selectTextOnFocus
      onSubmitEditing={() => finish(true)}
      onBlur={() => finish(true)}
      onKeyPress={(e) => e.nativeEvent.key === 'Escape' && finish(false)}
      style={styles.renameInput}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
    alignItems: 'center',
    gap: 3,
    ...webStyle({ cursor: 'default', userSelect: 'none', touchAction: 'none' }),
  },
  dragging: { opacity: 0.7, zIndex: 1 },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: palette.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...webStyle({ boxShadow: `${bevels.button}, ${bevels.menu}` }),
  },
  homeTile: { width: 56, height: 56, borderRadius: 12 },
  tileSelected: { backgroundColor: palette.greenLight },
  label: {
    color: palette.paper,
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 2,
    textShadowColor: palette.tealDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    width: '130%',
    alignSelf: 'center',
    ...webStyle({ overflowWrap: 'normal', wordBreak: 'normal', hyphens: 'none' }),
  },
  homeLabel: { fontSize: fontSize.sm, marginTop: 2, width: HOME_LABEL_WIDTH },
  homeLabelLong: { fontSize: fontSize.xs, letterSpacing: -0.2 },
  labelSelected: { backgroundColor: palette.teal, textShadowColor: 'transparent' },
  renameInput: {
    width: ICON_CELL.width - 8,
    fontSize: fontSize.xs,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    paddingHorizontal: 2,
  },
});
