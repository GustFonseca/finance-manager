import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { webStyle } from '@/theme';
import { MenuEntry, MenuPanel } from './MenuBar';
import type { Point } from './useWindowDrag';

/** Approximate menu size, to keep it inside the screen like Windows does. */
const MENU_WIDTH = 180;
const ITEM_HEIGHT = 21;
const SEPARATOR_HEIGHT = 7;

type ContextMenuApi = {
  show: (point: Point, entries: MenuEntry[]) => void;
  hide: () => void;
};

const ContextMenuContext = createContext<ContextMenuApi | null>(null);

type OpenMenu = { point: Point; entries: MenuEntry[] };

/** Hosts the single right-click menu of the desktop (only one is open at a time). */
export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const { width, height } = useWindowDimensions();

  const show = useCallback((point: Point, entries: MenuEntry[]) => setMenu({ point, entries }), []);
  const hide = useCallback(() => setMenu(null), []);
  const api = useMemo(() => ({ show, hide }), [show, hide]);

  let position: Point | null = null;
  if (menu) {
    const menuHeight = menu.entries.reduce(
      (sum, entry) => sum + (entry === 'separator' ? SEPARATOR_HEIGHT : ITEM_HEIGHT),
      6
    );
    // Opens up/left of the pointer when there's no room below/right of it.
    position = {
      x: menu.point.x + MENU_WIDTH > width ? Math.max(0, menu.point.x - MENU_WIDTH) : menu.point.x,
      y: menu.point.y + menuHeight > height ? Math.max(0, menu.point.y - menuHeight) : menu.point.y,
    };
  }

  return (
    <ContextMenuContext.Provider value={api}>
      {children}
      {menu && position ? (
        <>
          <Pressable
            style={styles.dismiss}
            onPress={hide}
            accessibilityLabel="Fechar menu"
            {...onContextMenu(hide)}
          />
          <MenuPanel
            entries={menu.entries}
            onRun={(entry) => {
              hide();
              entry.onPress();
            }}
            style={[styles.menu, webStyle({ left: position.x, top: position.y })]}
          />
        </>
      ) : null}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu(): ContextMenuApi {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('useContextMenu must be used within a ContextMenuProvider');
  return ctx;
}

/**
 * Props for a right-click handler. React Native's types have no
 * `onContextMenu`, but react-native-web forwards it to the DOM. The browser's
 * own menu is suppressed and inner handlers win over outer ones.
 */
export function onContextMenu(handler: (point: Point) => void): object {
  return {
    onContextMenu: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      handler({ x: event.clientX, y: event.clientY });
    },
  };
}

/**
 * Stops right-clicks from reaching the desktop behind (e.g. inside a window),
 * while keeping the browser's own menu for text fields.
 */
export const isolateContextMenu: object = {
  onContextMenu: (event: React.MouseEvent) => event.stopPropagation(),
};

const styles = StyleSheet.create({
  dismiss: webStyle({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1900 }),
  menu: webStyle({ position: 'fixed', zIndex: 2000 }),
});
