import React from 'react';
import { StyleSheet, View } from 'react-native';
import { queryClient } from '@/lib/queryClient';
import { colors, gradients, webStyle } from '@/theme';
import { onContextMenu, useContextMenu } from './ContextMenu';
import { DesktopProvider, useDesktop } from './DesktopContext';
import { DesktopIcon } from './DesktopIcon';
import { PROGRAMS } from './programs';
import type { MenuEntry } from './MenuBar';
import { useDesktopPrograms } from './useVisiblePrograms';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { useWindowManager, WindowIdProvider } from './WindowManager';

export type ProgramScreens = Record<string, React.ComponentType>;

type Props = {
  screens: ProgramScreens;
  extras?: React.ReactNode;
  children: React.ReactNode;
};

export function Desktop(props: Props) {
  return (
    <DesktopProvider>
      <DesktopSurface {...props} />
    </DesktopProvider>
  );
}

function DesktopSurface({ screens, extras, children }: Props) {
  const { open, close, openWindows, zIndexOf } = useWindowManager();
  const desktop = useDesktop();
  const contextMenu = useContextMenu();
  const programs = useDesktopPrograms();

  const showDesktopMenu = (point: { x: number; y: number }) => {
    desktop.selectIcon(null);
    const extraEntries = desktop.backgroundMenu(point);
    const entries: MenuEntry[] = [
      { label: 'Organizar ícones', onPress: desktop.arrangeIcons },
      { label: 'Atualizar', onPress: () => queryClient.invalidateQueries() },
      ...(extraEntries.length ? (['separator', ...extraEntries] as MenuEntry[]) : []),
    ];
    contextMenu.show(point, entries);
  };

  return (
    <View
      style={styles.desktop}
      onPointerDown={() => desktop.selectIcon(null)}
      {...onContextMenu(showDesktopMenu)}>
      {programs.map((program, index) => (
        <DesktopIcon
          key={program.route}
          id={`program:${program.route}`}
          slot={index}
          label={program.title}
          icon={program.icon}
          color={program.color}
          onOpen={() => open(program.route)}
        />
      ))}
      {openWindows.map((id) => {
        const Screen = screens[id];
        return Screen ? (
          <WindowIdProvider key={id} value={id}>
            <WindowErrorBoundary
              title={PROGRAMS.find((program) => program.route === id)?.title ?? 'Finance Manager'}
              zIndex={zIndexOf(id)}
              onClose={() => close(id)}>
              <React.Suspense fallback={null}>
                <Screen />
              </React.Suspense>
            </WindowErrorBoundary>
          </WindowIdProvider>
        ) : null;
      })}
      {extras}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.desktop,
    ...webStyle({ backgroundImage: gradients.wallpaper }),
  },
});
