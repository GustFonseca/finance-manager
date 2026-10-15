import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { queryClient } from '@/lib/queryClient';
import { gradients, webStyle } from '@/theme';
import { onContextMenu, useContextMenu } from './ContextMenu';
import { DesktopProvider, useDesktop } from './DesktopContext';
import { DesktopIcon } from './DesktopIcon';
import type { MenuEntry } from './MenuBar';
import { PROGRAMS } from './programs';
import { useWindowManager, WindowIdProvider } from './WindowManager';

/** The Windows XP "Bliss" photo, resized to 1920px for the web. */
const WALLPAPER = require('../../../assets/images/bliss.jpg');

export type ProgramScreens = Record<string, React.ComponentType>;

type Props = {
  /** Screen component for each program route; every open one is rendered as a window. */
  screens: ProgramScreens;
  /** Icons and windows other features put on the desktop (folders, Lixeira…). */
  extras?: React.ReactNode;
  children: React.ReactNode;
};

/** Wallpaper with the desktop icons, and every open window on top. */
export function Desktop(props: Props) {
  return (
    <DesktopProvider>
      <DesktopSurface {...props} />
    </DesktopProvider>
  );
}

function DesktopSurface({ screens, extras, children }: Props) {
  const { open, openWindows } = useWindowManager();
  const desktop = useDesktop();
  const contextMenu = useContextMenu();

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
      // Clicking the wallpaper clears the icon selection, as in XP.
      onPointerDown={() => desktop.selectIcon(null)}
      {...onContextMenu(showDesktopMenu)}>
      <Image source={WALLPAPER} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {PROGRAMS.map((program, index) => (
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
            <Screen />
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
    // Drawn while the wallpaper photo loads.
    ...webStyle({ backgroundImage: gradients.wallpaper, backgroundColor: '#5A9A2E' }),
  },
});
