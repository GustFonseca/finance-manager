import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDialog } from '@/components/ui/DialogProvider';
import { bevels, colors, fontSize, spacing, webStyle } from '@/theme';
import { MenuBar, MenuDef, MenuEntry } from './MenuBar';
import { IconName, TitleBar } from './TitleBar';
import { Toolbar, ToolbarButton } from './Toolbar';
import { useWindowManager } from './WindowManager';

/** Below this width windows are always maximized (phones, small tablets). */
const COMPACT_WIDTH = 720;
const RESTORED_MAX_WIDTH = 920;

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
 * An XP application window for the current route. Its open / minimized /
 * maximized state lives in the WindowManager, so the screen only describes
 * its content and actions.
 */
export function Window({ title, icon, actions = [], onRefresh, status, children }: Props) {
  const wm = useWindowManager();
  const { alert } = useDialog();
  const { width } = useWindowDimensions();
  const route = wm.currentRoute;

  if (!wm.isVisible(route)) return null;

  const compact = width < COMPACT_WIDTH;
  const maximized = compact || wm.isMaximized(route);
  const sideInset = Math.max(spacing.xxl, (width - RESTORED_MAX_WIDTH) / 2);

  const close = () => wm.close(route);

  const fileEntries: MenuEntry[] = [
    ...actions.map((action) => ({ label: `${action.label}...`, onPress: action.onPress })),
    ...(actions.length ? (['separator'] as const) : []),
    { label: 'Fechar', onPress: close },
  ];
  const viewEntries: MenuEntry[] = [
    ...(onRefresh ? [{ label: 'Atualizar', onPress: onRefresh }] : []),
    ...(compact
      ? []
      : [{ label: maximized ? 'Restaurar' : 'Maximizar', onPress: () => wm.toggleMaximize(route) }]),
    { label: 'Minimizar', onPress: () => wm.minimize(route) },
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
      style={[
        styles.frame,
        maximized ? styles.maximized : [styles.restored, { left: sideInset, right: sideInset }],
      ]}>
      <TitleBar
        title={title}
        icon={icon}
        maximized={maximized}
        onMinimize={() => wm.minimize(route)}
        onMaximize={compact ? undefined : () => wm.toggleMaximize(route)}
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
  maximized: { top: 0, left: 0, right: 0, bottom: 0 },
  restored: { top: spacing.xxl, bottom: spacing.xxl },
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
