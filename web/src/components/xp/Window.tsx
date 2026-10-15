import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDialog } from '@/components/ui/DialogProvider';
import { bevels, colors, fontSize, spacing, webStyle } from '@/theme';
import { isolateContextMenu } from './ContextMenu';
import { MenuBar, MenuDef, MenuEntry } from './MenuBar';
import { TASKBAR_HEIGHT } from './StartMenu';
import { IconName, TitleBar } from './TitleBar';
import { Toolbar, ToolbarButton } from './Toolbar';
import { Point, useWindowDrag } from './useWindowDrag';
import { useWindowId, useWindowManager } from './WindowManager';

/** Below this width windows are always maximized (phones, small tablets). */
const COMPACT_WIDTH = 720;
const RESTORED_MAX_WIDTH = 860;
const RESTORED_MAX_HEIGHT = 560;
/** Offset between windows opened in a row, like XP's cascade. */
const CASCADE_STEP = 28;
/** How much of a dragged window must stay on screen so it can be grabbed back. */
const MIN_VISIBLE = 100;
const TITLE_BAR_HEIGHT = 28;

export type WindowAction = {
  /** Menu/toolbar label, e.g. "Nova conta". */
  label: string;
  icon: IconName;
  onPress: () => void;
};

type Props = {
  title: string;
  icon: IconName;
  /** Shown in the toolbar and in the "Arquivo" menu. */
  actions?: WindowAction[];
  /** Adds "Atualizar" to the toolbar and the "Exibir" menu. */
  onRefresh?: () => void;
  /** Status bar text, e.g. "4 objeto(s)". */
  status?: string;
  children: React.ReactNode;
};

/**
 * An XP window (a program, a folder…). Its open / minimized / maximized state,
 * position and stacking live in the WindowManager, so the content only
 * describes itself and its actions.
 */
export function Window({ title, icon, actions = [], onRefresh, status, children }: Props) {
  const wm = useWindowManager();
  const { alert } = useDialog();
  const { width, height } = useWindowDimensions();
  const id = useWindowId();
  const active = wm.activeWindow === id;
  const { setMeta } = wm;

  // The taskbar shows whatever title and icon the window has right now.
  useEffect(() => setMeta(id, { title, icon }), [setMeta, id, title, icon]);

  const compact = width < COMPACT_WIDTH;
  const maximized = compact || wm.isMaximized(id);

  // Restored windows have a fixed size and open cascaded from the center.
  const desktopHeight = height - TASKBAR_HEIGHT;
  const size = {
    width: Math.min(RESTORED_MAX_WIDTH, width - spacing.xxl * 2),
    height: Math.min(RESTORED_MAX_HEIGHT, desktopHeight - spacing.xxl * 2),
  };
  const clamp = (point: Point): Point => ({
    x: Math.min(Math.max(point.x, MIN_VISIBLE - size.width), width - MIN_VISIBLE),
    y: Math.min(Math.max(point.y, 0), desktopHeight - TITLE_BAR_HEIGHT),
  });
  const cascade = Math.max(0, wm.openWindows.indexOf(id)) * CASCADE_STEP;
  const initial = {
    x: (width - size.width) / 2 - CASCADE_STEP * 2 + cascade,
    y: (desktopHeight - size.height) / 2 - CASCADE_STEP * 2 + cascade,
  };

  const drag = useWindowDrag({
    // Re-clamped every render so a smaller browser window can't strand it off-screen.
    position: clamp(wm.positionOf(id) ?? initial),
    clamp,
    onDragEnd: (point) => wm.setPosition(id, point),
    onDoubleClick: () => !compact && wm.toggleMaximize(id),
    draggable: !maximized,
  });

  if (!wm.isOpen(id) || wm.isMinimized(id)) return null;

  const close = () => wm.close(id);

  const fileEntries: MenuEntry[] = [
    ...actions.map((action) => ({ label: `${action.label}...`, onPress: action.onPress })),
    ...(actions.length ? (['separator'] as const) : []),
    { label: 'Fechar', onPress: close },
  ];
  const viewEntries: MenuEntry[] = [
    ...(onRefresh ? [{ label: 'Atualizar', onPress: onRefresh }] : []),
    ...(compact
      ? []
      : [{ label: maximized ? 'Restaurar' : 'Maximizar', onPress: () => wm.toggleMaximize(id) }]),
    { label: 'Minimizar', onPress: () => wm.minimize(id) },
  ];
  const menus: MenuDef[] = [
    { label: 'Arquivo', entries: fileEntries },
    { label: 'Exibir', entries: viewEntries },
    {
      label: 'Ajuda',
      entries: [
        {
          label: 'Sobre o Finance Manager',
          onPress: () =>
            alert({
              title: 'Sobre o Finance Manager',
              message: 'Finance Manager\nControle de receitas, despesas, contas e metas.',
            }),
        },
      ],
    },
  ];

  const toolbar: ToolbarButton[] = [
    ...actions.map((action) => ({ label: action.label, icon: action.icon, onPress: action.onPress })),
    ...(onRefresh
      ? [{ label: 'Atualizar', icon: 'refresh' as const, color: '#2E7D32', onPress: onRefresh }]
      : []),
  ];

  return (
    <View
      // Any click inside a background window brings it to the front.
      onPointerDown={active ? undefined : () => wm.open(id)}
      {...isolateContextMenu}
      style={[
        styles.frame,
        { zIndex: wm.zIndexOf(id) },
        !active && styles.inactiveFrame,
        maximized
          ? styles.maximized
          : { left: drag.position.x, top: drag.position.y, ...size },
      ]}>
      <TitleBar
        active={active}
        onPointerDown={drag.onPointerDown}
        draggable={!maximized}
        title={title}
        icon={icon}
        maximized={maximized}
        onMinimize={() => wm.minimize(id)}
        onMaximize={compact ? undefined : () => wm.toggleMaximize(id)}
        onClose={close}
      />
      <View style={styles.inner}>
        <MenuBar menus={menus} />
        {toolbar.length ? <Toolbar buttons={toolbar} /> : null}
        <View style={styles.content}>{children}</View>
        {status !== undefined ? (
          <View style={styles.statusBar}>
            <Text style={styles.statusText} numberOfLines={1}>
              {status}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    backgroundColor: colors.windowFrame,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    ...webStyle({ boxShadow: bevels.window }),
  },
  // XP fades the whole frame of background windows, not just the title bar.
  inactiveFrame: { backgroundColor: '#7B9CF0' },
  maximized: { top: 0, left: 0, right: 0, bottom: 0 },
  inner: {
    flex: 1,
    marginHorizontal: 3,
    marginBottom: 3,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    margin: 2,
    overflow: 'hidden',
  },
  statusBar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    ...webStyle({ boxShadow: bevels.sunken }),
  },
  statusText: { fontSize: fontSize.xs, color: colors.textPrimary },
});
