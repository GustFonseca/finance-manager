import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import type { MenuEntry } from './MenuBar';
import { TASKBAR_HEIGHT } from './StartMenu';
import type { Point } from './useWindowDrag';

const STORAGE_KEY = 'xp_desktop_icons';
/** Grid cell of an icon (tile + label) and the desktop margin. */
export const ICON_CELL = { width: 84, height: 80 };
const MARGIN = 8;

/** Where an icon goes until the user moves it: a grid slot, or XP's bottom-right (Lixeira). */
export type IconSlot = number | 'bottom-right';

/** Builds the extra entries of the desktop's right-click menu at the clicked point. */
export type DesktopMenuBuilder = (point: Point) => MenuEntry[];

type DesktopApi = {
  /**
   * False until the browser has mounted and the saved layout is loaded. Icons
   * wait for it: positions depend on the screen size, which the statically
   * rendered HTML doesn't know (and hydration wouldn't fix the styles).
   */
  ready: boolean;
  iconPosition: (id: string, slot: IconSlot) => Point;
  moveIcon: (id: string, point: Point) => void;
  /** Keeps a dragged icon inside the desktop. */
  clampIcon: (point: Point) => Point;
  /** Puts every icon back on its default slot ("Organizar ícones"). */
  arrangeIcons: () => void;
  selectedIcon: string | null;
  selectIcon: (id: string | null) => void;
  renamingIcon: string | null;
  startRename: (id: string) => void;
  stopRename: () => void;
  /** Entries other features add to the desktop's right-click menu. */
  backgroundMenu: (point: Point) => MenuEntry[];
  setBackgroundMenu: (builder: DesktopMenuBuilder | null) => void;
};

const DesktopContext = createContext<DesktopApi | null>(null);

/**
 * Desktop icon state: where each icon is (saved per browser), which one is
 * selected or being renamed, and the extra right-click menu entries.
 */
export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const desktopHeight = height - TASKBAR_HEIGHT;

  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [loaded, setLoaded] = useState(false);
  const [selectedIcon, selectIcon] = useState<string | null>(null);
  const [renamingIcon, setRenamingIcon] = useState<string | null>(null);
  const menuBuilder = useRef<DesktopMenuBuilder | null>(null);

  useEffect(() => {
    getItem(STORAGE_KEY).then((saved) => {
      if (saved) setPositions(JSON.parse(saved) as Record<string, Point>);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    // Don't overwrite the saved layout with an empty one before it loads.
    if (loaded) setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [loaded, positions]);

  const clampIcon = useCallback(
    (point: Point): Point => ({
      x: Math.min(Math.max(point.x, 0), width - ICON_CELL.width),
      y: Math.min(Math.max(point.y, 0), desktopHeight - ICON_CELL.height),
    }),
    [width, desktopHeight]
  );

  const iconPosition = useCallback(
    (id: string, slot: IconSlot): Point => {
      const saved = positions[id];
      if (saved) return clampIcon(saved);
      if (slot === 'bottom-right') {
        return {
          x: width - ICON_CELL.width - MARGIN,
          y: desktopHeight - ICON_CELL.height - MARGIN,
        };
      }
      // Fill columns top to bottom, then left to right, as XP auto-arranges.
      const rows = Math.max(1, Math.floor((desktopHeight - MARGIN * 2) / ICON_CELL.height));
      return {
        x: MARGIN + Math.floor(slot / rows) * ICON_CELL.width,
        y: MARGIN + (slot % rows) * ICON_CELL.height,
      };
    },
    [positions, clampIcon, width, desktopHeight]
  );

  const moveIcon = useCallback((id: string, point: Point) => {
    setPositions((prev) => ({ ...prev, [id]: point }));
  }, []);

  // Stable, so a registered builder isn't dropped when the context value changes.
  const setBackgroundMenu = useCallback((builder: DesktopMenuBuilder | null) => {
    menuBuilder.current = builder;
  }, []);
  const backgroundMenu = useCallback((point: Point) => menuBuilder.current?.(point) ?? [], []);

  const api = useMemo<DesktopApi>(
    () => ({
      ready: loaded,
      iconPosition,
      moveIcon,
      clampIcon,
      arrangeIcons: () => setPositions({}),
      selectedIcon,
      selectIcon,
      renamingIcon,
      startRename: (id) => {
        selectIcon(id);
        setRenamingIcon(id);
      },
      stopRename: () => setRenamingIcon(null),
      backgroundMenu,
      setBackgroundMenu,
    }),
    [loaded, iconPosition, moveIcon, clampIcon, selectedIcon, renamingIcon, backgroundMenu, setBackgroundMenu]
  );

  return <DesktopContext.Provider value={api}>{children}</DesktopContext.Provider>;
}

export function useDesktop(): DesktopApi {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error('useDesktop must be used within a DesktopProvider');
  return ctx;
}

/** Adds entries (e.g. "Nova pasta") to the desktop's right-click menu while mounted. */
export function useDesktopMenu(builder: DesktopMenuBuilder) {
  const { setBackgroundMenu } = useDesktop();
  // Always the latest builder, without re-registering on every render.
  setBackgroundMenu(builder);
  useEffect(() => () => setBackgroundMenu(null), [setBackgroundMenu]);
}
