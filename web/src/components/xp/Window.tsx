import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDialog } from '@/components/ui/DialogProvider';
import { bevels, colors, fontSize, palette, spacing, webStyle } from '@/theme';
import { isolateContextMenu } from './ContextMenu';
import { COMPACT_WIDTH } from './DesktopContext';
import { hasSeenHelp, markHelpSeen, useHelp } from './help';
import { MenuBar, MenuDef, MenuEntry } from './MenuBar';
import { TASKBAR_HEIGHT } from './StartMenu';
import { IconName, TitleBar } from './TitleBar';
import { Toolbar, ToolbarButton } from './Toolbar';
import { Point, useWindowDrag } from './useWindowDrag';
import { Edge, EDGES, useWindowResize } from './useWindowResize';
import { useWindowId, useWindowManager } from './WindowManager';

const RESTORED_MAX_WIDTH = 860;
const RESTORED_MAX_HEIGHT = 560;
const CASCADE_STEP = 28;
const MIN_VISIBLE = 100;
const TITLE_BAR_HEIGHT = 28;

export type WindowAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

type Props = {
  title: string;
  icon: IconName;
  actions?: WindowAction[];
  onRefresh?: () => void;
  status?: string;
  children: React.ReactNode;
};

export function Window({ title, icon, actions = [], onRefresh, status, children }: Props) {
  const wm = useWindowManager();
  const { alert } = useDialog();
  const { width, height } = useWindowDimensions();
  const id = useWindowId();
  const active = wm.activeWindow === id;
  const { setMeta } = wm;
  const help = useHelp(id);
  const [helpOpen, setHelpOpen] = useState(() => !!help && !hasSeenHelp(id));

  useEffect(() => setMeta(id, { title, icon }), [setMeta, id, title, icon]);

  const openHelp = () => setHelpOpen(true);
  const closeHelp = () => {
    markHelpSeen(id);
    setHelpOpen(false);
  };

  const compact = width < COMPACT_WIDTH;
  const maximized = compact || wm.isMaximized(id);

  const desktopHeight = height - TASKBAR_HEIGHT;
  const stored = wm.sizeOf(id);
  const size = stored
    ? { width: Math.min(stored.width, width), height: Math.min(stored.height, desktopHeight) }
    : {
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
    position: clamp(wm.positionOf(id) ?? initial),
    clamp,
    onDragEnd: (point) => wm.setPosition(id, point),
    onDoubleClick: () => !compact && wm.toggleMaximize(id),
    draggable: !maximized,
  });

  const resize = useWindowResize({
    rect: { ...drag.position, ...size },
    bounds: { width, height: desktopHeight },
    enabled: !maximized,
    onResizeEnd: (rect) => {
      wm.setPosition(id, { x: rect.x, y: rect.y });
      wm.setSize(id, { width: rect.width, height: rect.height });
    },
  });

  if (!wm.isOpen(id)) return null;

  const minimized = wm.isMinimized(id);

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
        ...(help ? [{ label: 'Como funciona esta janela', onPress: openHelp }, 'separator' as const] : []),
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
      ? [{ label: 'Atualizar', icon: 'refresh' as const, color: palette.green, onPress: onRefresh }]
      : []),
    ...(help ? [{ label: 'Como funciona', icon: 'question-circle' as const, color: palette.teal, onPress: openHelp }] : []),
  ];

  return (
    <View
      onPointerDown={active ? undefined : () => wm.open(id)}
      {...isolateContextMenu}
      style={[
        styles.frame,
        { zIndex: wm.zIndexOf(id), display: minimized ? 'none' : 'flex' },
        !active && styles.inactiveFrame,
        maximized
          ? styles.maximized
          : { left: resize.rect.x, top: resize.rect.y, width: resize.rect.width, height: resize.rect.height },
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
        onHelp={help ? openHelp : undefined}
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
            {maximized ? null : <SizeGrip />}
          </View>
        ) : null}
      </View>
      {maximized
        ? null
        : EDGES.map((edge) => (
            <View
              key={edge}
              testID={`resize-${edge}`}
              onPointerDown={resize.start(edge)}
              style={[styles.handle, HANDLE_STYLES[edge]]}
            />
          ))}
      {help && helpOpen && !minimized ? help.present(help.topic, closeHelp) : null}
    </View>
  );
}

const EDGE = 5;
const CORNER = 14;

const HANDLE_STYLES: Record<Edge, object> = {
  n: { top: -EDGE / 2, left: CORNER, right: CORNER, height: EDGE, ...webStyle({ cursor: 'ns-resize' }) },
  s: { bottom: -EDGE / 2, left: CORNER, right: CORNER, height: EDGE, ...webStyle({ cursor: 'ns-resize' }) },
  e: { right: -EDGE / 2, top: CORNER, bottom: CORNER, width: EDGE, ...webStyle({ cursor: 'ew-resize' }) },
  w: { left: -EDGE / 2, top: CORNER, bottom: CORNER, width: EDGE, ...webStyle({ cursor: 'ew-resize' }) },
  ne: { right: -EDGE / 2, top: -EDGE / 2, width: CORNER, height: CORNER, ...webStyle({ cursor: 'nesw-resize' }) },
  sw: { left: -EDGE / 2, bottom: -EDGE / 2, width: CORNER, height: CORNER, ...webStyle({ cursor: 'nesw-resize' }) },
  nw: { left: -EDGE / 2, top: -EDGE / 2, width: CORNER, height: CORNER, ...webStyle({ cursor: 'nwse-resize' }) },
  se: { right: -EDGE / 2, bottom: -EDGE / 2, width: CORNER + 4, height: CORNER + 4, ...webStyle({ cursor: 'nwse-resize' }) },
};

const GRIP_DOTS = [
  [8, 0],
  [4, 4],
  [8, 4],
  [0, 8],
  [4, 8],
  [8, 8],
];

function SizeGrip() {
  return (
    <View style={styles.grip} accessibilityLabel="Redimensionar">
      {GRIP_DOTS.map(([left, top]) => (
        <View key={`${left}-${top}`} style={[styles.gripDot, { left, top }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    backgroundColor: palette.sand,
    padding: 2,
    ...webStyle({ boxShadow: bevels.window }),
  },
  inactiveFrame: { backgroundColor: palette.stone },
  maximized: { top: 0, left: 0, right: 0, bottom: 0 },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    margin: 2,
    overflow: 'hidden',
  },
  handle: { position: 'absolute', zIndex: 2 },
  grip: { position: 'absolute', right: 2, bottom: 2, width: 11, height: 11 },
  gripDot: { position: 'absolute', width: 2, height: 2, backgroundColor: palette.stoneDark },
  statusBar: {
    paddingRight: 18,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginHorizontal: 2,
    marginBottom: 2,
    backgroundColor: palette.sand,
    ...webStyle({ boxShadow: bevels.sunken }),
  },
  statusText: { fontSize: fontSize.xs, color: colors.textPrimary },
});
